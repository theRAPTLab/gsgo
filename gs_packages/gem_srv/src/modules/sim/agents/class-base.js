/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachineObject implements prop and method maps.
  : this.props stores [key,value]
  : this.methods stores [method,functionRef]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
function m_ContextCount() {
  return m_counter++;
}

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Add a property to given context
 *  @param {StackMachineObject} obj - instance of Agent class
 *  @param {string} name - name of property to add
 *  @param {GSVar} gvar - GSVar instance
 *  @returns {GSVar} - for chaining
 */
function AddProp(obj, name, gvar) {
  const { props } = obj;
  if (props.has(prop)) throw Error(`prop '${prop}' already added`);
  props.set(prop, gvar);
  return gvar;
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
  if (method.has(methods)) throw Error(`method '${method}' already added`);
  methods.set(method, func);
  agent[method] = func;
  return agent;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class StackMachineObject {
  constructor() {
    this.meta = {
      id: m_ContextCount(),
      type: Symbol.for('GSBaseContext')
    };
    this.props = new Map();
    this.methods = new Map();
  }

  serialize() {
    return ['value', this._value];
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  given an array of mixed gvars and literals, return an array of
 *  pure values
 */
function GetValues(gvars) {
  const values = gvars.map(gvar => {
    if (gvar instanceof GSVariable) return gvar.value;
    return gvar;
  });
  return values;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  given an array of mixed gvars and literals, return an array of
 *  types
 */
function GetTypes(gvars) {
  const types = gvars.map(gvar => {
    if (gvar instanceof GSVariable) return gvar.meta.type;
    if (typeof gvar === 'string') return 'STR'; // literal string
    if (typeof gvar === 'number') return 'NUM'; // literal number
    if (typeof gvar === 'boolean') return 'BOL'; // literal boolean
    throw Error(`unknown gvar type '${gvar}'`);
  });
  return types;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsAgentString(str) {
  if (typeof str !== 'string') throw Error('arg must be string');
  const len = str.split('.').length;
  if (len === 1) return true; // agent = string without periods
  return false; // dot is in name
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsPropString(str) {
  if (typeof str !== 'string') throw Error('arg must be string');
  if (!str.startsWith('.')) return false; // not a .string
  if (str.split('.').length !== 2) return false; // more than one .
  return true;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StackMachineObject.GetTypes = GetTypes;
StackMachineObject.GetValues = GetValues;
StackMachineObject.IsAgentString = IsAgentString;
StackMachineObject.IsPropString = IsPropString;
export default StackMachineObject;
