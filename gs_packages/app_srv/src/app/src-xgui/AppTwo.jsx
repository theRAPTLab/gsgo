/* eslint-disable react/sort-comp */
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
// URSYS
import UR from '@gemstep/ursys/client';
import * as SIM from '../modules/sim/api-sim';
// XGUI
import APP from './app-logic';
import AppHome from './components/AppHome';
import AppEdit from './components/AppEdit';
import AppRun from './components/AppRun';
import AppCollaborator from './components/AppCollaborator';
import AppDev from './components/AppDev';
import { TAB } from './constants';
import DISPATCHER from './dispatcher';
import './compiled-scss.css';

/// DISPLAY LIST TESTS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.NetSubscribe('NET:DISPLAY_LIST', remoteList => {
  console.log('got displaylist', remoteList.length);
});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook(
  'UR',
  'LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      (async () => {
        SIM.StartSimulation();
      })();
      resolve();
    })
);

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isLoggedIn: APP.GetLogin(),
      selectedAppTab: TAB.HOME,
      selectedModelId: undefined
    };
    this.OnLogin = this.OnLogin.bind(this);
    this.OnTabClick = this.OnTabClick.bind(this);
    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  componentDidMount() {
    // required URSYS lifecycle startup
    UR.SystemConfig({ autoRun: true }); // initialize renderer
    document.title = 'XGUI WIP';
  }

  HandleDATAUpdate(data) {
    this.forceUpdate();
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
    APP.SetLogin();
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
    APP.Unsubscribe(this);
  }

  render() {
    const { isLoggedIn, selectedAppTab, selectedModelId } = this.state;
    const { name } = this.props;
    const modelName = APP.GetModelName();
    /*
       EDIT, RUN, and COLLABORATE should be hidden
       until the user selects a model.
    */
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>TRACKER/TEST</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          console-left
        </div>
        <div id="root-renderer" className={classes.main} />
        <div id="console-right" className={clsx(classes.cell, classes.right)}>
          console-right
        </div>
        <div id="console-bottom" className={clsx(classes.cell, classes.bottom)}>
          console-bottom
        </div>
      </div>
    );
  }
}

export default App;
