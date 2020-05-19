/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-debugger */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Application Lifecycle Controller

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
const DBG = { subs: false };
const { cssuri, cssalert, cssinfo, cssblue, cssreset } = CCSS;

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASES = {
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
    'APP_STAGE', // app modules receive reset params prior to starting
    'APP_START', // app modules start execution, all modules are ready
    'APP_RUN', // app modules enter run mode
    'APP_UPDATE', // app modules execute a step
    'DOM_ANIMFRAME', // app modules animation frame
    'APP_NEXT' // app_module jump back to start of RUN
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
Object.keys(PHASES).forEach(phaseKey => {
  OP_HOOKS.set(phaseKey, []);
  PHASES[phaseKey].forEach(opKey => {
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
let EXEC_OP; // current execution operation (the name of the op)
let SIM_TIMER_ID; // timer id for sim stepper
let SIM_INTERVAL_MS = (1 / 30) * 1000;
let SIM_UPDATE_HOOKS = [];
let SYS_ANIMFRAME_ID;
let SYS_ANIMFRAME_HOOKS = [];

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: call the hook object's function. This used to do additional
 *  checks to see if the function should be called based on the route.
/*/
function m_InvokeHook(op, hook) {
  if (!hook.scope) return hook.f();
  throw Error('scope checking is not implemented in this version of URSYS');
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: register an Operations Handler. <op> is a string constant
 *  define in PHASES and converted into the MAP. <f> is a function that
 *  will be invoked during the operation, and it can return a promise or value.
 */
function SystemHook(op, f, scope = '') {
  // vestigial scope parameter check if we need it someday
  if (typeof scope !== 'string') throw Error('<arg1> scope should be included');
  // does this operation name exist?
  if (typeof op !== 'string')
    throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
  if (!OP_HOOKS.has(op)) throw Error(`${op} is not a recognized phase`);
  // did we also get a promise?
  if (!(f instanceof Function))
    throw Error('<arg3> must be a function optionally returning Promise');
  // get the list of promises associated with this op
  // and add the new promise
  const hook = { f, scope };
  OP_HOOKS.get(op).push(hook);
  if (DBG) console.log(`SystemHook('${op}')`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a op, completing when
 *  all the callback functions complete. If the callback function returns
 *  a Promise, this is added to a list of Promises to wait for before the
 *  function returns control to the calling code.
 */
function Execute(op) {
  // note: contents of PHASE_HOOKs are promise-generating functions
  if (!OP_HOOKS.has(op)) throw Error(`${op} is not a recognized EXEC op`);
  if (op.includes('PHASE_'))
    throw Error(`${op} is a Phase Group; use ExecutePhase() instead`);
  let hooks = OP_HOOKS.get(op);
  if (hooks.length === 0) {
    if (DBG.subs) console.log(`[${op}] no subscribers`);
    return;
  }

  // now execute handlers and promises
  let icount = 0;
  // get an array of promises
  // o contains 'f', 'scope' pushed in SystemHook() above
  let promises = hooks.map(hook => {
    let retval = m_InvokeHook(op, hook);
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
  if (DBG.subs && hooks.length)
    console.log(`[${op}] HANDLERS PROCESSED : ${hooks.length}`);
  if (DBG.subs && icount) console.log(`[${op}] PROMISES QUEUED    : ${icount}`);

  // wait for all promises to execute
  return Promise.all(promises)
    .then(values => {
      if (DBG.subs && values.length)
        console.log(`[${op}] PROMISES  RETVALS  : ${values.length}`, values);
      return values;
    })
    .catch(err => {
      if (DBG.subs) console.log(`[${op}]: ${err}`);
      throw Error(`[${op}]: ${err}`);
    });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a Phase Group in serial
 *  css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
 */
function ExecutePhase(phaseName) {
  if (DBG) console.log(`ExecutePhase('${phaseName}')`);
  const ops = PHASES[phaseName];
  if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
  return ops.reduce(async (previousPromise, nextOp) => {
    await previousPromise;
    return Execute(nextOp);
  }, Promise.resolve());
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a Phase Group in parallel
 */
function ExecutePhaseParallel(phaseName) {
  const ops = PHASES[phaseName];
  if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
  return Promise.all(ops.map(op => Execute(op)));
  // fix this and return promise
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle state engine
 */
async function SystemBoot(options = {}) {
  //
  if (DBG) console.log('** SystemBoot **');
  await ExecutePhase('PHASE_BOOT');
  await ExecutePhase('PHASE_INIT');
  await ExecutePhase('PHASE_CONNECT');
  await ExecutePhase('PHASE_LOAD');
  await ExecutePhase('PHASE_CONFIG');
  await ExecutePhase('PHASE_READY');
  //
  if (options.autoRun) {
    if (DBG) console.log('info - autoRun to next phase');
    SystemRun(options);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: start the lifecycle run engine
 */
async function SystemRun(options = {}) {
  //
  if (DBG) console.log('** SystemRun **');
  //
  SIM_TIMER_ID = 0;
  SYS_ANIMFRAME_ID = 0;
  //
  await Execute('APP_STAGE');
  await Execute('APP_START');
  await Execute('APP_RUN');
  //
  if (DBG) console.log('** SystemUpdate **');
  // set up SIM_TIMER
  if (options.update) {
    if (DBG) console.log('info - starting simulation updates');
    SIM_UPDATE_HOOKS = OP_HOOKS.get('APP_UPDATE').map(hook => hook.f);
    if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
    const u_simupdate = () => {
      const u_exec = f => f(SIM_INTERVAL_MS);
      SIM_UPDATE_HOOKS.forEach(u_exec);
    };
    SIM_TIMER_ID = setInterval(u_simupdate, SIM_INTERVAL_MS);
  }
  // set up ANIMFRAME
  if (options.animFrame) {
    if (DBG) console.log('info - starting animframe updates');
    SYS_ANIMFRAME_HOOKS = OP_HOOKS.get('DOM_ANIMFRAME').map(hook => hook.f);
    const u_animframe = ts => {
      const u_anim = f => f(ts);
      SYS_ANIMFRAME_HOOKS.forEach(u_anim);
      SYS_ANIMFRAME_ID = window.requestAnimationFrame(u_animframe);
    };
    window.requestAnimationFrame(u_animframe);
  }
  if (!(options.animFrame || options.update)) {
    console.log('info - no periodic updates are enabled');
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: force loop back to run
 */
async function SystemRestage() {
  if (DBG) console.log('** SystemRestage **');
  // clear running timers
  if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
  if (SYS_ANIMFRAME_ID) window.cancelAnimationFrame(SYS_ANIMFRAME_ID);
  //
  await Execute('APP_NEXT');
  //
  SystemRun();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: end the lifecycle state engine
 */
async function SystemUnload() {
  console.log('** SystemUnload **');
  // clear running timers
  if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
  if (SYS_ANIMFRAME_ID) window.cancelAnimationFrame(SYS_ANIMFRAME_ID);
  //
  await ExecutePhase('PHASE_UNLOAD');
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: restart the lifecycle from boot
 */
async function SystemReboot() {
  console.log('** SystemReboot **');
  // clear running timers
  if (SIM_TIMER_ID) clearInterval(SIM_TIMER_ID);
  if (SYS_ANIMFRAME_ID) window.cancelAnimationFrame(SYS_ANIMFRAME_ID);
  //
  await ExecutePhase('PHASE_REBOOT');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SystemBoot,
  SystemHook,
  SystemRun,
  SystemRestage,
  SystemUnload,
  SystemReboot
};
