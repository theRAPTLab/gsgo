/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Factory!

  we have an agent template that is an object with props and methods defined.
  however, we want to make agent instances from this object, so how is
  that done?

  1. the template must have instructions in it for creating a new object,
     probably stored inside a function that returns an object.
  2. the template must be look-upable by name.
  3. derived agents must be able to decorate the template object by
     retrieving the base agent and composing it together with new methods,
     properties, and feature references.
  4. features need to initialize their storage inside the function in (1)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSNumber from '../properties/var-number';
import GSString from '../properties/var-string';
import Feature from '../features/feature';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEMPLATES = new Map();

/// MODULE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
function m_AgentCount() {
  return m_counter++;
}

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
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
 *  @param {string} feature - name of Feature to look up and add
 *  @returns {Feature} - for chaining agent calls
 */
function AddFeature(agent, feature) {
  if (agent.features.has(feature))
    throw Error(`feature '${feature}' already to template`);
  const fpack = Feature.GetByName(feature);
  if (!fpack) throw Error(`'${feature}' is not an available feature`);
  agent.features.set(fpack.name, fpack);
  // this should return agent
  return fpack.decorate(agent);
}

/// AGENT CLASS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class to create a base agent. Agents are extended not through inheritance,
 *  but instead with composition on the props and features object
 *  with additional properties, methods, and features
 */
class Agent {
  constructor(agentName = '<anon>') {
    if (typeof agentName !== 'string') throw Error('arg1 must be string');
    // meta information
    this.meta = {
      id: m_AgentCount(),
      template: 'Agent'
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
  }

  // accessor methods for built-in props
  name = () => this.name;
  x = () => this.x;
  y = () => this.y;
  skin = () => this.skin;

  // definition methods
  defineProp = (name, gvar) => AddProp(this, name, gvar);
  defineMethod = (name, methodFunc) => AddMethod(this, name, methodFunc);
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
  feature(name) {
    const fpack = this.features.get(name);
    if (!fpack) throw Error(`feature ${name} is not installed in this agent`);
    return fpack;
  }

  // event queue methods
  queue() {
    console.log('queue() unimplemented');
  }
} // end of Agent class

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Templates are factory functions that are stored by name in the
 *  TEMPLATES map. The factory function accepts an agentName that
 *  is used to create the base agent.
 *  When calling this function, provide the templateName and a function
 *  that will be used to add additional properties, features, and methods
 *  to the agent. Use the AgentFactory methods
 *  modify.
 */
function AddTemplate(name, f_Decorate) {
  if (TEMPLATES.has(name)) throw Error(`state template '${name}' already exists`);
  const factoryFunc = agentName => {
    const agent = new Agent(agentName);
    f_Decorate(agent);
    agent.meta.template = name;
    return agent;
  };
  console.log(`storing template: '${name}`);
  TEMPLATES.set(name, factoryFunc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Factory method to return a new Agent
 *  @param {string} agentName - name of this instance
 *  @param {string} template - name of the template to use (default 'Agent')
 */
function MakeAgent(agentName, options = {}) {
  const { template } = options;
  if (template === undefined) return new Agent(agentName);
  const factoryFunc = TEMPLATES.get(template);
  if (!factoryFunc) throw Error(`agent template '${template}' not defined`);
  // return the created agent from template
  return factoryFunc(agentName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Convert an agent to a serializable object format
 */
function ExportAgent(agent) {
  // this is our serialization data structure
  const obj = {
    meta: [],
    props: {
      var: [],
      bool: [],
      num: [],
      str: []
    },
    features: []
  };

  // serialize low level agent properties
  const metaKeys = Object.entries(agent.meta);
  metaKeys.forEach(entry => obj.meta.push(entry));
  // serialize all properties by name, value, and addition parameters
  const propKeys = [...agent.props.keys()];
  propKeys.forEach(key => {
    const prop = agent.props.get(key);
    const serialized = prop.serialize();
    obj.props[prop.type].push([key, ...serialized]);
  });
  // collect features by name
  const featKeys = [...agent.features.keys()];
  featKeys.forEach(key => obj.features.push(key));

  // return serialized agent
  return obj;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  MakeAgent, // create an agent instance from template
  AddTemplate, // add template function by name
  AddProp, // add a property to an object's props map
  AddMethod, // add a method to an object's method map
  ExportAgent // return serializable object representing an agent instance
};
