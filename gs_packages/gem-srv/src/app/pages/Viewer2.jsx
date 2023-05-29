/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Viewer -- Passive observer view

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelBlueprints from './components/PanelBlueprints';
import PanelLogs from './components/PanelLogs';
import DialogConfirm from './components/DialogConfirm';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'test/unit-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';
import './logPanel.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('VIEWER');
const DBG = false;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('logs', '0px auto 35%'); // columns
PANEL_CONFIG.set('sim', '0px auto 250px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Viewer2 extends React.Component {
  constructor() {
    super();
    this.state = {
      isReady: false,
      noMain: true,
      panelConfiguration: 'logs',
      projId: '',
      bpNamesList: [],
      logEntries: []
    };
    this.Initialize = this.Initialize.bind(this);
    this.RequestProjectData = this.RequestProjectData.bind(this);
    this.HandleBpNamesListUpdate = this.HandleBpNamesListUpdate.bind(this);
    this.HandleLogEvent = this.HandleLogEvent.bind(this);
    this.HandleInspectorUpdate = this.HandleInspectorUpdate.bind(this);
    this.OnModelClick = this.OnModelClick.bind(this);
    this.OnHomeClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);

    UR.HandleMessage('NET:LOG_EVENT', this.HandleLogEvent);
  }

  componentDidMount() {
    document.title = 'GEMSTEP Viewer';

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
            this.Initialize();
            this.setState({ noMain: false });
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

  componentWillUnmount() {
    UR.UnhandleMessage('NET:LOG_EVENT', this.HandleLogEvent);
  }

  Initialize() {
    if (this.state.isReady) return; // already initialized
    this.RequestProjectData();
    UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
    this.setState({ isReady: true });
    UR.LogEvent('Session', ['Viewer Connect']);
  }

  RequestProjectData() {
    if (DBG) console.log(...PR('RequestProjectData...'));
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetBpDefs'
    }).then(rdata => this.HandleBpNamesListUpdate(rdata));
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetInstanceidList'
    });
  }

  HandleBpNamesListUpdate(rdata) {
    this.setState({
      projId: rdata.result.projId,
      bpNamesList: rdata.result.bpNamesList
    });
  }
  HandleInstancesList(rdata) {
    this.setState({
      instances: rdata.instancesList
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  HandleSimInstanceHoverOver(data) {
    if (DBG) console.log('hover!');
  }

  HandleInspectorUpdate(data) {
    if (!data || data.agents === undefined) {
      console.error('OnInspectorUpdate got bad data', data);
      return;
    }
    this.setState({ instances: data.agents });
  }

  OnModelClick() {
    const { projId } = this.state;
    window.location = `/app/project?project=${projId}`;
  }

  HandleLogEvent(data) {
    let tempLogEntries = this.state.logEntries;
    tempLogEntries[tempLogEntries.length + 1] = {
      key: tempLogEntries.length,
      entry: data.logString
    };
    this.setState({ logEntries: tempLogEntries });
  }

  OnPanelClick(id) {
    if (DBG) console.log('click', id); // e, e.target, e.target.value);
    this.setState({
      panelConfiguration: id
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { noMain, panelConfiguration, projId, bpNamesList, logEntries } =
      this.state;
    const { classes } = this.props;

    document.title = `VIEWER ${projId}`;

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
            <span style={{ fontSize: '32px' }}>VIEWER {projId}</span>
          </div>
          <Link
            to={{ pathname: `/app/project?project=${projId}` }}
            className={classes.navButton}
          >
            Back to PROJECT
          </Link>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          <PanelBlueprints
            id="blueprints"
            projId={projId}
            bpNamesList={bpNamesList}
          />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'scroll'
            }}
          >
            <PanelLogs id="logs" logEntries={logEntries} />
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
export default withStyles(useStylesHOC)(Viewer2);
