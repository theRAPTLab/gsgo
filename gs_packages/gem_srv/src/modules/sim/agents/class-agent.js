/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GSVar from '../properties/var';
import GSNumber from '../properties/var-number';
import GSString from '../properties/var-string';
import FeatureLib from '../features/featurefactory';
import GlobalLib from '../features/feature-global';
import { AddFeature, AddProp, AddMethod } from '../smc/utils-smcobj';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_counter = 100;
const m_agents = new Map();

/// MODULE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_AgentCount() {
  return m_counter++;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return strings useful for making a condition key
 */
function m_MakeKeyParts(agent, gvars) {
  const agentkey = agent.meta.type;
  const gvarkey = GSVar.GetTypes(gvars).join('.');
  return { agentkey, gvarkey };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER:
 *  retrieve an array of values based on passed properties and keys
 */
function GetAgentValues(...args) {}

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
    this.meta = {
      id: m_AgentCount(),
      type: 'Agent'
    };
    // initialize storage
    this.props = new Map();
    this.methods = new Map();
    this.features = new Map();
    this.events = [];
    // mirror in props for conceptual symmetry
    this.props.set('name', new GSString(agentName));
    this.props.set('x', new GSNumber());
    this.props.set('y', new GSNumber());
    this.props.set('skin', new GSString());
    // add global feature
    this.features.set('*', GlobalLib);
  }

  // accessor methods for built-in props
  name = () => this.prop('name').value;
  x = () => this.prop('x').value;
  y = () => this.prop('y').value;
  skin = () => this.prop('skin').value;

  // definition methods
  defProp = (name, gvar) => AddProp(this, name, gvar);
  defMethod = (name, methodFunc) => AddMethod(this, name, methodFunc);
  addFeature = name => AddFeature(this, name);

  // props return gvars
  // e.g. let x = agent.prop('x').value;
  prop(name) {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no prop named '${name}'`);
    return p;
  }

  // to call an op as a method, do some conversion
  method(name, ...args) {
    const stack = [...args];
    this.opExec(name, stack);
    return stack.pop();
  }

  // operations receive arguments from a stack
  opExec(name, stack) {
    const opExec = this.methods.get(name);
    if (opExec === undefined) throw Error(`no method named '${name}'`);
    return opExec.apply(this, stack);
  }

  // return a condition object
  if() {
    return this;
  }

  // agent test
  addTest(condition, gvars = [], execFunc) {
    // condition.test = (this, parms) => (testResult { value, ...results })
    // condition.name = 'TEST_NAME'
    // condition.value = true/false
    // condition.data = {}
    const { agentkey, gvarkey } = m_MakeKeyParts(this, gvars);
    const key = `conditionkey${agentkey}${gvarkey}`;
    // we want to add this condition test to the pool of tests
    console.log('todo: conditions[key] = { condition, gvars, execFunc }');
    // temporary queue test...this should happen only in execFunc
    this.queue(condition, gvars, execFunc);
  }

  // event queue methods
  queue(condition, gvars, execFunc) {
    const results = condition(this, gvars, execFunc);
    console.log(`agent ${this.name()} results:`, results);
    if (results) {
      console.log('executing function with agent');
      execFunc(this);
    }
  }
} // end of Agent class

/// AGENT SET UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types */
function SaveAgent(agent) {
  const { id, type } = agent.meta;
  if (!m_agents.has(type)) m_agents.set(type, new Set());
  const agents = m_agents.get(type);
  if (agents.has(id)) throw Error(`agent id${id} already in ${type} list`);
  // console.log(`m_agents now has ${m_agents.get(type).size}`);
  agents.add(agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set */
function GetAgentSet(type) {
  const agents = m_agents.get(type);
  return agents || [];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Agent.AddFeature = AddFeature;
Agent.AddMethod = AddMethod;
Agent.AddProp = AddProp;
Agent.SaveAgent = SaveAgent;
Agent.GetAgentSet = GetAgentSet;
export default Agent;
