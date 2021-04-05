import React, { Suspense } from 'react';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Home = React.lazy(() => import('../pages/Home'));
const Tracker = React.lazy(() => import('../pages/Tracker'));
const FakeTrack = React.lazy(() => import('../pages/FakeTrack'));
const CharControl = React.lazy(() => import('../pages/CharControl'));
const XGUI = React.lazy(() => import('../src-xgui/App'));
const Compiler = React.lazy(() => import('../pages/Compiler'));
const Login = React.lazy(() => import('../pages/Login'));
const Model = React.lazy(() => import('../pages/Model'));
const MissionControl = React.lazy(() => import('../pages/MissionControl'));
const ScriptEditor = React.lazy(() => import('../pages/ScriptEditor'));
const Viewer = React.lazy(() => import('../pages/Viewer'));

/// LAZY COMPONENTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const LazyTracker = () => (
  <Suspense fallback={<div>loading</div>}>
    <Tracker />
  </Suspense>
);
export const LazyHome = () => (
  <Suspense fallback={<div>loading</div>}>
    <Home />
  </Suspense>
);
export const LazyFakeTrack = () => (
  <Suspense fallback={<div>loading</div>}>
    <FakeTrack />
  </Suspense>
);
export const LazyCharacterController = () => (
  <Suspense fallback={<div>loading</div>}>
    <CharControl />
  </Suspense>
);
export const LazyXGUI = () => (
  <Suspense fallback={<div>loading</div>}>
    <XGUI />
  </Suspense>
);
export const LazyCompiler = () => (
  <Suspense fallback={<div>loading</div>}>
    <Compiler />
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
export const LazyMissionControl = () => (
  <Suspense fallback={<div>loading</div>}>
    <MissionControl />
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exported components above
