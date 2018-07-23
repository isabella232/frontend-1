// @flow

import React from "react";
import DocumentTitle from 'react-document-title';
import { createFragmentContainer, graphql } from 'react-relay/compat';

import Badge from '../../shared/Badge';
import Button from '../../shared/Button';
import Icon from "../../shared/Icon";
import PageHeader from "../../shared/PageHeader";
import Panel from '../../shared/Panel';


type Props = {
  viewer: {
    totp: ?{
      id: string,
      recoveryCodes: Array<string>
    }
  }
};

class TwoFactorIndex extends React.PureComponent<Props> {
  render() {
    return (
      <DocumentTitle title={`Two-Factor Authentication`}>
        <div className="container">
          <PageHeader>
            <PageHeader.Icon>
              <Icon
                icon="placeholder"
                style={{ width: 34, height: 34, marginTop: 3, marginLeft: 3 }}
              />
            </PageHeader.Icon>
            <PageHeader.Title>
              Two-Factor Authentication {this.renderBadge()}
            </PageHeader.Title>
            <PageHeader.Description>
              Manage your two-factor authentication settings.
            </PageHeader.Description>
            {this.renderHeaderAction()}
          </PageHeader>

          {this.renderCurrentStatus()}
          {this.renderRecoveryCodes()}

          <a
            className="blue hover-navy text-decoration-none hover-underline"
            href="/user/settings"
          >
            Back to Personal Settings
          </a>
        </div>
      </DocumentTitle>
    );
  }

  renderBadge() {
    if (!this.props.viewer.totp) {
      return;
    }

    return (
      <Badge className="bg-lime">Active</Badge>
    );
  }

  renderHeaderAction() {
    if (this.props.viewer.totp) {
      return (
        <PageHeader.Menu>
          <Button
            theme="error"
            outline={true}
            link="/user/two-factor/delete"
          >
            Remove
          </Button>
        </PageHeader.Menu>
      );
    }

    return (
      <PageHeader.Menu>
        <Button
          theme="success"
          link="/user/two-factor/configure"
        >
          Get Started
        </Button>
      </PageHeader.Menu>
    );
  }

  renderCurrentStatus() {
    return (
      <Panel className="mb4">
        <Panel.Section>
          <p>Two-factor authentication is currently {this.props.viewer.totp ? 'active' : 'inactive'}.</p>
          <Button
            theme="success"
            link="/user/two-factor/configure"
          >
            {this.props.viewer.totp ? 'Reconfigure' : 'Get Started with'} Two-Factor Authentication
          </Button>
        </Panel.Section>
      </Panel>
    );
  }

  renderRecoveryCodes() {
    if (!this.props.viewer.totp) {
      return;
    }

    if (!this.props.viewer.totp.recoveryCodes) {
      <Panel>
        <Panel.Header>
          Recovery Codes
        </Panel.Header>
        <Panel.Section>
          <p>You don't currently have any recovery codes; this probably means you activated two-factor authentication during the earliest beta, nice work!</p>
          <p>Someday soon there'll be a "generate recovery codes" button here. For now, you can use the "reconfigure two-factor authentication" option above.</p>
        </Panel.Section>
        <Panel.Footer>
          <Button>
            View recovery codes
          </Button>
        </Panel.Footer>
      </Panel>
    }

    return (
      <Panel>
        <Panel.Header>
          Recovery Codes
        </Panel.Header>
        <Panel.Section>
          <p>Recovery codes will give access to your account if you lose access to your device and cannot retrieve two-factor authentication codes.</p>
          <p>
            Buildkite support cannot restore access to accounts with two-factor authentication enabled for security reasons.
            {' '}
            <strong>Keep your recovery codes in a safe place to ensure you are not locked out of your account.</strong>
          </p>
        </Panel.Section>
        <Panel.Footer>
          <Button>
            View recovery codes
          </Button>
        </Panel.Footer>
      </Panel>
    );
  }
}

export default createFragmentContainer(TwoFactorIndex, {
  viewer: graphql`
    fragment TwoFactor_viewer on Viewer {
      totp {
        id
      }
    }
  `
});
