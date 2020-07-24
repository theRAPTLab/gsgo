/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  STACK MACHINE (SMC) OBJECT
  base class for agents and properties
  implements a method() and prop() accessor
  implements a value getter/setter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { FEATURES } from '../simulation-data';
import { AddProp, AddMethod, AddFeature } from './utils-smcobj';
import GSVar from '../properties/var';
import SMC_State from './class-smcstate';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
const SMC_OBJS = new Map(); // array of all objects

/// MODULE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ObjectCount() {
  return m_counter++;
}
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

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SMC_Object {
  constructor() {
    this.meta = {
      id: m_ObjectCount(),
      type: 'SMC_Object'
    };
    this.props = new Map(); // name, gvar
    this.methods = new Map(); // name, function
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Add a named property to SMC_Object prop map
   *  @param {string} propName - name of property to add
   *  @param {GSVar} gvar - GSVar instance
   *  @returns {GSVar} - for chaining
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
  /** API: add a featurepack to an agent's feature map by feature name
   *  featurepacks store its own properties directly in agent.props
   *  featurepacks store method pointers in agent.methods, and all methods
   *  have the signature method(agentInstance, ...args)
   *  @param {string} featureName - name of FeatureLib to look up and add
   *  @returns {FeatureLib} - for chaining agent calls
   */
  addFeature(fName) {
    const { features } = this;
    if (features.has(fName))
      throw Error(`feature '${fName}' already in template`);
    const fpack = FEATURES.GetByName(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    features.set(fpack.name, fpack);
    // this should return agent
    return fpack.decorate(this);
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: call a named method function using smc semantics w/ stack
   */

  smc_method(mName, ...args) {
    const method = m_MapGet(this.methods, mName);
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SMC_Object;
