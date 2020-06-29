/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSNumber from '../properties/var-number';
import GSString from '../properties/var-string';
import FeatureLib from '../features/featurefactory';
import GlobalLib from '../features/feature-global';

/// MODULE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
function m_AgentCount() {
  return m_counter++;
}

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Add a property to an agent's prop map by property name
 *  @param {Agent} agent - instance of Agent class
 *  @param {string} prop - name of property to add
 *  @param {GSVariable} gvar - GSVariable instance
 *  @returns {GSVariable} - for chaining
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
  if (method.has(methods)) throw Error(`method '${method}' already added`);
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
  if (agent.features.has(feature))
    throw Error(`feature '${feature}' already to template`);
  const fpack = FeatureLib.GetByName(feature);
  if (!fpack) throw Error(`'${feature}' is not an available feature`);
  agent.features.set(fpack.name, fpack);
  // this should return agent
  return fpack.decorate(agent);
}

/*///////////////////////////////// CLASS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent class has four main storage objects:

  * 'props' maps propertyNames to gsVariable instance
  * 'methods' maps user-defined methodNames to function objects
  * 'features' maps featurePackageName to feature plugins
  * 'events' is a queue of messages between different stages of the agent
    lifecycle.

  Each of these storage objects are populated with an associated
  definition method, which are available to user programming:

    defProp('propName',gsVar) -> GSVar
    defMethod('methodName', functionObj) -> Agent
    addFeature('featureName') -> FeaturePack

  The stored properties, methods, and features have corresponding
  retrieval methods which hide the internal storage mechanism:

    prop('propName') -> GSVar
    method('methodName', ...args) -> result
    feature('featureName') -> FeaturePack

  There is an IMPORTANT DISTINCTION between AGENT definition and
  TEMPLATE definition:

  * An Agent Definition is a blank STORAGE OBJECT with a unique AgentType.
    The Agent class implements storage and storage accessors as described
    above.

  * An Agent Template is a FUNCTION that creates an agent, then
    DECORATES it with the properties, methods, and features that make
    it unique. This function can use the agent's built-in storage
    accessors to manipulate it at programming time.

  Agent Templates are handled by the AgentFactory module.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
class Agent {
  constructor(agentName = '<anon>') {
    if (typeof agentName !== 'string') throw Error('arg1 must be string');
    // meta information
    this.agent = {
      id: m_AgentCount(),
      type: 'Agent'
    };
    // initialize storage
    this.props = new Map();
    this.methods = new Map();
    this.features = new Map();
    this.events = [];
    // add common properties
    this.name = new GSString(agentName);
    this.x = new GSNumber();
    this.y = new GSNumber();
    this.skin = new GSString();
    // mirror in props for conceptual symmetry
    this.props.set('name', this.name);
    this.props.set('x', this.x);
    this.props.set('y', this.y);
    this.props.set('skin', this.skin);
    // add global feature
    this.features.set('*', GlobalLib);
  }

  // accessor methods for built-in props
  name = () => this.name;
  x = () => this.x;
  y = () => this.y;
  skin = () => this.skin;

  // definition methods
  defProp = (name, gvar) => AddProp(this, name, gvar);
  defMethod = (name, methodFunc) => AddMethod(this, name, methodFunc);
  addFeature = name => AddFeature(this, name);

  // accessor methods for user+feature props
  prop(name) {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no prop named '${name}'`);
    return p;
  }
  method(name, ...args) {
    const f = this.methods.get(name);
    if (f === undefined) throw Error(`no method named '${name}'`);
    return f.apply(this, args);
  }
  // rewrite this to forward agent
  feature(name) {
    const fpack = this.features.get(name);
    if (!fpack) throw Error(`feature ${name} is not installed in this agent`);
    return fpack; // instance of Feature
  }

  test(func) {}

  // event queue methods
  queue() {
    console.log('queue() unimplemented');
  }
} // end of Agent class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Agent.AddFeature = AddFeature;
Agent.AddMethod = AddMethod;
Agent.AddProp = AddProp;
export default Agent;
