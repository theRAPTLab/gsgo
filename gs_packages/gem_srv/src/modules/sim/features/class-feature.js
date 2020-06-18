/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Features can (1) modify the agent (2) use agent properties to update
  its own properties stored in the agent (3) queue an event for a later
  stage in the agent's event queue.

  Features are instantiated once.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATURES = new Map(); // track all features

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class Feature {
  constructor(name) {
    if (FEATURES.has(name)) throw Error(`feature named ${name} already exists`);
    this.name = name;
    FEATURES.set(name, this);
    // subclassers can add other properties
  }

  /** initializes storage on agent
   */
  agentInit(agent) {
    if (agent.features.has(this.name))
      throw Error(`agent already bound to feature ${this.name}`);
    // initialize empty object in agent.props[featureName]
    agent.props.set(this.name, {});
    // subclassers
  }

  /** retrieve feature prop from agent.prop[this.name][propName]
   */
  prop(agent, propName) {
    // get the feature storage object
    const fpobj = agent.prop.get(this.name);
    // return the propName for chaining
    return fpobj[propName];
  }

  /** set feature prop
   */
  setProp(agent, propName, gVar) {
    // get the feature storage object
    const fpobj = agent.prop.get(this.name);
    // store the variable and return gVar for chaining
    fpobj[propName] = gVar;
    return gVar;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
