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
  * It is up to you to implement the logic for when to execute phase
    operations. See client-exec.js for examples.
  * if you subscribe to a phase group operation, you receive the list of
    phases and the current index at the beginning of each phase

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');

/// DEBUG CONSTANTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { subs: true, ops: false, phases: false };
const IS_NODE = typeof window === 'undefined';

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: call the hook object's function. This used to do additional
 *  checks to see if the function should be called based on the route.
 */
function m_InvokeHook(op, hook, ...args) {
  if (hook.scope)
    throw Error('scope checking is not implemented in this version of URSYS');
  // execute callbac and return possible Promise
  if (hook.f) return hook.f(...args);
  // if no hook.f, this hook was implicitly mocked
  return undefined;
}

/// URSYS PhaseMachine CLASS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhaseMachine {
  /** CONSTRUCTOR: phases is an object of upper-case KEYS containing
   *  arrays of OPERATION strings.
   */
  constructor(phases, prompt = '-') {
    this.OP_HOOKS = new Map();
    this.PHASES = phases;
    this.PR = prompt ? PROMPTS.makeLogHelper(prompt) : () => [];
    Object.keys(phases).forEach(phaseKey => {
      this.OP_HOOKS.set(phaseKey, []); // add the phase name to ophooks map as special case
      this.PHASES[phaseKey].forEach(opKey => {
        this.OP_HOOKS.set(opKey, []); // add each op in the phase to ophooks map
      });
    });
    // bind functions to instance so it can be called inside promises
    // and asynchronous handler context
    this.Hook = this.Hook.bind(this);
    this.Execute = this.Execute.bind(this);
    this.ExecutePhase = this.ExecutePhase.bind(this);
    this.ExecutePhaseParallel = this.ExecutePhaseParallel.bind(this);
    this.GetHookFunctions = this.GetHookFunctions.bind(this);
    this.GetPhaseFunctionsAsMap = this.GetPhaseFunctionsAsMap.bind(this);
    this.MockHook = this.MockHook.bind(this);
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
    let status = 'REGD';
    if (!(f instanceof Function)) {
      // no function means "implicit mock"
      status = 'MOCK';
    }
    // get the list of promises associated with this op
    // and add the new promise
    const hook = { f, scope };
    this.OP_HOOKS.get(op).push(hook);
    if (DBG) console.log(...this.PR(`${status} '${op}' Hook`));
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a op, completing when
   *  all the callback functions complete. If the callback function returns
   *  a Promise, this is added to a list of Promises to wait for before the
   *  function returns control to the calling code.
   */
  Execute(op, ...args) {
    // note: contents of PHASE_HOOKs are promise-generating functions
    if (!this.OP_HOOKS.has(op)) throw Error(`${op} is not a recognized EXEC op`);
    if (op.startsWith('PHASE_') && DBG.phases)
      console.log(`warning:${op} phase group executed as single op`);

    // check that there are promises to execute
    let hooks = this.OP_HOOKS.get(op);
    if (hooks.length === 0) {
      if (DBG.ops) console.log(...this.PR(`[${op}] no subscribers`));
      return Promise.resolve();
    }

    // now execute handlers and promises
    let icount = 0;
    // get an array of promises
    // o contains 'f', 'scope' pushed in Hook() above
    const promises = [];
    hooks.forEach(hook => {
      let retval = m_InvokeHook(op, hook, ...args);
      if (retval instanceof Promise) {
        icount++;
        promises.push(retval);
      }
    });
    if (DBG.ops && hooks.length)
      console.log(...this.PR(`[${op}] HANDLERS PROCESSED : ${hooks.length}`));
    if (DBG.ops && icount)
      console.log(...this.PR(`[${op}] PROMISES QUEUED    : ${icount}`));

    // wait for all promises to execute
    return Promise.all(promises)
      .then(values => {
        if (DBG.ops && values.length)
          console.log(
            ...this.PR(`[${op}] PROMISES RETVALS  : ${values.length}`, values)
          );
        return values;
      })
      .catch(err => {
        if (DBG.ops) console.log(...this.PR(`[${op}]: ${err}`));
        throw Error(`[${op}]: ${err}`);
      });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a Phase Group in serial
   *  css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
   */
  ExecutePhase(phaseName, ...args) {
    if (DBG.phases) console.log(...this.PR(`ExecutePhase('${phaseName}')`));
    const ops = this.PHASES[phaseName];
    const phaseHookFuncs = this.GetHookFunctions(phaseName);
    if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
    let index = 0;
    return ops.reduce(
      async (previousPromise, nextOp) => {
        phaseHookFuncs.forEach(f => f(ops, index++));
        await previousPromise; // wait for previous promise to finish
        return this.Execute(nextOp, ...args); // queue next promise
      },
      phaseHookFuncs.forEach(f => f(ops, index++))
    ); // initial value of previousPromise
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Execute all Promises associated with a Phase Group in parallel
   */
  ExecutePhaseParallel(phaseName, ...args) {
    const ops = this.PHASES[phaseName];
    if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
    return Promise.all(ops.map(op => this.Execute(op, ...args)));
    // fix this and return promise
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Return hooks array for a given operation. Useful when
   *  using closures to create an optimal execution function as in
   *  client-exec SystemRun()
   */
  GetHookFunctions(op) {
    if (DBG.ops) console.log(...this.PR(`getting hook for '${op}'`));
    return this.OP_HOOKS.get(op).map(hook => hook.f);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Return a Map organized by phase:functions[]
   */
  GetPhaseFunctionsAsMap(phase) {
    if (!phase.startsWith('PHASE_'))
      throw Error(`${phase} is not a Phase Group name`);
    if (DBG.ops) console.log(...this.PR(`getting hook map for phase '${phase}'`));
    const phaseOps = this.PHASES[phase]; // list of operations in the phase
    const map = new WeakMap();
    phaseOps.forEach(pop => {
      map.set(
        pop,
        this.OP_HOOKS.get(phase).map(hook => hook.f)
      );
    });
    return map;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Print arguments for hook, with optional callback
   */
  MockHook(op, callback) {
    this.Hook(op, (...args) => {
      console.log(`MOCK ${op} recv:`, ...args);
      if (typeof callback === 'function') callback(...args);
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Give a list of modules a chance to invoke PhaseMachine API
   */
  BootModules(moduleArray = []) {
    const fname = 'PM_Boot';
    moduleArray.forEach((mod = {}) => {
      if (typeof mod[fname] !== 'function') {
        console.warn(...this.PR(`missing ${fname}() in module`, mod));
        return;
      }
      mod[fname](this); // pass phasemachine instance
    });
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PhaseMachine;
