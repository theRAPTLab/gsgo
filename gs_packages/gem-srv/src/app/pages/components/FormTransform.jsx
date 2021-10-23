/* eslint-disable react/destructuring-assignment */
import React from 'react';
import UR from '@gemstep/ursys/client';
import clsx from 'clsx';
import { ACLocales } from '../../../modules/appcore';

const PR = UR.PrefixUtil('FormTransform', 'TagRed');
const DBG = true;
export default class FormTransform extends React.Component {
  constructor() {
    super();
    const state = UR.ReadFlatStateGroups('locales');
    if (DBG) console.log(...PR('init state', state));
    this.state = state; // read from ACLocales

    // add UI states
    this.state.selectedTrack = 'ptrack'; // show ptrack by default

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTrackChange = this.handleTrackChange.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('locales', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('locales', this.urStateUpdated);
  }

  handleInputChange(event) {
    const { selectedTrack } = this.state;
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (name === 'localeId') {
      UR.WriteState('locales', name, Number(value));
    } else {
      UR.WriteState(`locales.${selectedTrack}`, name, value);
    }
  }

  handleTrackChange(event) {
    const selectedTrack = event.target.value;
    this.setState({ selectedTrack });
  }

  urStateUpdated(stateObj, cb) {
    const { localeNames, localeId, ptrack, pozyx } = stateObj;

    // (1) localeName has changed
    if (localeNames) {
      this.setState({ localeNames });
    }

    // (2) localeId has changed
    if (localeId !== undefined) {
      console.log(...PR('localeId changed to', localeId));
      this.setState({ localeId });
    }
    // (3) transform key has changed
    if (ptrack) {
      if (DBG)
        console.log(
          ...PR(
            'update ptrack transform [',
            ...Object.entries(ptrack)
              .filter(([key]) => key !== 'memo')
              .map(([key, value]) => `${key}:${value} `),
            ']'
          )
        );
      // because transform is an object and setState only does shallow
      // merges, we have to reconstruct the entire transform otherise
      // uncontrolled component error occurs
      this.setState(state => ({
        ptrack: { ...state.ptrack, ...ptrack }
      }));
    }

    // (3) pozyx transform key has changed
    if (pozyx) {
      if (DBG)
        console.log(
          ...PR(
            'update pozyx transform [',
            ...Object.entries(pozyx)
              .filter(([key]) => key !== 'memo')
              .map(([key, value]) => `${key}:${value} `),
            ']'
          )
        );
      // because transform is an object and setState only does shallow
      // merges, we have to reconstruct the entire transform otherise
      // uncontrolled component error occurs
      this.setState(state => ({
        pozyx: { ...state.pozyx, ...pozyx }
      }));
    }
    // (4) callback
    if (typeof cb === 'function') cb();
  }

  render() {
    const { selectedTrack } = this.state;
    const { title = 'Set Transforms' } = this.props;
    const localeList = this.state.localeNames || [];
    const trackOptions = [
      { id: 'ptrack', name: 'PTrack' },
      { id: 'pozyx', name: 'Pozyx' }
    ];

    const { xScale, yScale, zRot, xOff, yOff, xRange, yRange, memo } = this.state[
      selectedTrack
    ];

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
          <br />

          <label className="control-label">&nbsp;Data Track</label>
          <select
            name="track"
            value={this.state.selectedTrack}
            onChange={this.handleTrackChange}
            className={clsx('form-control', 'data-track')}
          >
            {trackOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

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
          {/* NOT USED AT THE MOMENT?
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
          </label> */}
          <div>{memo}</div>
        </div>
      </>
    );
  }
}
