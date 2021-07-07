/* eslint-disable react/destructuring-assignment */
import React from 'react';
import UR from '@gemstep/ursys/client';
import clsx from 'clsx';

const PR = UR.PrefixUtil('FormTransform', 'TagRed');
const DBG = true;
export default class FormTransform extends React.Component {
  constructor() {
    super();
    const { transform, localeNames } = UR.ReadStateGroup(
      'transform',
      'localeNames'
    );
    const state = { ...transform, localeNames };
    console.log(...PR('init state', state));
    this.state = state;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleStateUpdate = this.handleStateUpdate.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState(this.handleStateUpdate);
  }

  componentWillUnmount() {
    UR.UnsubscribeState(this.handleStateUpdate);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (DBG) console.log(...PR(name, value));
    if (name === 'localeId') UR.HandleStateChange('app', name, value);
    else UR.HandleStateChange('transform', name, value);
  }

  handleStateUpdate(change, cb) {
    const { localeNames, app, transform } = change;
    if (localeNames) {
      this.setState({ localeNames });
    }
    if (app) {
      const { id, localeId } = app;
      if (id) this.setState({ localeId: id });
      if (localeId) this.setState({ localeId });
      const { locales } = UR.ReadStateGroup('locales');
      const locale = locales.find(l => l.id === Number(localeId));
      if (locale) {
        const newState = { ...locale.ptrack };
        this.setState(newState);
      }
    }
    if (transform) {
      this.setState({ ...transform });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title = 'Transform' } = this.props;
    const localeList = this.state.localeNames || [];
    const { xScale, yScale, zRot, xOff, yOff, xRange, yRange, memo } = this.state;
    return (
      <>
        <div className="io-track-controls">
          <select
            name="localeId"
            value={this.state.localeId}
            onChange={this.handleInputChange}
            className={clsx('form-control', 'data-track')}
          >
            {localeList.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <label className="control-label">&nbsp;Data Track</label>
        </div>
        <div className="io-transform" style={{ clear: 'both' }}>
          <label
            style={{ width: 'auto', fontSize: 'larger', fontWeight: 'bold' }}
          >
            {title}
          </label>
          <br />
          <label>
            <input
              name="xScale"
              type="number"
              value={xScale}
              onChange={this.handleInputChange}
            />{' '}
            X-SCALE
          </label>
          <label>
            <input
              name="yScale"
              type="number"
              value={yScale}
              onChange={this.handleInputChange}
            />{' '}
            Y-SCALE
          </label>
          <br />

          <label>
            <input
              name="zRot"
              type="number"
              value={zRot}
              onChange={this.handleInputChange}
            />{' '}
            Z ROT
          </label>
          <br />
          <label>
            <input
              name="xOff"
              type="number"
              value={xOff}
              onChange={this.handleInputChange}
            />{' '}
            X-OFF{' '}
          </label>
          <label>
            <input
              name="yOff"
              type="number"
              value={yOff}
              onChange={this.handleInputChange}
            />{' '}
            Y-OFF
          </label>
          <br />
          <label>
            <input
              name="xRange"
              type="number"
              value={xRange || 5}
              onChange={this.handleInputChange}
            />{' '}
            X-RANGE
          </label>
          <label>
            <input
              name="yRange"
              type="number"
              value={yRange || 5}
              onChange={this.handleInputChange}
            />{' '}
            Y-RANGE
          </label>
        </div>
        <div>{memo}</div>
      </>
    );
  }
}
