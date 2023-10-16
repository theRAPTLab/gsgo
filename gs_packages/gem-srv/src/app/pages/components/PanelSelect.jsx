import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelect extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select',
      options: [
        // Dummy Data
        { route: 'main', label: 'Main' },
        { route: 'viewer', label: 'Viewer' },
        { route: 'viewerLogs', label: 'Log Viewer' },
        { route: 'charcontrol3', label: 'Character Controller' },
        { route: 'scripteditor', label: 'Script Editor' }
      ]
    };
    this.Initialize = this.Initialize.bind(this);
    this.OnClick = this.OnClick.bind(this);

    // System Hooks
    UR.HookPhase('UR/APP_START', this.Initialize);
  }

  async Initialize() {
    // 1. Check for other 'Sim' devices.
    const devices = UR.GetDeviceDirectory();
    const sim = devices.filter(d => d.meta.uclass === 'Sim');
    if (sim.length > 0) {
      // HACKY
      this.setState(state => ({
        options: state.options.map(o => {
          if (o.id === 'main') o.disabled = true;
          return o;
        })
      }));
    }
  }

  OnClick(url) {
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    let { parms } = this.props;
    window.location = `/app/${url}?${parms}`;
  }

  render() {
    const { title, options } = this.state;
    const { id, parms, projId, isActive, onClick, classes } = this.props;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '200px',
              padding: '30px'
            }}
          >
            {options.map(m => (
              <button
                type="button"
                className={classes.button}
                key={m.route}
                disabled={m.disabled}
                onClick={() => this.OnClick(m.route)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelect);
