/* eslint-disable react/sort-comp */
import React from 'react';
// URSYS
import UR from '@gemstep/ursys/client';
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
UR.HandleMessage('NET:DISPLAY_LIST', remoteList => {
  console.log('got displaylist', remoteList.length);
});

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
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
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
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        }}
      >
        <div
          className="navbar"
          style={{
            display: 'flex',
            height: '40px'
          }}
        >
          <div
            id={TAB.HOME}
            className={`navbtn ${selectedAppTab === TAB.HOME && 'selected'}`}
            onClick={this.OnTabClick}
          >
            MODELS
          </div>
          {isLoggedIn && selectedModelId && (
            <div
              id={TAB.RUN}
              className={`navbtn ${selectedAppTab === TAB.RUN && 'selected'}`}
              onClick={this.OnTabClick}
            >
              RUN {modelName}
            </div>
          )}
          {isLoggedIn && selectedModelId && (
            <div
              id={TAB.EDIT}
              className={`navbtn ${selectedAppTab === TAB.EDIT && 'selected'}`}
              onClick={this.OnTabClick}
            >
              EDIT
            </div>
          )}
          {isLoggedIn && selectedModelId && (
            <div
              id={TAB.COLLABORATOR}
              className={`navbtn ${
                selectedAppTab === TAB.COLLABORATOR && 'selected'
              }`}
              onClick={this.OnTabClick}
            >
              COLLABORATOR
            </div>
          )}
          <div
            id={TAB.DEV}
            className={`navbtn ${selectedAppTab === TAB.DEV && 'selected'}`}
            onClick={this.OnTabClick}
          >
            DEV
          </div>
          <div className="login" style={{ flexGrow: 1, textAlign: 'right' }}>
            MODEL:&nbsp;{modelName}&nbsp;&nbsp;GRP1:&nbsp;
            {name}
          </div>
        </div>
        <div
          className="main"
          style={{
            overflow: 'hidden',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {!isLoggedIn ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <h1>Login</h1>
              <input type="text" />
              <button onClick={this.OnLogin}>Log In</button>
            </div>
          ) : (
            <>
              {selectedAppTab === TAB.HOME && <AppHome />}
              {selectedAppTab === TAB.EDIT && <AppEdit />}
              {selectedAppTab === TAB.RUN && <AppRun />}
              {selectedAppTab === TAB.COLLABORATOR && <AppCollaborator />}
              {selectedAppTab === TAB.DEV && <AppDev />}
            </>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            backgroundColor: 'red'
          }}
        >
          DRAFT WIREFRAME v0.0.1 -- DO NOT PUBLISH OR DISTRIBUTE!
        </div>
      </div>
    );
  }
}

export default App;
