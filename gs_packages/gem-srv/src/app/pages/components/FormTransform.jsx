/* eslint-disable react/destructuring-assignment */
import React from 'react';
import UR from '@gemstep/ursys/client';
import clsx from 'clsx';
import { ACLocales } from '../../../modules/appcore';

const PR = UR.PrefixUtil('FormTransform', 'TagRed');
const DBG = false;
export default class FormTransform extends React.Component {
  constructor() {
    super();
    const state = UR.ReadFlatStateGroups('locales');
    if (DBG) console.log(...PR('init state', state));
    this.state = state;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('locales', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('locales', this.urStateUpdated);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (name === 'localeId') {
      UR.WriteState('locales', name, Number(value));
    } else {
      UR.WriteState('locales.transform', name, value);
    }
  }

  urStateUpdated(stateObj, cb) {
    const { localeNames, localeId, transform } = stateObj;
    if (localeNames) {
      this.setState({ localeNames });
    }
    if (localeId !== undefined) {
      const locale = ACLocales.GetLocale(localeId);
      console.log('...updating locale', localeId, 'from', locale);
      if (locale) {
        this.setState({ localeId, transform: locale.ptrack });
      }
    }
    if (transform) {
      console.log(...PR('update transform'), transform);
      this.setState({ transform }); // { transform: { ... } }
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title = 'Transform' } = this.props;
    const localeList = this.state.localeNames || [];
    const {
      xScale,
      yScale,
      zRot,
      xOff,
      yOff,
      xRange,
      yRange,
      memo
    } = this.state.transform;

    return (
      <>
        <div className="io-transform" style={{ clear: 'both' }}>
          <label
            style={{ width: 'auto', fontSize: 'larger', fontWeight: 'bold' }}
          >
            {title}
          </label>
        </div>

        <div className={clsx('io-track-controls', 'io-transform')}>
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
              value={xRange}
              onChange={this.handleInputChange}
            />{' '}
            X-RANGE
          </label>
          <label>
            <input
              name="yRange"
              type="number"
              value={yRange}
              onChange={this.handleInputChange}
            />{' '}
            Y-RANGE
          </label>
          <div>{memo}</div>
        </div>
      </>
    );
  }
}
