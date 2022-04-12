/* eslint-disable react/static-property-placement */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Scopeable Stack Machine Object

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IKeyObject, IAgent, IScopeable, TSymbolData, TMethod } from './t-script';

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
function AddProp(agent: IAgent, pName: string, gvar: IScopeable) {
  if (!agent.prop[pName]) throw Error(`prop '${pName}' already added`);
  agent.prop[pName] = gvar;
  return gvar;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add a method to an agent's method map by method name */
function AddMethod(agent: IAgent, mName: string, smc_or_f: TMethod): IAgent {
  if (!agent.method[mName]) throw Error(`method '${mName}' already added`);
  agent.method[mName] = smc_or_f;
  agent[mName] = smc_or_f;
  return agent;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Object implements IScopeable {
  id: any; // unique within all stack machine objects
  refId?: any; // optional class specific id
  _value: any;
  meta: { type: symbol; name?: string };
  prop: IKeyObject;
  method: IKeyObject;
  //
  static Symbols: TSymbolData; // symbol data
  //
  constructor(initValue?: any) {
    // init is a literal value
    this._value = initValue;
    this.id = new_obj_id();
    this.meta = {
      type: Symbol.for('SM_Object')
    };
    if (typeof initValue === 'string') this.meta.name = initValue;
    this.prop = {};
    this.method = {};
  }

  /// GETTER/SETTER
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
  get name() {
    return this.meta.name;
  }
  set name(value) {
    this.meta.name = value;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named property to SMC_Object prop map */
  addProp(pName: string, gvar: IScopeable): IScopeable {
    const prop = this.prop[pName];
    if (prop) throw Error(`prop '${pName}' already added`);
    this.prop[pName] = gvar;
    return gvar;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named method to SMC_Object method map */
  addMethod(mName: string, smc_or_f: TMethod): void {
    const method = this.method[mName];
    if (method) throw Error(`method '${mName}' already added`);
    method[mName] = smc_or_f;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar assocated with propName
   *  @param {string} propName - name of property
   *  @returns {GVar} - value object
   */
  getProp(key: string): IScopeable {
    return this.prop[key];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call a named method function using javascript semantics */
  getMethod(key: string): TMethod {
    return this.method[key];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return symbol data, override in subclassers */
  symbolize(): TSymbolData {
    return {};
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
