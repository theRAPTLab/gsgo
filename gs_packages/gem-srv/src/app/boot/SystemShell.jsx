/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemShell - React App Container

  Loaded by SystemInit which wraps a HashRouter around it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';

import {
  LazyTracker,
  LazyFakeTrack,
  LazyCompiler,
  LazyLogin,
  LazyModel,
  LazyMissionControl,
  LazyScriptEditor,
  LazyViewer,
  LazyHome,
  LazyXGUI
} from './SystemRoutes';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SystemShell');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SystemShell extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  render() {
    const { hasError, error } = this.state;
    // omg an error???
    if (hasError) return <p>{error}</p>;
    // otherwise return component with matching routed view
    return (
      <Switch>
        <Route exact path="/">
          <LazyHome />
        </Route>
        <Route path="/app/xgui">
          <LazyXGUI />
        </Route>
        <Route path="/app/faketrack">
          <LazyFakeTrack />
        </Route>
        <Route path="/app/tracker">
          <LazyTracker />
        </Route>
        <Route path="/app/compiler">
          <LazyCompiler />
        </Route>
        <Route path="/app/login">
          <LazyLogin />
        </Route>
        <Route path="/app/model">
          <LazyModel />
        </Route>
        <Route path="/app/missioncontrol">
          <LazyMissionControl />
        </Route>
        <Route path="/app/scripteditor">
          <LazyScriptEditor />
        </Route>
        <Route path="/app/viewer">
          <LazyViewer />
        </Route>
        <Route exact path="/app">
          <LazyHome />
        </Route>
        <Route path="/app/*">
          <div style={{ whiteSpace: 'pre', fontFamily: 'monospace' }}>
            NO ROUTE FOR PATH
            <br />
            <a href="/">GO TO INDEX</a>
          </div>
        </Route>
      </Switch>
    );
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
SystemShell.defaultProps = {
  classes: {}
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({ prop:ProtType })
/// to describe them in more detail
SystemShell.propTypes = {
  classes: PropTypes.shape({})
};

/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemShell;
