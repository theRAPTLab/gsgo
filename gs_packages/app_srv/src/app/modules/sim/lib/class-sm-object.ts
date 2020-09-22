/* eslint-disable react/static-property-placement */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Scopeable Stack Machine Object

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, IScopeable, TStackable, TMethod, TValue } from './t-smc';

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
function AddProp(agent: IAgent, prop: string, gvar: IScopeable) {
  const { props } = agent;
  if (props.has(prop)) throw Error(`prop '${prop}' already added`);
  props.set(prop, gvar);
  return gvar;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add a method to an agent's method map by method name */
function AddMethod(agent: IAgent, name: string, smc_or_f: TMethod): IAgent {
  const { methods } = agent;
  if (methods.has(name)) throw Error(`method '${name}' already added`);
  methods.set(name, smc_or_f);
  agent[name] = smc_or_f;
  return agent;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Object implements IScopeable {
  id: number; // unique within all stack machine objects
  _value: any;
  meta: { type: symbol; name?: string };
  props: Map<string, IScopeable>;
  methods: Map<string, TMethod>;
  constructor(initValue?: any) {
    // init is a literal value
    this._value = initValue;
    this.id = new_obj_id();
    this.meta = {
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
  get(): TValue {
    return this._value;
  }
  set(value: TValue) {
    this._value = value;
    return this;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named property to SMC_Object prop map */
  addProp(pName: string, gvar: IScopeable): IScopeable {
    const { props } = this;
    if (props.has(pName)) throw Error(`prop '${pName}' already added`);
    props.set(pName, gvar);
    return gvar;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named method to SMC_Object method map */
  addMethod(name: string, smc_or_f: TMethod): void {
    const { methods } = this;
    if (methods.has(name)) throw Error(`method '${name}' already added`);
    methods.set(name, smc_or_f);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar assocated with propName
   *  @param {string} propName - name of property
   *  @returns {GVar} - value object
   */
  prop(key: string): IScopeable {
    return this.props.get(key);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call a named method function using javascript semantics */
  method(key: string, ...args: any): TStackable[] {
    const method: TMethod = this.methods.get(key);
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
