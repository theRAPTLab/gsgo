/* eslint-disable react/sort-comp */
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
// URSYS
import UR from '@gemstep/ursys/client';
import { useStylesHOC } from 'app/pages/elements/page-styles';
import * as DATACORE from 'modules/datacore';
import * as RENDERER from 'modules/render/api-render';
import * as SIM from 'modules/sim/api-sim';
// XGUI
import APPLOGIC from './app-logic';
import AppHome from './components/AppHome';
import AppEdit from './components/AppEdit';
import AppRun from './components/AppRun';
import AppCollaborator from './components/AppCollaborator';
import AppDev from './components/AppDev';
import { TAB } from './constants';
import DISPATCHER from './dispatcher';
//
import ModelPanel from './components/panels/ModelPanel';
import InstancesPanel from './components/panels/InstancesPanel';
import './compiled-scss.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SYSTEM', 'TagBlue');
const DBG = true;

/// MAIN APPLICATION ROOT /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isLoggedIn: APPLOGIC.GetLogin(),
      selectedAppTab: TAB.HOME,
      selectedModelId: undefined
    };
    this.OnLogin = this.OnLogin.bind(this);
    this.OnTabClick = this.OnTabClick.bind(this);
    // REGISTER as a Listener
    APPLOGIC.Subscribe(this);
  }

  componentDidMount() {
    // required URSYS lifecycle startup
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    document.title = 'XGUI2 WIP';
  }

  HandleDATAUpdate(data) {
    // this.forceUpdate();
    this.setState({
      instances: data.INSTANCES
    });
  }

  HandleUIUpdate(data) {
    this.setState({
      isLoggedIn: data.isLoggedIn,
      selectedAppTab: data.selectedAppTab || TAB.HOME, // always default to HOME
      selectedModelId: data.selectedModelId
    });
  }

  OnLogin() {
    this.setState({ isLoggedIn: true });
    APPLOGIC.SetLogin();
  }

  OnTabClick(e) {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectAppTab,
      params: {
        tabId: e.target.id
      }
    });
  }

  componentWillUnmount() {
    APPLOGIC.Unsubscribe(this);
  }

  render() {
    const { instances, isLoggedIn, selectedAppTab, selectedModelId } = this.state;
    const { name } = this.props;
    const modelName = APPLOGIC.GetModelName();
    /*
       EDIT, RUN, and COLLABORATE should be hidden
       until the user selects a model.
    */
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>XGUI AppTwo</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <InstancesPanel agents={instances} viewOnly />
        </div>
        <ModelPanel />
        <div id="console-right" className={clsx(classes.cell, classes.right)} />
        <div id="console-bottom" className={clsx(classes.cell, classes.bottom)} />
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(App);
