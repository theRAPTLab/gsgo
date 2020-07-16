/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATURES = new Map(); // track all features

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation.
 */
class Feature {
  constructor(name) {
    if (FEATURES.has(name)) throw Error(`feature named ${name} already exists`);
    this.meta = {
      feature: name
    };
    FEATURES.set(name, this);
    // subclassers can add other properties
  }

  /** return the feature object stored in agent.props[featurename] */
  fpobj(agent) {
    return agent.prop.get(this.name);
  }

  decorate(agent) {
    if (agent.features.has(this.name))
      throw Error(`agent already bound to feature ${this.name}`);
    return this;
    // SUBCLASSERS IMPLEMENT SOMETHING LIKE
    // super.decorate(agent);
    // const fpobj = agent.defProp(this.name, {});
    // fpobj.newProp = 'hello';
    // return this;
  }

  /** get feature prop value */
  prop(agent, propName) {
    // get the feature storage object
    const fpobj = this.fpobj(agent);
    // return the propName for chaining
    return fpobj[propName];
  }

  /** set feature prop value */
  defProp(agent, propName, gVar) {
    // get the feature storage object, which is in its own object
    const fpobj = this.fpobj(agent);
    // store the variable and return gVar for chaining
    fpobj[propName] = gVar;
    return gVar;
  }

  /** SUBCLASSER IMPLEMENT ADDITIONAL METHODS LIKE THIS */
  // someMethod(agent) {
  //   /* access feature props in the agent.props[featurename][propname] */
  //   /* or agent props in  agent.props[propname] */
  //   const x = agent.x();
  //   if (this.prop('featureprop').value && x > 0) return true;
  //   return false;
  // }
} // end of class

/// LIBRARY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Feature.GetByName = name => {
  return FEATURES.get(name);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Feature.AddExternal = featurePack => {
  FEATURES.set(featurePack.name, featurePack);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
