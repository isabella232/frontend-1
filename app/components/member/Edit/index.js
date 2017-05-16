import React from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import DocumentTitle from 'react-document-title';

import Button from '../../shared/Button';
import PageHeader from '../../shared/PageHeader';
import Panel from '../../shared/Panel';
import Spinner from '../../shared/Spinner';
import UserAvatar from '../../shared/UserAvatar';

import MemberEditRole from './Role';
import MemberEditRemove from './Remove';

import TeamMemberRow from './TeamMemberRow';

const AVATAR_SIZE = 50;
const INITIAL_PAGE_SIZE = 5;
const PAGE_SIZE = 20;

class MemberEdit extends React.PureComponent {
  static propTypes = {
    viewer: PropTypes.shape({
      user: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
    organizationMember: PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      user: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        avatar: PropTypes.shape({
          url: PropTypes.string.isRequired
        }).isRequired
      }).isRequired,
      teams: PropTypes.shape({
        count: PropTypes.number.isRequired,
        pageInfo: PropTypes.shape({
          hasNextPage: PropTypes.bool.isRequired
        }).isRequired,
        edges: PropTypes.arrayOf(
          PropTypes.shape({
            node: PropTypes.object.isRequired
          }).isRequired
        ).isRequired
      }).isRequired
    }),
    relay: PropTypes.object.isRequired
  };

  render() {
    if (!this.props.organizationMember) {
      return null;
    }

    return (
      <DocumentTitle title={`Users · ${this.props.organizationMember.user.name}`}>
        <div>
          <PageHeader>
            <PageHeader.Icon>
              <UserAvatar
                user={this.props.organizationMember.user}
                className="align-middle mr2"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              />
            </PageHeader.Icon>
            <PageHeader.Title>
              {this.props.organizationMember.user.name}
            </PageHeader.Title>
            <PageHeader.Description>
              {this.props.organizationMember.user.email}
            </PageHeader.Description>
            <PageHeader.Menu>
              <MemberEditRemove
                viewer={this.props.viewer}
                organizationMember={this.props.organizationMember}
              />
            </PageHeader.Menu>
          </PageHeader>
          <MemberEditRole
            viewer={this.props.viewer}
            organizationMember={this.props.organizationMember}
          />
          {this.renderTeamsPanel()}
        </div>
      </DocumentTitle>
    );
  }

  renderTeamsPanel() {
    if (this.props.organizationMember.teams.edges.length > 0) {
      return (
        <div className="mb4">
          <h2 className="h2">Teams</h2>
          <Panel>
            {this.renderTeams()}
            {this.renderTeamsFooter()}
          </Panel>
        </div>
      );
    }
  }

  renderTeams() {
    return this.props.organizationMember.teams.edges.map(({ node }) => (
      <TeamMemberRow
        key={node.id}
        teamMember={node}
      />
    ));
  }

  renderTeamsFooter() {
    // don't show any footer if we haven't ever loaded
    // any teams, or if there's no next page
    if (!this.props.organizationMember.teams || !this.props.organizationMember.teams.pageInfo.hasNextPage) {
      return;
    }

    let footerContent = (
      <Button
        outline={true}
        theme="default"
        onClick={this.handleLoadMoreTeamsClick}
      >
        Show more teams…
      </Button>
    );

    // show a spinner if we're loading more teams
    if (this.state.loadingTeams) {
      footerContent = <Spinner style={{ margin: 9.5 }} />;
    }

    return (
      <Panel.Footer className="center">
        {footerContent}
      </Panel.Footer>
    );
  }

  handleLoadMoreTeamsClick = () => {
    this.setState({ loadingTeams: true });

    let { teamsPageSize } = this.props.relay.variables;

    teamsPageSize += PAGE_SIZE;

    this.props.relay.setVariables(
      { teamsPageSize },
      (readyState) => {
        if (readyState.done) {
          this.setState({ loadingTeams: false });
        }
      }
    );
  };
}

export default Relay.createContainer(MemberEdit, {
  initialVariables: {
    teamsPageSize: INITIAL_PAGE_SIZE
  },

  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        ${MemberEditRole.getFragment('viewer')}
        ${MemberEditRemove.getFragment('viewer')}
        user {
          id
        }
      }
    `,
    organizationMember: () => Relay.QL`
      fragment on OrganizationMember {
        ${MemberEditRole.getFragment('organizationMember')}
        ${MemberEditRemove.getFragment('organizationMember')}
        uuid
        user {
          id
          name
          email
          avatar {
            url
          }
        }
        teams(first: $teamsPageSize, order: NAME) {
          count
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              id
              ${TeamMemberRow.getFragment('teamMember')}
            }
          }
        }
      }
    `
  }
});
