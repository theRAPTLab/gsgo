/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GSVar class provides uniqueIds for each variable in the system

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
function m_VarCount() {
  return m_counter++;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GSVariable {
  constructor() {
    this.meta = {
      id: m_VarCount(),
      type: Symbol.for('GSVariable')
    };
    this.var = undefined;
  }
  get value() {
    return this.var;
  }
  set value(value) {
    this.var = value;
  }
  get() {
    return this.var;
  }
  serialize() {
    return ['value', this.var];
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
GSVariable.GetTypes = GetTypes;
GSVariable.GetValues = GetValues;
GSVariable.IsAgentString = IsAgentString;
GSVariable.IsPropString = IsPropString;
export default GSVariable;
