/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Viewer -- Passive observer view

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import UR from '@gemstep/ursys/client';
import { Link } from 'react-router-dom';
import Project from 'lib/class-project';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelBlueprints from './components/PanelBlueprints';
import PanelInstances from './components/PanelInstances';
import DialogConfirm from './components/DialogConfirm';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('VIEWER');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('instances', '15% auto 150px'); // columns
PANEL_CONFIG.set('sim', '110px auto 150px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Viewer extends React.Component {
  constructor() {
    super();
    this.state = {
      isReady: false,
      noMain: true,
      panelConfiguration: 'sim',
      projId: '',
      bpidList: [],
      instances: []
    };
    this.Initialize = this.Initialize.bind(this);
    this.RequestProjectData = this.RequestProjectData.bind(this);
    this.HandleBpidList = this.HandleBpidList.bind(this);
    this.HandleInstancesList = this.HandleInstancesList.bind(this);
    this.HandleInspectorUpdate = this.HandleInspectorUpdate.bind(this);
    this.OnModelClick = this.OnModelClick.bind(this);
    this.OnHomeClick = this.OnModelClick.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    UR.HandleMessage('NET:INSPECTOR_UPDATE', this.HandleInspectorUpdate);
    UR.HandleMessage('NET:BPIDLIST_UPDATE', this.HandleBpidList);
    UR.HandleMessage('NET:INSTANCESLIST_UPDATE', this.HandleInstancesList);

    // Instance Interaction Handlers
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
  }

  componentDidMount() {
    document.title = 'GEMSTEP Viewer';

    // start URSYS
    UR.SystemAppConfig({ autoRun: true });

    UR.HookPhase('UR/APP_START', async () => {
      const devAPI = UR.SubscribeDeviceSpec({
        selectify: device => device.meta.uclass === 'Sim',
        notify: deviceLists => {
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
    UR.UnhandleMessage('NET:INSPECTOR_UPDATE', this.HandleInspectorUpdate);
    UR.UnhandleMessage('NET:BPIDLIST_UPDATE', this.HandleBpidList);
    UR.UnhandleMessage('NET:INSTANCESLIST_UPDATE', this.HandleInstacesList);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleSimInstanceHoverOver);
  }

  Initialize() {
    if (this.state.isReady) return; // already initialized
    this.RequestProjectData();
    UR.RaiseMessage('INIT_RENDERER'); // Tell PanelSimViewer to request boundaries
    this.setState({ isReady: true });
  }

  RequestProjectData() {
    if (DBG) console.log(...PR('RequestProjectData...'));
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetBpidList'
    }).then(rdata => this.HandleBpidList(rdata));
    UR.CallMessage('NET:REQ_PROJDATA', {
      fnName: 'GetInstanceidList'
    }).then(rdata => this.HandleInstancesList(rdata));
  }

  HandleBpidList(rdata) {
    console.error('getbpidList', rdata);
    this.setState({
      projId: rdata.result.projId,
      bpidList: rdata.result.bpidList
    });
  }
  HandleInstancesList(rdata) {
    this.setState({
      instances: rdata.result.instancesList
    });
  }

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
    window.location = `/app/model?project=${projId}`;
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
    const {
      noMain,
      panelConfiguration,
      projId,
      bpidList,
      instances
    } = this.state;
    const { classes } = this.props;

    document.title = `VIEWER ${projId}`;

    const DialogNoMain = (
      <DialogConfirm
        open={noMain}
        message={`Waiting for a "Main" project to load...`}
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
            to={{ pathname: `/app/model?project=${projId}` }}
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
          <PanelBlueprints id="blueprints" projId={projId} bpidList={bpidList} />
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div id="console-right" className={classes.right}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelInstances id="instances" instances={instances} />
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
export default withStyles(useStylesHOC)(Viewer);
