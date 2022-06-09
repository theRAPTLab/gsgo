/* eslint-disable react/static-property-placement */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Scopeable Stack Machine Object

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_objcount = 100; // smobject id creator

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function new_obj_id() {
  return m_objcount++;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Object implements ISM_Object {
  id: any; // unique within all stack machine objects
  refId?: any; // optional class specific id
  _value: any;
  meta: { type: symbol; name?: string };
  prop: SM_Dict;
  method: SM_Dict;
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
  addProp(pName: string, gvar: ISM_Object): ISM_Object {
    const prop = this.prop[pName];
    if (prop) throw Error(`prop '${pName}' already added`);
    this.prop[pName] = gvar;
    return gvar;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a named method to SMC_Object method map */
  addMethod(mName: string, smc_or_f: TSM_Method): void {
    const method = this.method[mName];
    if (method) throw Error(`method '${mName}' already added`);
    method[mName] = smc_or_f;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar associated with propName
   *  @param {string} propName - name of property
   *  @returns {GVar} - value object
   */
  getProp(key: string): ISM_Object {
    return this.prop[key];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the value of the gvar associated with propName */
  getPropValue(key: string): ISM_Object {
    return this.prop[key].value;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call a named method function using javascript semantics */
  getMethod(key: string): TSM_Method {
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export class
export default SM_Object;
