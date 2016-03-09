import React from "react";

class Row extends React.Component {
  static displayName = "Panel.Row";

  static propTypes = {
    children: React.PropTypes.node.isRequired
  };

  render() {
    let children = React.Children.toArray(this.props.children);

    // Filter out the actions from the rest of the children
    let nodes = [];
    let actions;
    children.forEach((child) => {
      if(child.type.displayName == "Panel.RowActions") {
        actions = child;
      } else {
        nodes.push(child);
      }
    });

    return (
      <div className="border-gray border-top">
        <div className="py2 px3 flex items-center">
          <div className="flex-auto">
            {nodes}
          </div>
          {actions}
        </div>
      </div>
    );
  }
}

export default Row;