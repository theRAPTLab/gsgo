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
  LazyDevice,
  LazyCharacterController,
  LazyWizard,
  LazyLogin,
  LazyProject,
  LazyMain,
  LazyScriptEditor,
  LazyViewer,
  LazyTrackerSetup,
  LazyHome,
  LazyCodeTester
} from './SystemRoutes';

import CSS from './SystemShell.css';

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

  // https://reactjs.org/docs/error-boundaries.html
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
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
        <Route path="/app/charcontrol">
          <LazyCharacterController />
        </Route>
        <Route path="/app/login">
          <LazyLogin />
        </Route>
        <Route path="/app/project">
          <LazyProject />
        </Route>
        <Route path="/app/main">
          <LazyMain />
        </Route>
        <Route path="/app/scripteditor">
          <LazyScriptEditor />
        </Route>
        <Route path="/app/viewer">
          <LazyViewer />
        </Route>
        <Route path="/app/tracker">
          <LazyTrackerSetup />
        </Route>
        {/* Developer Routes */}
        <Route path="/app/dev-tracker">
          <LazyTracker />
        </Route>
        <Route path="/app/dev-compiler">
          <LazyCompiler />
        </Route>
        <Route path="/app/dev-faketrack">
          <LazyFakeTrack />
        </Route>
        <Route path="/app/dev-controller">
          <LazyDevice />
        </Route>
        <Route path="/app/dev-wizard">
          <LazyWizard />
        </Route>
        <Route path="/app/dev-codetester">
          <LazyCodeTester />
        </Route>

        {/* catchall routes */}
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
