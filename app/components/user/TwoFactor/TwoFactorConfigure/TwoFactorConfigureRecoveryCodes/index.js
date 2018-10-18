// @flow

import * as React from "react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Panel from 'app/components/shared/Panel';
import Button from 'app/components/shared/Button';
import RecoveryCodeList from 'app/components/RecoveryCodeList';
import type {
  RecoveryCodeList_recoveryCodes as RecoveryCodes
} from 'app/components/RecoveryCodeList/__generated__/RecoveryCodeList_recoveryCodes.graphql';

type Props = {
  onRegenerateRecoveryCodes: (callback?: () => void) => void,
  onNextStep: () => void,
  recoveryCodes: RecoveryCodes
};

type State = {
  isRegeneratingCodes: boolean,
  didCopyRecoveryCodes: boolean
};

export default class TwoFactorConfigureRecoveryCodes extends React.PureComponent<Props, State> {
  state = {
    didCopyRecoveryCodes: false,
    isRegeneratingCodes: false
  }

  get recoveryCodeText(): string {
    if (!this.props.recoveryCodes.codes) {
      return '';
    }
    return this.props.recoveryCodes.codes.map(({ code }) => code).join('\n');
  }

  render() {
    return (
      <Panel className="mt4">
        <Panel.Header>
          Recovery Codes
        </Panel.Header>
        <Panel.Section>
          <p>
            Recovery codes are used if you lose access to your OTP generator application. They’re the only way to get
            back into your account if you lose access to your Authenticator Application once it’s configured.
          </p>
        </Panel.Section>
        <Panel.Section>
          <Panel className="mb3 orange border-orange">
            <Panel.Section>
              <p>
                <strong>These codes should be treated just like your password!</strong>
                <br />
                We’d suggest saving them into a secure password manager, or printing them off and storing them
                somewhere safe.
              </p>
            </Panel.Section>
          </Panel>
          <Panel>
            <Panel.Section>
              <Button
                theme="success"
                outline={true}
                disabled={this.state.isRegeneratingCodes}
                onClick={this.handleRegenerateRecoveryCode}
              >
                Regenerate Codes
              </Button>
              <RecoveryCodeList
                recoveryCodes={this.props.recoveryCodes}
                isRegeneratingCodes={this.state.isRegeneratingCodes}
              />
              <CopyToClipboard text={this.recoveryCodeText} onCopy={this.handleRecoveryCodeCopy}>
                <Button
                  className="col-12"
                  theme={this.state.didCopyRecoveryCodes ? 'default' : 'success'}
                  disabled={this.state.isRegeneratingCodes}
                >
                  {this.state.didCopyRecoveryCodes ? 'Copied!' : 'Copy'}
                </Button>
              </CopyToClipboard>
            </Panel.Section>
          </Panel>
        </Panel.Section>
        <Panel.Footer>
          <Button
            className="col-12"
            theme={this.state.didCopyRecoveryCodes ? 'success' : 'default'}
            onClick={this.props.onNextStep}
          >
            Continue
          </Button>
        </Panel.Footer>
      </Panel>
    );
  }

  handleRegenerateRecoveryCode = () => {
    this.setState({ isRegeneratingCodes: true }, () => {
      this.props.onRegenerateRecoveryCodes(() => {
        this.setState({ isRegeneratingCodes: false });
      });
    });
  }

  handleRecoveryCodeCopy = (_text: string, result: boolean) => {
    if (!result) {
      alert('We couldnʼt put this on your clipboard for you, please copy it manually!');
      return;
    }
    this.setState({ didCopyRecoveryCodes: true });
  }
}
