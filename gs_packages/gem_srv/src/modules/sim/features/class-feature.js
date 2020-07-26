/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class. Creating a new feature means adding
  properties and methods that act on agents. FeaturePacks are created
  only once, because all methods use the passed agent for storing
  properties. If you need to persist information, store it in the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GDictionary from '../properties/var-dictionary';
import { FEATURES } from '../runtime-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
    // super(name)
    // this.newprop = ...
  }

  /** return the feature object stored in agent.props[feature] */
  getContext(agent) {
    return agent.prop.get(this.name);
  }

  /** called by agent template function when creating new agent */
  decorate(agent) {
    if (agent.features.has(this.name))
      throw Error(`agent already bound to feature ${this.name}`);
    return this;
    // SUBCLASSERS IMPLEMENT SOMETHING LIKE
    // super.decorate(agent);
    // const featMap = new GSDictionary(this.name);
    // agent.defProp(this.name,featMap);
    // agent.defMethod(
    // return this;
  }

  /** get feature prop value */
  prop(agent, propName) {
    // get the feature storage object
    const featMap = this.getContext(agent);
    // return the propName for chaining
    return featMap.get(propName);
  }

  /** set feature prop value */
  defProp(agent, propName, gVar) {
    // get the feature storage object, which is in its own object
    const featMap = this.getContext(agent);
    // store the variable and return gVar for chaining
    featMap.set(propName, gVar);
    return gVar;
  }

  /** SUBCLASSER IMPLEMENT ADDITIONAL METHODS LIKE THIS */
  // someMethod(agent,...args) {
  //   /* access feature props in the agent.props[feature][propname] */
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
Feature.AddExternal = fpack => {
  FEATURES.set(fpack.name, fpack);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
