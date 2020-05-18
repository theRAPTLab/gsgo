/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Application Lifecycle

  to use:
  EXEC.SubscribeHook('OP', (data) => { return new Promise((resolve,reject)=>{}); });
  EXEC.SubscribeHook('OP', (data) => { ...code... });

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * @module URExec
 */
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URNET = require('./client-urnet');
const URChan = require('./client-urchan');
const CCSS = require('./util-console-styles');

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const { cssuri, cssalert, cssinfo, cssblue, cssreset } = CCSS;

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASE_GROUPS = {
  // NOTE: 'PHASE_*' fired on entry of states in this group
  PHASE_BOOT: [
    'TEST_INIT', // hook to set any testing parameters or modes
    'SYS_BOOTSTRAP' // grab initial props to load the rest of URSYS
  ],
  PHASE_INIT: [
    'SYS_INIT', // initialize key runtime parameters
    'DOM_READY' // the dom is stable
  ],
  PHASE_CONNECT: [
    'NET_CONNECT', // initiate connection
    'NET_REGISTER', // initiate registration
    'NET_READY' // the network is stable
  ],
  PHASE_LOAD: [
    'APP_LOAD' // app modules can request asynchronous loads
  ],
  PHASE_CONFIG: [
    'APP_CONFIGURE' // app modules can configure data structure from loaded data
  ],
  PHASE_READY: [
    'APP_READY' // all apps have loaded and configured and are ready to run
  ],
  PHASE_RUN: [
    'APP_RESET', // app modules receive reset params prior to starting
    'APP_START', // app modules start execution, all modules are ready
    'APP_RUN', // app modules enter run mode
    'APP_UPDATE', // app modules execute a step
    'DOM_ANIMFRAME', // app modules animation frame
    'APP_LOOP' // fired at end, back to APP_UPDATE
  ],
  PHASE_PAUSED: [
    'APP_PAUSE', // app modules should enter "paused state"
    'APP_UPDATE', // app modules still receive update
    'DOM_ANIMFRAME', // app modules still receive animframe
    'APP_UNPAUSE' // app modules cleanup, then back to 'APP_LOOP'
  ],
  PHASE_UNLOAD: [
    'APP_STOP', // app is stopping
    'APP_UNLOAD', // app is shutting down; release assets
    'APP_SHUTDOWN' // app is shut down
  ],
  PHASE_REBOOT: [
    'SYS_REBOOT' // system is about to reboot back to PHASE_BOOT
  ]
};

// populate ops map
const OP_HOOKS = new Map();
Object.keys(PHASE_GROUPS).forEach(phaseKey => {
  OP_HOOKS.set(phaseKey, []);
  PHASE_GROUPS[phaseKey].forEach(opKey => {
    OP_HOOKS.set(opKey, []);
  });
});

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_PATH =
  "module_path must be a string derived from the module's __dirname";
const URCHAN = new URChan('UREXEC');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let EXEC_OP; // current execution phase (the name of the phase)

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compare the destination scope with the acceptable scope.
    if the scope starts with view, check it. otherwise just run it.
/*/
function m_ExecuteScopedOp(phase, o) {
  return o.f();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: maintain current phase status (not used for anything currently)
/*/
function m_UpdateCurrentOp(phase) {
  EXEC_OP = phase;
  if (DBG) console.log(`PHASE UPDATED ${EXEC_OP}`);
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: register an Operations Handler. <op> is a string constant
 *  define in PHASE_GROUPS and converted into the MAP. <f> is a function that
 *  will be invoked during the operation, and it can return a promise or value.
 */
function SubscribeHook(op, f, scope = '/') {
  try {
    // make sure scope is included
    if (typeof scope !== 'string') throw Error('<arg1> scope should be included');
    // does this phase exist?
    if (typeof op !== 'string')
      throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
    if (!OP_HOOKS.has(op)) throw Error(`${op} is not a recognized phase`);
    // did we also get a promise?
    if (!(f instanceof Function))
      throw Error('<arg3> must be a function optionally returning Promise');
    // get the list of promises associated with this phase
    // and add the new promise
    OP_HOOKS.get(op).push({ f, scope });
    if (DBG) console.log(`[${op}] added handler`);
  } catch (e) {
    console.error(e);
    debugger;
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a op, completing when
 *  all the callback functions complete. If the callback function returns
 *  a Promise, this is added to a list of Promises to wait for before the
 *  function returns control to the calling code.
 */
async function Execute(op) {
  // note: contents of PHASE_HOOKs are promise-generating functions
  if (!OP_HOOKS.has(op)) throw Error(`${op} is not a recognized EXEC op`);
  if (op.includes('PHASE_'))
    throw Error(`${op} is a Phase Group; use ExecuteGroup() instead`);
  let hooks = OP_HOOKS.get(op);
  if (hooks.length === 0) {
    if (DBG) console.log(`[${op}] no subscribers`);
    return;
  }

  // phase housekeeping
  m_UpdateCurrentOp(`${op}_PENDING`);

  // now execute handlers and promises
  let icount = 0;
  if (DBG) console.group(`${op}`);
  // get an array of promises
  // o contains 'f', 'scope' pushed in SubscribeHook() above
  let promises = hooks.map(o => {
    let retval = m_ExecuteScopedOp(op, o);
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
  if (DBG && hooks.length)
    console.log(`[${op}] HANDLERS PROCESSED : ${hooks.length}`);
  if (DBG && icount) console.log(`[${op}] PROMISES QUEUED    : ${icount}`);

  // wait for all promises to execute
  await Promise.all(promises)
    .then(values => {
      if (DBG && values.length)
        console.log(`[${op}] PROMISES  RETVALS  : ${values.length}`, values);
      if (DBG) console.groupEnd();
      return values;
    })
    .catch(err => {
      if (DBG) console.log(`[${op}]: ${err}`);
      throw Error(`[${op}]: ${err}`);
    });

  // phase housekeeping
  m_UpdateCurrentOp(op);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a Phase Group
 */
function ExecuteGroup(group) {
  const ops = PHASE_GROUPS[group];
  if (ops === undefined) throw Error(`Phase Group "${group}" doesn't exist`);
  ops.forEach(async op => {
    await Execute(op);
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application startup
 */
const EnterApp = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_TESTCONF'); // TESTCONFIG hook
      await Execute('EXEC_INITIALIZE'); // INITIALIZE hook
      await Execute('EXEC_LOAD'); // LOAD_ASSETS hook
      await Execute('EXEC_CONFIGURE'); // CONFIGURE support modules
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: call this when the view system's DOM has stabilized and is ready
    for manipulation by other code
*/
const SetupDOM = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('DOM_READY'); // GUI layout has finished composing
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: network startup
 */
const JoinNet = () => {
  return new Promise((resolve, reject) => {
    URNET.Connect(URCHAN, { success: resolve, failure: reject });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: configure system before run
 */
const SetupRun = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_RESET'); // RESET runtime datastructures
      await Execute('EXEC_START'); // START running
      await Execute('UR_REGISTER'); // register messages
      URCHAN.RegisterSubscribers(); // send messages (this awaits internally)
      await Execute('UR_READY'); // app is connected
      await Execute('EXEC_RUN'); // tell network APP_READY
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: handle periodic updates for a simulation-driven timestep
 */
const Running = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_RUN');
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const Pause = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_WILLPASUSE');
      await Execute('EXEC_PAUSED');
      await Execute('EXEC_SLEEPING');
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: do the Shutdown EXEC
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const CleanupRun = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_STOP');
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application offline
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ServerDisconnect = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('UR_DISCONNECT');
      resolve();
    })();
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
*/
const ExitApp = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      await Execute('EXEC_UNLOAD');
      await Execute('EXEC_SHUTDOWN');
      resolve();
    })();
  });
};

const ModulePreflight = (comp, mod) => {
  if (!comp) return 'arg1 must be React component root view';
  if (!mod) return "arg2 must be 'module' keyword";
  if (!mod.id) return "arg2 is not a 'module' keyword";
  if (!comp.MOD_ID)
    return 'Component.MOD_ID static property must be set = __dirname (e.g. ViewMain.MOD_ID=__dirname)';
};
/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SubscribeHook,
  Execute,
  ExecuteGroup,
  ModulePreflight,
  EnterApp,
  SetupDOM,
  JoinNet,
  SetupRun,
  Running,
  Pause,
  CleanupRun,
  ServerDisconnect,
  ExitApp
};
