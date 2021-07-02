/* eslint-disable react/destructuring-assignment */
import React from 'react';
import UR from '@gemstep/ursys/client';
import * as MOD from '../elements/dev-tracker-ui';

const PR = UR.PrefixUtil('FormTransform', 'TagApp');
const DBG = true;
export default class FormTransform extends React.Component {
  constructor() {
    super();
    const { transform } = MOD.ReadState('transform');
    this.state = { ...transform };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleStateUpdate = this.handleStateUpdate.bind(this);
  }

  componentDidMount() {
    MOD.SubscribeState(this.handleStateUpdate);
  }

  componentWillUnmount() {
    MOD.UnsubscribeState(this.handleStateUpdate);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (DBG) console.log(value);
    MOD.WriteState('transform', name, value);
  }

  handleStateUpdate(change, cb) {
    if (change.app) {
      const { localeId } = change.app;
      console.log(...PR('UPDATE localeId', localeId));
      const { locales } = MOD.ReadState('locales');
      console.log('scanning locales', locales);
      const locale = locales.find(l => l.id === Number(localeId));
      if (locale) {
        const newState = { ...locale.ptrack };
        console.log('found locale', locale, 'writing', newState);
        this.setState(newState);
      }
    }
    if (change.transform) {
      console.log(...PR('UPDATE transform', change));
      this.setState(change.transform);
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title = 'Transform' } = this.props;
    const { xScale, yScale, zRot, xOff, yOff, xRange, yRange } = this.state;
    return (
      <div className="io-transform" style={{ clear: 'both' }}>
        <label style={{ width: 'auto', fontSize: 'larger', fontWeight: 'bold' }}>
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
    );
  }
}
