/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker Setup -- Setup screen for PTrack and Pozyx input systems

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import DialogConfirm from './components/DialogConfirm';

import PanelTracker from './components/PanelTracker';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACKERSETUP');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('default', '0px auto 400px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class TrackerSetup extends React.Component {
  constructor() {
    super();
    this.state = {
      noMain: true,
      panelConfiguration: 'default'
    };
    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {
    document.title = 'GEMSTEP Tracker Setup';

    // start URSYS
    UR.SystemAppConfig({ autoRun: true });

    UR.HookPhase('UR/APP_START', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'Sim',
        notify: deviceLists => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { selected, quantified, valid } = deviceLists;
          if (valid) {
            if (DBG) console.log(...PR('Main Sim Online!'));
            this.setState({ noMain: false });
            UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
            UR.RaiseMessage('INIT_TRACKER');
          } else {
            this.setState({ noMain: true });
          }
        }
      });
    });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {}

  OnPanelClick(id) {
    if (DBG) console.log('click', id); // e, e.target, e.target.value);
    this.setState({
      panelConfiguration: id
    });
  }

  render() {
    const { noMain, panelConfiguration } = this.state;
    const { classes } = this.props;

    const DialogNoMain = (
      <DialogConfirm
        open={noMain}
        message={'Waiting for a "Main" project to load...'}
        yesMessage=""
        noMessage=""
      />
    );

    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration)
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3', display: 'flex' }}
        >
          <div style={{ flexGrow: '1' }}>
            <span style={{ fontSize: '32px' }}>TRACKER SETUP</span>
          </div>
        </div>
        <div
          id="console-left"
          className={classes.left}
          style={{ backgroundColor: 'transparent' }}
        />
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelTracker />
          </div>
        </div>
        <div
          id="console-bottom"
          className={classes.bottom}
          style={{ gridColumnEnd: 'span 3' }}
        >
          {DialogNoMain}
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(TrackerSetup);
