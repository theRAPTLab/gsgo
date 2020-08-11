/* eslint-disable react/static-property-placement */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Scopeable Stack Machine Object

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  T_Agent,
  T_Scopeable,
  T_Stackable,
  T_Method,
  T_Value
} from '../types/t-smc';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const METHOD_ERR = 'sm-object does not support smc methods';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_objcount = 100;
function new_obj_id() {
  return m_objcount++;
}

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add a property to an agent's prop map by property name */
function AddProp(agent: T_Agent, prop: string, gvar: T_Scopeable) {
  const { props } = agent;
  if (props.has(prop)) throw Error(`prop '${prop}' already added`);
  props.set(prop, gvar);
  return gvar;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add a method to an agent's method map by method name */
function AddMethod(agent: T_Agent, name: string, smc_or_f: T_Method): T_Agent {
  const { methods } = agent;
  if (methods.has(name)) throw Error(`method '${name}' already added`);
  methods.set(name, smc_or_f);
  agent[name] = smc_or_f;
  return agent;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Object implements T_Scopeable {
  _value: any;
  meta: { id: number; type: symbol; name?: string };
  props: Map<string, T_Scopeable>;
  methods: Map<string, T_Method>;
  constructor(initValue?: any) {
    // init is a literal value
    this._value = initValue;
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
  get(): T_Value {
    return this._value;
  }
  set(value: T_Value) {
    this._value = value;
    return this;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named property to SMC_Object prop map */
  addProp(pName: string, gvar: T_Scopeable): T_Scopeable {
    const { props } = this;
    if (props.has(pName)) throw Error(`prop '${pName}' already added`);
    props.set(pName, gvar);
    return gvar;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named method to SMC_Object method map */
  addMethod(name: string, smc_or_f: T_Method): void {
    const { methods } = this;
    if (methods.has(name)) throw Error(`method '${name}' already added`);
    methods.set(name, smc_or_f);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar assocated with propName
   *  @param {string} propName - name of property
   *  @returns {GVar} - value object
   */
  prop(key: string): T_Scopeable {
    return this.props.get(key);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call a named method function using javascript semantics */
  method(key: string, ...args: any): T_Stackable[] {
    const method: T_Method = this.methods.get(key);
    if (typeof method === 'function') return method.call(this, ...args);
    throw Error(METHOD_ERR);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return a serializer array */
  serialize(): any {
    return ['value', this._value];
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of mixed gbase and literals, return an array of
 *  pure values
 */
function GetValues(mixedArray: any[]): any[] | SM_Object {
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
function GetTypes(mixedArray: any[]): string[] {
  const types = mixedArray.map(smo => {
    if (smo instanceof SM_Object) return 'SMOBJ'; // SM_Object
    if (typeof smo === 'string') return 'STR'; // literal string
    if (typeof smo === 'number') return 'NUM'; // literal number
    if (typeof smo === 'boolean') return 'BOL'; // literal boolean
    throw Error(`unknown variable type '${smo}'`);
  });
  return types;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test for string keys that do not contain a . */
function IsAgentString(str: string): boolean {
  if (typeof str !== 'string') throw Error('arg must be string');
  const len = str.split('.').length;
  if (len === 1) return true; // agent = string without periods
  return false; // dot is in name
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test for string keys than begin with . */
function IsPropString(str: string): boolean {
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
