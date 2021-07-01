/* eslint-disable react/destructuring-assignment */
import React from 'react';
import * as MOD from '../elements/dev-tracker-ui';

export default class TransformPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      xScale: 1,
      yScale: 1,
      zRot: 0,
      xOff: 0,
      yOff: 0,
      xRange: 1,
      yRange: 1
    };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    MOD.Subscribe(this);
  }
  componentWillUnmount() {
    MOD.Unsubscribe(this);
  }
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    console.log(value);
    MOD.HandleStateChange(this, name, value);
  }

  render() {
    const { title = 'Transform' } = this.props;
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
            value={this.state.xScale}
            onChange={this.handleInputChange}
          />{' '}
          X-SCALE
        </label>
        <label>
          <input
            name="yScale"
            type="number"
            value={this.state.yScale}
            onChange={this.handleInputChange}
          />{' '}
          Y-SCALE
        </label>
        <br />

        <label>
          <input
            name="zRot"
            type="number"
            value={this.state.zRot}
            onChange={this.handleInputChange}
          />{' '}
          Z ROT
        </label>
        <br />
        <label>
          <input
            name="xOff"
            type="number"
            value={this.state.xOff}
            onChange={this.handleInputChange}
          />{' '}
          X-OFF{' '}
        </label>
        <label>
          <input
            name="yOff"
            type="number"
            value={this.state.yOff}
            onChange={this.handleInputChange}
          />{' '}
          Y-OFF
        </label>
        <br />
        <label>
          <input
            name="xRange"
            type="number"
            value={this.state.xRange || 5}
            onChange={this.handleInputChange}
          />{' '}
          X-RANGE
        </label>
        <label>
          <input
            name="yRange"
            type="number"
            value={this.state.yRange || 5}
            onChange={this.handleInputChange}
          />{' '}
          Y-RANGE
        </label>
      </div>
    );
  }
}
