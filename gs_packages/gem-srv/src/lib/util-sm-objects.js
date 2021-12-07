/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GetFeature } from 'modules/datacore/dc-features';

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  add a featurepack to an agent's feature map by feature name
 *  featurepacks store its own properties directly in agent.props
 *  featurepacks store method pointers in agent.methods, and all methods
 *  have the signature method(agentInstance, ...args)
 *  @param {Agent} agent - instance of Agent class
 *  @param {string} feature - name of FeatureLib to look up and add
 *  @returns {FeatureLib} - for chaining agent calls
 */
function AddFeature(agent, feature) {
  if (agent.feature[feature])
    throw Error(`feature '${feature}' already to blueprint`);
  const fpack = GetFeature(feature);
  if (!fpack) throw Error(`'${feature}' is not an available feature`);
  agent.features.set(fpack.name, fpack);
  // this should return agent
  return fpack.decorate(agent);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AddProp, AddMethod, AddFeature };
