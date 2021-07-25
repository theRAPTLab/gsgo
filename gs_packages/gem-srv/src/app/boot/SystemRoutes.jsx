import React, { Suspense } from 'react';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Home = React.lazy(() => import('../pages/Home'));
const CharControl = React.lazy(() => import('../pages/CharControl'));
const Login = React.lazy(() => import('../pages/Login'));
const Model = React.lazy(() => import('../pages/Model'));
const Main = React.lazy(() => import('../pages/Main'));
const ScriptEditor = React.lazy(() => import('../pages/ScriptEditor'));
const Viewer = React.lazy(() => import('../pages/Viewer'));
const TrackerSetup = React.lazy(() => import('../pages/TrackerSetup'));
const DevCompiler = React.lazy(() => import('../pages/DevCompiler-v2'));
const DevTracker = React.lazy(() => import('../pages/DevTracker'));
const DevFakeTrack = React.lazy(() => import('../pages/DevFakeTrack'));
const DevController = React.lazy(() => import('../pages/DevController'));

/// LAZY COMPONENTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const LazyHome = () => (
  <Suspense fallback={<div>loading</div>}>
    <Home />
  </Suspense>
);
export const LazyCharacterController = () => (
  <Suspense fallback={<div>loading</div>}>
    <CharControl />
  </Suspense>
);
export const LazyLogin = () => (
  <Suspense fallback={<div>loading</div>}>
    <Login />
  </Suspense>
);
export const LazyModel = () => (
  <Suspense fallback={<div>loading</div>}>
    <Model />
  </Suspense>
);
export const LazyMain = () => (
  <Suspense fallback={<div>loading</div>}>
    <Main />
  </Suspense>
);
export const LazyScriptEditor = () => (
  <Suspense fallback={<div>loading</div>}>
    <ScriptEditor />
  </Suspense>
);
export const LazyViewer = () => (
  <Suspense fallback={<div>loading</div>}>
    <Viewer />
  </Suspense>
);
export const LazyTrackerSetup = () => (
  <Suspense fallback={<div>loading</div>}>
    <TrackerSetup />
  </Suspense>
);

/** DEVELOPER APPS **/
export const LazyDevice = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevController />
  </Suspense>
);
export const LazyCompiler = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevCompiler />
  </Suspense>
);
export const LazyTracker = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevTracker />
  </Suspense>
);
export const LazyFakeTrack = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevFakeTrack />
  </Suspense>
);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exported components above
