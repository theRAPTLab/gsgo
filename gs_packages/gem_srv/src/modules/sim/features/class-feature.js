/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation.
 */
class Feature {
  //
  constructor(name) {
    this.meta = {
      feature: name
    };
    this.methods = new Map();
    // features only store methods!!!
    // because features are not instance per agent, but instead
    // are code libraries. agents provide memory context and props
  }

  /**
   *  hook into lifecycle methods
   */
  initialize(phaseMachine) {
    // do something
  }

  /**
   *  return name of this feature feature, used for adding a GSDictionary
   *  property by name to Agent.props
   */
  name() {
    return this.meta.feature;
  }

  /**
   *  called by agent template function when creating new agent
   *  note: subclassers must override this method as necessary
   */
  decorate(agent) {
    console.log(`class feature '${this.name()}' decorate '${agent.name()}'`);
    if (agent.features.has(this.name()))
      console.log(`agent decorate '${agent.name()}'`);
    else throw Error(`decorate: agent already bound to feature ${this.name()}`);

    if (!agent.props.has(this.name)) agent.props.set(this.name(), new Map());
    else throw Error(`decorate: agent already has props.${this.name}`);
    return this;
  }

  /**
   *  return prop located in the agent
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  addProp(agent, prop, gvar) {
    const FP = agent.props.get(this.name());
    FP.set(prop, gvar);
  }
  prop(agent, key) {
    const FP = agent.props.get(this.name());
    if (FP instanceof Map) return FP.get(key);
    throw Error(`decorate: agent doesn't have props map ${this.name()}`);
  }

  /** return method or function for feature invocation
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  method(agent, key) {
    return this.methods.get(key);
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
