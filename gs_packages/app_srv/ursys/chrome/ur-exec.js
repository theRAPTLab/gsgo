/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Application Lifecycle

  to use:
  EXEC.Hook('PHASE', (data) => { return new Promise((resolve,reject)=>{}); });
  EXEC.Hook('PHASE', (data) => { ...code... });

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * @module URExec
 */
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import URNET from 'ursys/chrome/ur-network';
import URLink from 'ursys/chrome/ur-link';
import CCSS from 'app/modules/console-styles';

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { cssuri, cssalert, cssinfo, cssblue, cssreset } = CCSS;

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASE_HOOKS = new Map();
const PHASES = [
  'EXEC_TESTCONF', // app check run in testing mode
  'EXEC_INITIALIZE', // app modules allocate data structures
  'UR_CONNECT', // ursys websocket connected
  'EXEC_LOAD', // app modules can request asynchronous loads
  'EXEC_CONFIGURE', // app modules can configure data strucure
  'DOM_READY', // app view system has stabilized
  'EXEC_RESET', // app modules prepare to run
  'EXEC_START', // app modules can call any other module
  'UR_REGISTER', // app establish elevated credentials
  'UR_READY', // ursys is standing by
  'EXEC_RUN', // app modules enter run mode
  'EXEC_UPDATE', // app modules execute a step
  'DOM_ANIMFRAME', // app modules animation frame
  'EXEC_STOP', // app is stopping
  'UR_DISCONNECT', // ursys network connection lost
  'UR_RECONNECT', // ursys network connection regained
  'EXEC_UNLOAD', // app is shutting down; release assets
  'EXEC_SHUTDOWN', // app is shut down
  'EXEC_WILLPAUSE', // app is about to pause
  'EXEC_PAUSED', // app has entered pause state
  'EXEC_SLEEPING', // app sleeping tick
  'EXEC_WILLRESUME', // app is about to resume
  'EXEC_RESUME' // app has resumed
];

/// COMPUTED DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REACT_PHASES = [];

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const BAD_PATH = "module_path must be a string derived from the module's __dirname";
const ULINK = new URLink('UREXEC');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let EXEC_PHASE; // current execution phase (the name of the phase)
let EXEC_SCOPE; // current execution scope (the path of active view)

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compare the destination scope with the acceptable scope.
    if the scope starts with view, check it. otherwise just run it.
/*/
function m_ExecuteScopedPhase(phase, o) {
  // reject hooks that dont' match the current 'views' path that might
  // be initializing in other React root views outside the class
  if (o.scope.indexOf('views') === 0) {
    // if it's the current scope, run it!
    // console.log(`${phase} DOES '${EXEC_SCOPE}' contain '${o.scope}'?`);
    if (o.scope.includes(EXEC_SCOPE, 0)) return o.f();
    // otherwise don't run it
    if (DBG) console.info(`skipped '${o.scope}'`);
    return undefined;
  }
  // if we got this far, then it's something not in the view path
  // f() can return a Promise to force asynchronous waiting!
  return o.f();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compute the list of allowable REACT PHASES
    that will be updated
/*/
function m_SetValidReactPhases(phase) {
  let retval;
  if (phase === undefined) {
    retval = REACT_PHASES.shift();
  } else {
    const dr_index = PHASES.findIndex(el => {
      return el === phase;
    });
    if (dr_index > 0) REACT_PHASES = PHASES.slice(dr_index);
    retval = REACT_PHASES[0];
  }
  // if (DBG) console.log('REACT_PHASES:', REACT_PHASES.join(', '));
  return retval;
}
// initialize
m_SetValidReactPhases('DOM_READY');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: maintain current phase status (not used for anything currently)
/*/
function m_UpdateCurrentPhase(phase) {
  EXEC_PHASE = phase;
  if (DBG) console.log(`PHASE UPDATED ${EXEC_PHASE}`);
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXEC METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: register a Phase Handler which is invoked by MOD.Execute() phase is a
    string constant from PHASES array above f is a function that does work
    immediately, or returns a Promise
*/
const Hook = (scope, phase, f) => {
  try {
    // make sure scope is included
    if (typeof scope !== 'string') throw Error(`<arg1> scope should be included`);

    // does this phase exist?
    if (typeof phase !== 'string') throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
    if (!PHASES.includes(phase)) throw Error(`${phase} is not a recognized phase`);
    // did we also get a promise?
    if (!(f instanceof Function)) throw Error('<arg3> must be a function optionally returning Promise');
    // get the list of promises associated with this phase
    // and add the new promise
    if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase, []);
    PHASE_HOOKS.get(phase).push({ f, scope });
    if (DBG) console.log(`[${phase}] added handler`);
  } catch (e) {
    console.error(e);
    debugger;
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * API: Return TRUE if the passed string is a valid URSYS phase that
 * a React component can tap
 * @param {string} phase
 */
const IsReactPhase = phase => {
  return (
    REACT_PHASES.findIndex(el => {
      return phase === el;
    }) > 0
  );
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
*/
const Execute = async phase => {
  // note: contents of PHASE_HOOKs are promise-generating functions
  if (!PHASES.includes(phase)) throw Error(`${phase} is not a recognized EXEC phase`);
  let hooks = PHASE_HOOKS.get(phase);
  if (hooks === undefined) {
    if (DBG) console.log(`[${phase}] no subscribers`);
    return;
  }

  // phase housekeeping
  m_UpdateCurrentPhase(`${phase}_PENDING`);

  // now execute handlers and promises
  let icount = 0;
  if (DBG) console.group(`${phase} - ${EXEC_SCOPE}`);
  // get an array of promises
  // o contains f, scope pushed in Hook() above
  let promises = hooks.map(o => {
    let retval = m_ExecuteScopedPhase(phase, o);
    if (retval instanceof Promise) {
      icount++;
      return retval;
    }
    // return undefined to signal no special handling
    return undefined;
  });
  promises = promises.filter(e => {
    return e !== undefined;
  });
  if (DBG && hooks.length) console.log(`[${phase}] HANDLERS PROCESSED : ${hooks.length}`);
  if (DBG && icount) console.log(`[${phase}] PROMISES QUEUED    : ${icount}`);

  // wait for all promises to execute
  await Promise.all(promises)
    .then(values => {
      if (DBG && values.length) console.log(`[${phase}] PROMISES RETURNED  : ${values.length}`, values);
      if (DBG) console.groupEnd();
      return values;
    })
    .catch(err => {
      if (DBG) console.log(`[${phase}]: ${err}`);
      throw Error(`[${phase}]: ${err}`);
    });

  // phase housekeeping
  m_UpdateCurrentPhase(phase);
};

/**
 * Called during SystemInit to determine what the dynamic path is
 * by matching
 * @memberof URExec
 * @param {Object[]} routes list of route objects
 * @param {String} routes[].path the /path to match
 * @param {Object} routes[].component the loaded view
 * @returns true if scope was set successfully, false otherwise
 */
const SetScopeFromRoutes = routes => {
  // get current hash, without trailing parameters and # char
  const hashbits = window.location.hash.substring(1).split('/');
  const hash = `/${hashbits[1] || ''}`;
  const loc = hash.split('?')[0];
  if (DBG) console.log(`%cHASH_XLATE%c '${window.location.hash}' --> '${loc}'`, cssinfo, cssreset);
  const matches = routes.filter(route => {
    return route.path === loc;
  });
  if (matches.length) {
    const { component } = matches[0];
    /*/
    to set the scope, we need to have a unique name to set. this scope is probably
    a directory. we can set the UMOD property using the __dirname config for webpack
    /*/
    if (component.MOD_ID === undefined) console.error(`WARNING: component for route '${loc}' has no MOD_ID property`);
    else {
      const viewpath = component.MOD_ID || 'boot';
      SetScopePath(viewpath);
    }
    return;
  }
  /* NO MATCHES */
  console.log(`%cSetScopeFromRoutes() no match for ${loc}`, cssuri);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope is used to filter EXEC events within a particular
    application path, which are defined under the view directory.
*/
const SetScopePath = view_path => {
  if (typeof view_path !== 'string') throw Error(BAD_PATH);
  EXEC_SCOPE = view_path;
  console.info(`%cEXEC_SCOPE%c '${EXEC_SCOPE}'`, cssinfo, cssreset);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope
 */
const CurrentScope = () => {
  return EXEC_SCOPE;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MatchScope = check => {
  return EXEC_SCOPE.includes(check);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application startup
 */
const EnterApp = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_TESTCONF'); // TESTCONFIG hook
    await Execute('EXEC_INITIALIZE'); // INITIALIZE hook
    await Execute('EXEC_LOAD'); // LOAD_ASSETS hook
    await Execute('EXEC_CONFIGURE'); // CONFIGURE support modules
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: call this when the view system's DOM has stabilized and is ready
    for manipulation by other code
*/
const SetupDOM = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('DOM_READY'); // GUI layout has finished composing
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: network startup
 */
const JoinNet = () => {
  return new Promise((resolve, reject) => {
    URNET.Connect(ULINK, { success: resolve, failure: reject });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: configure system before run
 */
const SetupRun = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_RESET'); // RESET runtime datastructures
    await Execute('EXEC_START'); // START running
    await Execute('UR_REGISTER'); // register messages
    ULINK.RegisterSubscribers(); // send messages (this awaits internally)
    await Execute('UR_READY'); // app is connected
    await Execute('EXEC_RUN'); // tell network APP_READY
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: handle periodic updates for a simulation-driven timestep
 */
const Running = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_RUN');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const Pause = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_WILLPASUSE');
    await Execute('EXEC_PAUSED');
    await Execute('EXEC_SLEEPING');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const CleanupRun = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_STOP');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application offline
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ServerDisconnect = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('UR_DISCONNECT');
    resolve();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ExitApp = () => {
  return new Promise(async (resolve, reject) => {
    await Execute('EXEC_UNLOAD');
    await Execute('EXEC_SHUTDOWN');
    resolve();
  });
};

const ModulePreflight = (comp, mod) => {
  if (!comp) return 'arg1 must be React component root view';
  if (!mod) return `arg2 must be 'module' keyword`;
  if (!mod.id) return `arg2 is not a 'module' keyword`;
  if (!comp.MOD_ID) return `Component.MOD_ID static property must be set = __dirname (e.g. ViewMain.MOD_ID=__dirname)`;
};
/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Hook,
  Execute,
  SetScopePath,
  ModulePreflight,
  CurrentScope,
  MatchScope,
  EnterApp,
  SetupDOM,
  JoinNet,
  SetupRun,
  Running,
  Pause,
  CleanupRun,
  ServerDisconnect,
  ExitApp,
  SetScopeFromRoutes,
  IsReactPhase
};
