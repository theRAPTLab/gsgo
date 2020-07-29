/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_objcount = 100;
function new_obj_id() {
  return m_objcount++;
}

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Add a property to an agent's prop map by property name
 *  @param {Agent} agent - instance of Agent class
 *  @param {string} prop - name of property to add
 *  @param {GSVar} gvar - GSVar instance
 *  @returns {GSVar} - for chaining
 */
function AddProp(agent, prop, gvar) {
  const { props } = agent;
  if (props.has(prop)) throw Error(`prop '${prop}' already added`);
  props.set(prop, gvar);
  return gvar;
}
/// MODULE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MapHas(map, key) {
  return map.get(key) || false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MapGet(map, key) {
  const v = m_MapHas(key);
  if (!v) throw Error(`no key in map '${key}'`);
  return v;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  add a method to an agent's method map by method name
 *  @param {Agent} agent - instance of Agent class
 *  @param {string} method - name of method to add
 *  @param {function} func - function signature (agent,...args)
 *  @returns {Agent} - for chaining agent calls
 */
function AddMethod(agent, method, func) {
  const { methods } = agent;
  if (methods.has(method)) throw Error(`method '${method}' already added`);
  methods.set(method, func);
  agent[method] = func;
  return agent;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Object {
  constructor(init) {
    // init is a literal value
    this._value = init;
    this.meta = {
      id: new_obj_id(),
      type: Symbol.for('SM_Object')
    };
    this.props = new Map();
    this.methods = new Map();
  }

  /// getter/setter and get() set() equivalents
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
  get() {
    return this._value;
  }
  set(value) {
    this._value = value;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Add a named property to SMC_Object prop map
   *  @param {string} propName - name of property to add
   *  @param {SM_Object} gvar - SM_Object instance
   *  @returns {SM_Object} - for chaining
   */
  addProp(pName, gvar) {
    const { props } = this;
    if (props.has(pName)) throw Error(`prop '${pName}' already added`);
    props.set(pName, gvar);
    return gvar;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: add a named method to SMC_Object method map
   *  @param {string} methodName - name of method to add
   *  @param {function} func - function(args)
   *  @returns {SMC_Object} - for chaining agent calls
   */
  addMethod(mName, func) {
    const { methods } = this;
    if (methods.has(mName)) throw Error(`method '${mName}' already added`);
    methods.set(mName, func);
    return this;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar assocated with propName
   *  @param {string} propName - name of property
   *  @returns {GVar} - value object
   */
  prop(pName) {
    return m_MapGet(this.props, pName);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: call a named method function using javascript semantics
   *  @param {string} methodName - name of method
   *  @param {...*} args - list of arguments
   */
  method(mName, ...args) {
    const method = m_MapGet(this.methods, mName);
    return method.call(this, ...args);
  }
  /// serializer
  serialize() {
    return ['value', this._value];
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of mixed gbase and literals, return an array of
 *  pure values
 */
function GetValues(mixedArray) {
  const values = mixedArray.map(smo => {
    if (smo instanceof SM_Object) return smo.value;
    return smo;
  });
  return values;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of mixed gbase and literals, return an array of
 *  types
 */
function GetTypes(mixedArray) {
  const types = mixedArray.map(smo => {
    if (smo instanceof SM_Object) return smo.meta.type;
    if (typeof smo === 'string') return 'STR'; // literal string
    if (typeof smo === 'number') return 'NUM'; // literal number
    if (typeof smo === 'boolean') return 'BOL'; // literal boolean
    throw Error(`unknown variable type '${smo}'`);
  });
  return types;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test for string keys that do not contain a . */
function IsAgentString(str) {
  if (typeof str !== 'string') throw Error('arg must be string');
  const len = str.split('.').length;
  if (len === 1) return true; // agent = string without periods
  return false; // dot is in name
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test for string keys than begin with . */
function IsPropString(str) {
  if (typeof str !== 'string') throw Error('arg must be string');
  if (!str.startsWith('.')) return false; // not a .string
  if (str.split('.').length !== 2) return false; // more than one .
  return true;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export class
export default SM_Object;
export {
  GetTypes,
  GetValues,
  IsAgentString,
  IsPropString,
  //
  AddProp,
  AddMethod
};
