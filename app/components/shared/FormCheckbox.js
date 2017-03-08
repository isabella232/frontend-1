import React from 'react';
import classNames from 'classnames';

import FormInputHelp from './FormInputHelp';
import FormInputErrors from './FormInputErrors';

export default class FormCheckbox extends React.Component {
  static propTypes = {
    label: React.PropTypes.string.isRequired,
    name: React.PropTypes.string,
    checked: React.PropTypes.bool,
    help: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    errors: React.PropTypes.array
  };

  render() {
    return (
      <div className="mb2">
        <label className="inline-block cursor-pointer" style={{ paddingLeft: '1.7em' }}>
          <input
            name={this.props.name}
            type="checkbox"
            checked={this.props.checked}
            onChange={this.props.onChange}
            className="absolute"
            style={{
              marginLeft: '-1.7em',
              cursor: this.props.disabled ? 'not-allowed' : 'inherit'
            }}
            disabled={this.props.disabled}
            ref={(_checkbox) => this._checkbox = _checkbox}
          />
          <span className={classNames('semi-bold', { red: this._hasErrors() })}>{this.props.label}</span><br />
          {this._renderHelp()}
        </label>
        {this._renderErrors()}
      </div>
    );
  }

  _hasErrors() {
    return this.props.errors && this.props.errors.length > 0;
  }

  _renderErrors() {
    if (this._hasErrors()) {
      return (
        <FormInputErrors errors={this.props.errors}/>
      );
    }
  }

  _renderHelp() {
    if (this.props.help) {
      return (
        <FormInputHelp html={this.props.help}/>
      );
    }
  }
}
