import React, { Suspense } from 'react';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Home = React.lazy(() => import('../pages/Home'));
const CharControl = React.lazy(() => import('../pages/CharControl'));
const CharControl2 = React.lazy(() => import('../pages/CharControl2'));
const Login = React.lazy(() => import('../pages/Login'));
const Project = React.lazy(() => import('../pages/Project'));
const Main = React.lazy(() => import('../pages/Main'));
const ScriptEditor = React.lazy(() => import('../pages/ScriptEditor'));
const Viewer = React.lazy(() => import('../pages/Viewer'));
const TrackerSetup = React.lazy(() => import('../pages/TrackerSetup'));
const DevCompiler = React.lazy(() => import('../pages/DevCompiler'));
const DevTracker = React.lazy(() => import('../pages/DevTracker'));
const DevFakeTrack = React.lazy(() => import('../pages/DevFakeTrack'));
const DevController = React.lazy(() => import('../pages/DevController'));
const DevWizard = React.lazy(() => import('../pages/DevWizard'));
const DevCodeTester = React.lazy(() => import('../pages/DevCodeTester'));

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
export const LazyCharacterController2 = () => (
  <Suspense fallback={<div>loading</div>}>
    <CharControl2 />
  </Suspense>
);
export const LazyLogin = () => (
  <Suspense fallback={<div>loading</div>}>
    <Login />
  </Suspense>
);
export const LazyProject = () => (
  <Suspense fallback={<div>loading</div>}>
    <Project />
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
export const LazyWizard = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevWizard />
  </Suspense>
);
export const LazyCodeTester = () => (
  <Suspense fallback={<div>loading</div>}>
    <DevCodeTester />
  </Suspense>
);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exported components above
