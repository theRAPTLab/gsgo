import React, { Suspense } from 'react';

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Home = React.lazy(() => import('../pages/Home'));
const Generator = React.lazy(() => import('../pages/Generator'));
const Tracker = React.lazy(() => import('../pages/Tracker'));
const FakeTrack = React.lazy(() => import('../pages/FakeTrack'));

/// LAZY COMPONENTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
const LazyFakeTrack = () => (
  <Suspense fallback={<div>loading</div>}>
    <FakeTrack />
  </Suspense>
);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { LazyTracker, LazyGenerator, LazyHome, LazyFakeTrack };
