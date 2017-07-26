import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import creditCardType, { getTypeInfo, types as CardType } from 'credit-card-type';

import FormInputHelp from './FormInputHelp';
import FormInputErrors from './FormInputErrors';
import FormInputLabel from './FormInputLabel';

const FALLBACK_CARD_LENGTH = 20;
const CARD_GAP_STRING = ' ';

export default class FormCreditCardField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
    name: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    help: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    errors: PropTypes.array,
    required: PropTypes.bool
  };

  state = {
    value: ''
  }

  // NOTE: We make the input a controlled component within the
  // context of the credit card field so that usages can reset the value
  // via defaultValue without controlling the entire component themselves
  componentWillMount() {
    if (this.props.defaultValue) {
      this.setState({ value: this.props.defaultValue });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.defaultValue !== this.props.defaultValue) {
      this.setState({ value: nextProps.defaultValue || '' });
    }
  }

  render() {
    return (
      <div className="mb2">
        <FormInputLabel
          label={this.props.label}
          errors={this._hasErrors()}
          required={this.props.required}
        >
          {this._renderInput()}
        </FormInputLabel>
        {this._renderErrors()}
        {this._renderHelp()}
      </div>
    );
  }

  getMaxLength() {
    const { matchingCardType } = this.state;

    if (!matchingCardType) {
      return FALLBACK_CARD_LENGTH;
    }

    // Calculate the maximum card length for the identified type

    // We take the maximum length the card type presents
    const maxLength = Math.max(...matchingCardType.lengths);

    // And add one for each possible gap character
    const cardGaps = matchingCardType.gaps.length * CARD_GAP_STRING.length;

    return maxLength + cardGaps;
  }

  _renderInput() {
    return (
      <input
        className={classNames("input", { "is-error": this._hasErrors() }, this.props.className)}
        name={this.props.name}
        type="tel"
        disabled={this.props.disabled}
        value={this.state.value}
        maxLength={this.getMaxLength()}
        placeholder={this.props.placeholder}
        spellCheck={false}
        onChange={this.handleInputChange}
        required={this.props.required}
        ref={(input) => this.input = input}
      />
    );
  }

  handleInputChange = (evt) => {
    const { value } = evt.target;

    let processedValue = value.replace(/[^0-9]+/g, '');

    const matchingCardType = creditCardType(processedValue)
      .filter((card) => (
        card.type == CardType.VISA || card.type == CardType.MASTERCARD || card.type == CardType.AMERICAN_EXPRESS
      ))
      .shift();

    console.debug('matchingCardType', matchingCardType && matchingCardType.niceType);

    if (matchingCardType) {
      const offsets = [0].concat(matchingCardType.gaps).concat([processedValue.length]);
      const components = [];

      for (var i = 0; offsets[i] < processedValue.length; i++) {
        var start = offsets[i];
        var end = Math.min(offsets[i + 1], processedValue.length);
        components.push(processedValue.substring(start, end));
      }

      processedValue = components.join(CARD_GAP_STRING);
    }

    this.setState(
      { value: processedValue, matchingCardType },
      () => {
        this.props.onChange(processedValue);
      }
    );
  };

  getValue() {
    return this.state.value;
  }

  focus() {
    this.input.focus();
  }

  _hasErrors() {
    return this.props.errors && this.props.errors.length > 0;
  }

  _hasEmptyValue() {
    return !this.props.value || this.props.value.length === 0;
  }

  _renderErrors() {
    if (this._hasErrors()) {
      return (
        <FormInputErrors errors={this.props.errors} />
      );
    }
  }

  _renderHelp() {
    if (this.props.help) {
      return (
        <FormInputHelp html={this.props.help} />
      );
    }
  }
}
