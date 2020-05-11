/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Experimental APPSTATE storage for NextJS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const UR = require('@gemstep/ursys/client');

/// CREATE CHEESEBALL STORE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STORE = {
  isBrowser: false,
  isServer: true
};
const ROUTE = {
  currentTab: 0,
  currentRoute: '/',
  count: 0
};

if (typeof window === 'object') {
  STORE.isBrowser = true;
  STORE.isServer = false;
  window.STORE = STORE;
  console.log('APPSTATE: browser initialized');
} else {
  console.log('APPSTATE: server initialized');
}

function get(key) {
  if (STORE.isServer) console.log(`WARN: server-side get '${key}'`);
  return STORE[key];
}

function set(key, value) {
  console.log('mode');
  if (STORE.isServer) console.log(`WARN: server-side set '${key}'`);
  STORE[key] = value;
}

function setRoute(index, path) {
  ROUTE.currentTab = index;
  ROUTE.currentRoute = path;
  console.log(`APPSTATE: route set ${ROUTE.count++} times`);
}

function getRoute() {
  return ROUTE;
}

function StartTimer() {
  if (process.browser) {
    console.log('setting imperative debug timer');
    setInterval(() => {
      UR.Signal('APPSTATE_TICK', ROUTE.currentRoute);
    }, 5000);
    UR.Subscribe('HELLO_URSYS', data => {
      console.log('appstate', data);
    });
  }
}

module.exports = { get, set, setRoute, getRoute, StartTimer };
