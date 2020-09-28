/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemShell - React App Container

  Loaded by SystemInit which wraps a HashRouter around it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { Suspense } from 'react';
import UR from '@gemstep/ursys/client';
import PropTypes from 'prop-types';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SystemShell');

/// ROUTES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// LAZY LOADING
const Tracker = React.lazy(() => import('../pages/Tracker'));
const Generator = React.lazy(() => import('../pages/Generator'));
const Home = React.lazy(() => import('../pages/Home'));
/// ROUTE DEFINITION
const LazyTracker = () => (
  <Suspense fallback={<div>loading</div>}>
    <Tracker />
  </Suspense>
);
const LazyGenerator = () => (
  <Suspense fallback={<div>loading</div>}>
    <Generator />
  </Suspense>
);
const LazyHome = () => (
  <Suspense fallback={<div>loading</div>}>
    <Home />
  </Suspense>
);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SystemShell extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
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
        <Route path="/app/tracker">
          <LazyTracker />
        </Route>
        <Route path="/app/generator">
          <LazyGenerator />
        </Route>
        <Route path="/app*">
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
