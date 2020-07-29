/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GSBase is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  * this.props is a <key,value> map
  * this.methods is a <key,[function || smc_method]> map
  * this._value is used by property classes
  * base.value is a getter/setter
  * base.get() and base.set() are alternative accessors
  * serializer() returns

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_objcount = 100;
function new_obj_id() {
  return m_objcount++;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSBase {
  constructor(init) {
    // init is a literal value
    this._value = init;
    this.meta = {
      id: new_obj_id(),
      type: Symbol.for('GSBase')
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
  const values = mixedArray.map(gbv => {
    if (gbv instanceof GSBase) return gbv.value;
    return gbv;
  });
  return values;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of mixed gbase and literals, return an array of
 *  types
 */
function GetTypes(mixedArray) {
  const types = mixedArray.map(gbv => {
    if (gbv instanceof GSBase) return gbv.meta.type;
    if (typeof gbv === 'string') return 'STR'; // literal string
    if (typeof gbv === 'number') return 'NUM'; // literal number
    if (typeof gbv === 'boolean') return 'BOL'; // literal boolean
    throw Error(`unknown variable type '${gbv}'`);
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
/// attach static methods to class
GSBase.GetTypes = GetTypes;
GSBase.GetValues = GetValues;
GSBase.IsAgentString = IsAgentString;
GSBase.IsPropString = IsPropString;
/// export class
export default GSBase;
