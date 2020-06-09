/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS PhaseMachine is a class to implement simple "phased execution" by
  operation and group. It's used for implementing looping lifecycle events.

  EXAMPLE:

    const PM = new PhaseMachine({
      PHASE_RUN: [ 'INIT', 'LOAD', 'RUN', 'STOP ]
    });
    // hook function to phase
    PM.Hook('INIT',(...args)=>{});
    PM.Hook('LOAD',(...args)=>new Promise((resolve,reject)=>{});
    // invocation
    (async () => {
      await PM.Execute('INIT');
      await PM.ExecutePhase('PHASE_RUN');
      await PM.ExecutePhaseParallel('PHASE_RUN');
    })();

  NOTES:

    It is up to you to implement the logic for when to execute phase
    operations. See client-exec.js for examples.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = require('./util/prompts');

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { subs: false };
const IS_NODE = typeof window === 'undefined';

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: call the hook object's function. This used to do additional
 *  checks to see if the function should be called based on the route.
 */
function m_InvokeHook(op, hook) {
  if (!hook.scope) return hook.f();
  throw Error('scope checking is not implemented in this version of URSYS');
}

/// URSYS PhaseMachine CLASS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhaseMachine {
  /** CONSTRUCTOR: phases is an object of upper-case KEYS containing
   *  arrays of OPERATION strings
   */
  constructor(phases, name = '') {
    this.OP_HOOKS = new Map();
    this.PHASES = phases;
    this.PR = name ? PR.makeLogHelper(name) : () => [];
    Object.keys(phases).forEach(phaseKey => {
      this.OP_HOOKS.set(phaseKey, []); // add the phase name to ophooks map as special case
      this.PHASES[phaseKey].forEach(opKey => {
        this.OP_HOOKS.set(opKey, []); // add each op in the phase to ophooks map
      });
    });
    // bind functions to instance so it can be called inside promises
    // and asynchronous handler context
    this.Execute = this.Execute.bind(this);
    this.ExecutePhase = this.ExecutePhase.bind(this);
    this.ExecutePhaseParallel = this.ExecutePhaseParallel.bind(this);
    this.GetHooks = this.GetHooks.bind(this);
    this.Hook = this.Hook.bind(this);
  } // end constructor

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: register an Operations Handler. <op> is a string constant
   *  define in PHASES and converted into the MAP. <f> is a function that
   *  will be invoked during the operation, and it can return a promise or value.
   */
  Hook(op, f, scope = '') {
    // don't run on server
    if (IS_NODE) return;
    // vestigial scope parameter check if we need it someday
    if (typeof scope !== 'string') throw Error('<arg1> scope should be included');
    // does this operation name exist?
    if (typeof op !== 'string')
      throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
    if (!this.OP_HOOKS.has(op)) throw Error(`${op} is not a recognized phase`);
    if (op.includes('PHASE_'))
      throw Error(
        `Hooking a PHASE GROUP '${op}' is not supported. Hook each individual operation instead.`
      );
    // did we also get a promise?
    if (!(f instanceof Function))
      throw Error('<arg3> must be a function optionally returning Promise');
    // get the list of promises associated with this op
    // and add the new promise
    const hook = { f, scope };
    this.OP_HOOKS.get(op).push(hook);
    if (DBG) console.log(...this.PR(`registered - SystemHook '${op}'`));
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a op, completing when
   *  all the callback functions complete. If the callback function returns
   *  a Promise, this is added to a list of Promises to wait for before the
   *  function returns control to the calling code.
   */
  Execute(op) {
    // note: contents of PHASE_HOOKs are promise-generating functions
    if (!this.OP_HOOKS.has(op)) throw Error(`${op} is not a recognized EXEC op`);
    if (op.includes('PHASE_'))
      throw Error(`${op} is a Phase Group; use ExecutePhase() instead`);

    // check that there are promises to execute
    let hooks = this.OP_HOOKS.get(op);
    if (hooks.length === 0) {
      if (DBG.subs) console.log(...this.PR(`[${op}] no subscribers`));
      return Promise.resolve();
    }

    // now execute handlers and promises
    let icount = 0;
    // get an array of promises
    // o contains 'f', 'scope' pushed in Hook() above
    const promises = [];
    hooks.forEach(hook => {
      let retval = m_InvokeHook(op, hook);
      if (retval instanceof Promise) {
        icount++;
        promises.push(retval);
      }
    });
    if (DBG.subs && hooks.length)
      console.log(...this.PR(`[${op}] HANDLERS PROCESSED : ${hooks.length}`));
    if (DBG.subs && icount)
      console.log(...this.PR(`[${op}] PROMISES QUEUED    : ${icount}`));

    // wait for all promises to execute
    return Promise.all(promises)
      .then(values => {
        if (DBG.subs && values.length)
          console.log(
            ...this.PR(`[${op}] PROMISES  RETVALS  : ${values.length}`),
            values
          );
        return values;
      })
      .catch(err => {
        if (DBG.subs) console.log(...this.PR(`[${op}]: ${err}`));
        throw Error(`[${op}]: ${err}`);
      });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a Phase Group in serial
   *  css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
   */
  ExecutePhase(phaseName) {
    if (DBG) console.log(...this.PR(`ExecutePhase('${phaseName}')`));
    const ops = this.PHASES[phaseName];
    if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
    return ops.reduce(async (previousPromise, nextOp) => {
      await previousPromise;
      return this.Execute(nextOp);
    }, Promise.resolve());
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a Phase Group in parallel
   */
  ExecutePhaseParallel(phaseName) {
    const ops = this.PHASES[phaseName];
    if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
    return Promise.all(ops.map(op => this.Execute(op)));
    // fix this and return promise
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Return hooks array for a given operation. Useful when
   *  using closures to create an optimal execution function as in
   *  client-exec SystemRun()
   */
  GetHooks(op) {
    return this.OP_HOOKS.get(op).map(hook => hook.f);
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PhaseMachine;
