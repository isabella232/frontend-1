import React from "react";
import PropTypes from 'prop-types';
import {createFragmentContainer, graphql} from "react-relay/compat";

import Panel from "../../shared/Panel";
import Button from "../../shared/Button";
import Spinner from "../../shared/Spinner";

import { getCurrentQuery, setCurrentQuery, interpolateQuery } from "./query";
import { getGraphQLSchema } from "./graphql";
import { DEFAULT_QUERY_WITH_ORGANIZATION, DEFAULT_QUERY_NO_ORGANIZATION } from "./defaults";

import CodeMirror from 'codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/keymap/sublime';
import 'codemirror-graphql/results/mode';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;

class GraphQLExplorerConsole extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  state = {
    performance: null,
    executing: false,
    executedFirstQuery: false
  };

  componentDidMount() {
    const schema = getGraphQLSchema();

    this.editor = CodeMirror.fromTextArea(
      this.input,
      {
        lineNumbers: true,
        tabSize: 2,
        mode: 'graphql',
        keyMap: 'sublime',
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        viewportMargin: Infinity,
        gutters: ['CodeMirror-linenumbers'],
        theme: "graphql",
        extraKeys: {
	  'Cmd-Space': () => this.editor.showHint({ completeSingle: true }),
	  'Ctrl-Space': () => this.editor.showHint({ completeSingle: true }),
	  'Alt-Space': () => this.editor.showHint({ completeSingle: true }),
	  'Shift-Space': () => this.editor.showHint({ completeSingle: true }),

	  'Cmd-Enter': () => {
	    this.executeCurrentQuery();
	  },
	  'Ctrl-Enter': () => {
	    this.executeCurrentQuery();
	  },

	  // Persistent search box in Query Editor
	  'Cmd-F': 'findPersistent',
	  'Ctrl-F': 'findPersistent',

	  // Editor improvements
          'Ctrl-Left': 'goSubwordLeft',
          'Ctrl-Right': 'goSubwordRight',
          'Alt-Left': 'goGroupLeft',
          'Alt-Right': 'goGroupRight'
        },
        lint: {
          schema: schema
        },
        hintOptions: {
	  schema: schema,
	  closeOnUnfocus: false,
	  completeSingle: false
        }
      }
    );

    this.editor.on("change", this.onEditorChange);
    this.editor.on("keyup", this.onEditorKeyUp);

    this.outputCodeMirror = CodeMirror(this.outputContainerElement, {
      theme: "graphql",
      mode: "graphql-results",
      readOnly: true
    });
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.off("change", this.onEditorChange);
      this.editor.off("keyup", this.onEditorKeyUp);
      this.editor = null;
    }

    // Remove the output CodeMirror if we've created one
    if (this.outputCodeMirror) {
      this.outputCodeMirror = null;
    }
  }

  getDefaultQuery() {
    let query = getCurrentQuery();

    // If there isn't a query currently in local storage, let's make up one
    // based on one of the examples.
    if (!query) {
      // If we've got an organization loaded, let's use the default query that
      // looks at the first organization. If the user isn't part of any
      // organization, we'll use the default that doesn't retrieve organization
      // information.
      if (this.props.viewer.organizations.edges.length) {
        query = interpolateQuery(DEFAULT_QUERY_WITH_ORGANIZATION, {
          organization: this.props.viewer.organizations.edges[0].node
        });
      } else {
        query = DEFAULT_QUERY_NO_ORGANIZATION;
      }
    }

    return query;
  }

  render() {
    return (
      <div>
        <div className="mb3">
          <Button onClick={this.onExecuteClick} loading={this.state.executing && "Executing…"}>Execute</Button>
        </div>

        <div className="flex flex-fit border border-gray rounded" style={{width: "100%"}}>
          <div className="col-6 buildkite-codemirror" style={{minHeight: 500}}>
            <textarea
              defaultValue={this.getDefaultQuery()}
              ref={(input) => this.input = input}
            />
          </div>

          <div className="col-6 border-left border-gray buildkite-codemirror">
            {this.renderOutputPanel()}
          </div>
        </div>
      </div>
    );
  }

  renderOutputPanel() {
    // If we've gotten this far, then we're not executing, and we've got output :)
    let performanceInformationNode;
    if (this.state.performance) {
      performanceInformationNode = (
        <div className="px3 py2 border-top border-gray bg-silver col-12">
          <div className="bold black mb1">Performance 🚀</div>
          <pre className="monospace" style={{fontSize: 12}}>{this.state.performance.split("; ").join("\n")}</pre>
        </div>
      )
    }

    let helpfullMessageNode;
    if (!this.state.executedFirstQuery) {
      helpfullMessageNode = (
        <div className="flex items-center justify-center absolute" style={{top: 0, left: 0, right: 0, bottom: 0, zIndex: 30}}>
          <span>Hit the <span className="semi-bold">Execute</span> above button to run this query! ☝️ </span>
        </div>
      );
    }

    return (
      <div className="relative flex flex-wrap content-between" style={{height: "100%", width: "100%"}}>
        {helpfullMessageNode}
        <div ref={(el) => this.outputContainerElement = el} style={{width: "100%"}} className="p1" />
        {performanceInformationNode}
      </div>
    )
  }

  executeCurrentQuery() {
    this.setState({ executing: true, output: null, performance: null });

    fetch(window._graphql['url'], {
      method: 'post',
      body: JSON.stringify({ query: this.editor.getValue() }),
      credentials: "same-origin",
      headers: window._graphql["headers"],
    }).then((response) => {
      // Once we've got the resposne back, and converted it to JSON
      response.json().then((json) => {
        // Now that we've got back some real JSON, let's turn it back into a
        // string... The things we do to make it look pretty! (The 2 means
        // indent each nested object with 2 spaces)
        const prettyJSONString = JSON.stringify(json, null, 2);
        this.outputCodeMirror.setValue(prettyJSONString);

        // Tell the console we're not executing anymore, and that it can stop
        // showing a spinner. Also store any internal performance data so we
        // can show it.
        this.setState({
          performance: response.headers.get('x-buildkite-performance'),
          executing: false,
          executedFirstQuery: true
        });
      });
    });
  }

  onExecuteClick = () => {
    event.preventDefault();

    this.executeCurrentQuery();
  };

  onEditorChange = () => {
    // TODO: debounce this...
    setCurrentQuery(this.editor.getValue())
  };

  onEditorKeyUp = () => {
    if (AUTO_COMPLETE_AFTER_KEY.test(event.key)) {
      this.editor.execCommand('autocomplete');
    }
  };
}

export default createFragmentContainer(GraphQLExplorerConsole, {
  viewer: graphql`
    fragment GraphQLExplorerConsole_viewer on Viewer {
      organizations(first: 100) {
        edges {
          node {
            id
            name
            slug
          }
        }
      }
    }
  `
});