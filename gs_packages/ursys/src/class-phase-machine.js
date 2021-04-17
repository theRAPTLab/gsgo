/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS PhaseMachine is a class to implement simple "phased execution" by
  operation and group. It's used for implementing looping lifecycle events.

  EXAMPLE:

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
const DBG = { subs: true, ops: false, phases: false, init: false };
const IS_NODE = typeof window === 'undefined';
const PR = PROMPTS.makeStyleFormatter('UR.PHM');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_machines = new Map(); // store phasemachines <machinename,instance>
const m_queue = new Map(); // store by <machinename,['op',f]>

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: extract the phase machine, phase from phaseSelector of form
 *  SIM/UPDATE_ALL, where SIM is the phase machine and UPDATE_ALL is the phase
 */
function m_DecodePhase(psel) {
  if (typeof psel !== 'string')
    throw Error(...PR('arg must be non-empty string'));
  const bits = psel.split('/');
  if (bits.length !== 2)
    throw Error(`${PR} malformed phase selector ('MACHINE/PHASE')`);
  const [machine, phase] = bits;
  return { machine, phase };
}
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
} // end m_InvokeHook
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: process queued hooks for a phasemachine name.
 */
function m_ProcessQueueFor(pmkey) {
  const pm = m_machines.get(pmkey);
  if (!pm) {
    console.warn(...PR(`${pmkey} not yet defined`));
    return;
  }
  const qhooks = m_queue.get(pmkey) || [];
  if (DBG.init)
    console.log(...PR(`phasemachine '${pmkey}' has ${qhooks.length} queued ops`));
  try {
    qhooks.forEach(element => {
      const [op, f] = element;
      pm.hook(op, f);
    });
    m_queue.delete(pmkey);
  } catch (e) {
    console.warn(...PR('Error while processing queued phasemachine hooks'));
    throw Error(e.toString());
  }
} // end m_ProcessQueueFor

/// URSYS PhaseMachine CLASS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhaseMachine {
  /** CONSTRUCTOR: phases is an object of upper-case KEYS containing
   *  arrays of OPERATION strings.
   */
  constructor(shortName, phases) {
    if (typeof shortName !== 'string') throw Error('arg1 must be string');
    if (shortName.length < 1) throw Error('arg1 string.length must be > 1');
    if (m_machines.has(shortName))
      throw Error(`already registered '${shortName}'`);
    this.NAME = shortName;
    this.OP_HOOKS = new Map();
    this.PHASES = phases;
    Object.keys(phases).forEach(phaseKey => {
      this.OP_HOOKS.set(phaseKey, []); // add the phase name to ophooks map as special case
      this.PHASES[phaseKey].forEach(opKey => {
        this.OP_HOOKS.set(opKey, []); // add each op in the phase to ophooks map
      });
    });
    // bind functions to instance so it can be called inside promises
    // and asynchronous handler context
    this.hook = this.hook.bind(this);
    this.execute = this.execute.bind(this);
    this.executePhase = this.executePhase.bind(this);
    this.executePhaseParallel = this.executePhaseParallel.bind(this);
    this.getHookFunctions = this.getHookFunctions.bind(this);
    this.getPhaseFunctionsAsMap = this.getPhaseFunctionsAsMap.bind(this);
    // save instance by name
    m_machines.set(shortName, this);
    if (DBG.init) console.log(...PR(`phasemachine '${shortName}' saved`));
    // check queued hooks
    m_ProcessQueueFor(shortName);
  } // end constructor

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: register an Operations Handler. <op> is a string constant
   *  define in PHASES and converted into the MAP. <f> is a function that
   *  will be invoked during the operation, and it can return a promise or value.
   */
  hook(op, f, scope = '') {
    // don't run on server
    if (IS_NODE) return;
    // vestigial scope parameter check if we need it someday
    if (typeof scope !== 'string') throw Error('<arg1> scope should be included');
    // does this operation name exist?
    if (typeof op !== 'string')
      throw Error("<arg2> must be PHASENAME (e.g. 'LOAD_ASSETS')");
    if (!this.OP_HOOKS.has(op))
      throw Error(`Phase handler '${this.NAME}':'${op}' is not defined`);
    let status = 'REGD';
    if (!(f instanceof Function)) {
      // no function means "implicit mock"
      status = 'MOCK';
    }
    // get the list of promises associated with this op
    // and add the new promise
    const hook = { f, scope };
    this.OP_HOOKS.get(op).push(hook);
    if (DBG.init) console.log(...PR(`${status} '${this.NAME}.${op}' Hook`));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: execute all Promises associated with a op, completing when
   *  all the callback functions complete. If the callback function returns
   *  a Promise, this is added to a list of Promises to wait for before the
   *  function returns control to the calling code.
   */
  execute(op, ...args) {
    // note: contents of PHASE_HOOKs are promise-generating functions
    if (!this.OP_HOOKS.has(op)) throw Error(`${op} is not a recognized EXEC op`);
    if (op.startsWith('PHASE_') && DBG.phases)
      console.log(`warning:${op} phase group executed as single op`);

    // check that there are promises to execute
    let hooks = this.OP_HOOKS.get(op);
    if (hooks.length === 0) {
      if (DBG.ops) console.log(...PR(`[${op}] no subscribers`));
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
      console.log(...PR(`[${op}] HANDLERS PROCESSED : ${hooks.length}`));
    if (DBG.ops && icount)
      console.log(...PR(`[${op}] AWAITING ${icount} PROMISES TO COMPLETE...`));

    // wait for all promises to execute
    return Promise.all(promises)
      .then(values => {
        if (DBG.ops && values.length)
          console.log(
            ...PR(`[${op}] PROMISES RETVALS  : ${values.length}`, values)
          );
        return values;
      })
      .catch(err => {
        console.log(...PR(`[${op}]: ${err}`));
        throw Error(`[${op}]: ${err}`);
      });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: execute all Promises associated with a Phase Group in serial
   *  css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
   */
  executePhase(phaseName, ...args) {
    if (DBG.phases) console.log(...PR(`executePhase('${phaseName}')`));
    const ops = this.PHASES[phaseName];
    if (ops === undefined)
      throw Error(`Phase "${phaseName}" doesn't exist in ${this.NAME}`);
    const phaseHookFuncs = this.getHookFunctions(phaseName);
    let index = 0;
    return ops.reduce(
      async (previousPromise, nextOp) => {
        phaseHookFuncs.forEach(f => f(ops, index++));
        await previousPromise; // wait for previous promise to finish
        return this.execute(nextOp, ...args); // queue next promise
      },
      phaseHookFuncs.forEach(f => f(ops, index++))
    ); // initial value of previousPromise
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: execute all Promises associated with a Phase Group in parallel
   */
  executePhaseParallel(phaseName, ...args) {
    const ops = this.PHASES[phaseName];
    if (ops === undefined) throw Error(`Phase "${phaseName}" doesn't exist`);
    return Promise.all(ops.map(op => this.execute(op, ...args)));
    // fix this and return promise
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Return hooks array for a given operation. Useful when
   *  using closures to create an optimal execution function as in
   *  client-exec SystemAppRun()
   */
  getHookFunctions(op) {
    if (DBG.ops) console.log(...PR(`getting hook for '${op}'`));
    return this.OP_HOOKS.get(op).map(hook => hook.f);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** UTILITY: Return a Map organized by phase:functions[]
   */
  getPhaseFunctionsAsMap(phaseName) {
    if (!phaseName.startsWith('PHASE_'))
      throw Error(`${phaseName} is not a Phase Group name`);
    if (DBG.ops) console.log(...PR(`getting hook map for phase '${phaseName}'`));
    const phaseOps = this.PHASES[phaseName]; // list of operations in the phase
    const map = new WeakMap();
    phaseOps.forEach(pop => {
      map.set(
        pop,
        this.OP_HOOKS.get(phaseName).map(hook => hook.f)
      );
    });
    return map;
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Queue hook requests even if machine isn't already defined.
 *  This routine can be used as the standard hook method for UR clients.
 */
PhaseMachine.Hook = (phaseSel, f) => {
  if (typeof phaseSel !== 'string')
    throw Error('arg1 must be phase selector like MACHINE/PHASE');
  if (typeof f !== 'function' && f !== undefined)
    throw Error('arg2 must be function or undefined');
  //
  const { machine, phase } = m_DecodePhase(phaseSel);
  const pm = m_machines.get(machine);
  // if phasemachine is already valid, then just hook it directly
  if (pm) {
    pm.hook(phase, f);
    return;
  }
  // otherwise, queue the request
  if (!m_queue.has(machine)) m_queue.set(machine, []);
  const q = m_queue.get(machine);
  q.push([phase, f]); // array of 2-element arrays
};

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PhaseMachine;
