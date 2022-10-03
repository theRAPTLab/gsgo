/* eslint-disable react/static-property-placement */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulator (Stack Machine) Object

  SM_Object is used for Agents and Agent Properties, as well as anything that
  has to work with StackMachineCode (SMC)

  This class is the base class for all agents and prop types (gvars).
  It allows the stack machine to maintain a "scope" stack of either agents
  or props.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_objcount = 100; // smobject id creator
const DBG = false;

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Create a unique id for every simulator object that's instanced into the
 *  engine, which will be important for mapping these objects to derived
 *  objects like for rendering sprites through display lists */
function m_new_obj_id() {
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

  /// SETUP ///////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(initValue?: any) {
    // init is a literal value
    this._value = initValue;
    this.id = m_new_obj_id();
    this.meta = {
      type: Symbol.for('SM_Object')
    };
    if (typeof initValue === 'string') this.meta.name = initValue;
    this.prop = {};
    this.method = {};
  }
  /// BUILT-IN GETTERS AND SETTERS ////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  get name() {
    return this.meta.name;
  }
  set name(value) {
    this.meta.name = value;
  }

  /// API: SIM OBJECTS ////////////////////////////////////////////////////////
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
  addMethod(mName: string, code: TSM_Method): void {
    const method = this.method[mName];
    if (method) throw Error(`method '${mName}' already added`);
    method[mName] = code;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the gvar associated with propName, which could be in objref
   *  (dotted) format indicating a nested prop (Features use this) */
  getProp(pName: string): ISM_Object {
    const parts = pName.split('.');
    let propDict = parts.length === 1 ? undefined : parts[0];
    let prop = parts.length === 1 ? parts[0] : parts[1];
    if (propDict) return this.prop[propDict][prop];
    return this.prop[prop];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: return the value of the gvar associated with propName */
  getPropValue(pName: string): ISM_Object {
    return this.getProp(pName).value;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call a named method function using javascript semantics. Agents will
   *  have to override this method to search for objref-style notation */
  getMethod(key: string): TSM_Method {
    return this.method[key];
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to write a 'name' property into any methods dictionary as a copy
   *  of its key, so we don't have to define the same data it twice (once as a
   *  key, once as a name */
  static _SymbolizeNames(symbols: TSymbolData): TSymbolData {
    const fn = 'SMObject.SymbolizeNames:';
    const { methods } = symbols || {};
    if (methods === undefined) return;
    Object.keys(methods).forEach(methodKey => {
      if (methods[methodKey].name === undefined) {
        methods[methodKey].name = methodKey;
        if (DBG)
          console.log(
            `${fn} copying ${methodKey} into name:`,
            methods[methodKey]
          );
      }
    });
    return symbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Object._SymbolizeNames(SM_Object.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return SM_Object.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static symbol declarations */
  static Symbols: TSymbolData = {}; // symbol data
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SM_Object;
