/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let temp; // global temp variable to avoid creating new ones

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

  /** called by agent template function when creating new agent */
  decorate(agent) {
    if (!agent.features.has(this.name)) agent.features.set(this.name, this);
    else throw Error(`decorate: agent already bound to feature ${this.name}`);

    if (!agent.props.has(this.name)) agent.props.set(this.name, new Map());
    else throw Error(`decorate: agent already has props.${this.name}`);

    // register a public method for the feature
    this.methods.set('test', () => {
      return 'feature test succeeded';
    });
  }

  /** return prop located in the agent */
  prop(agent, key) {
    temp = agent.props.get(this.name);
    if (temp instanceof Map) return temp.get(key);
    throw Error(`decorate: agent doesn't have props map ${this.name}`);
  }

  /** return method or function for feature invocation
   *  remember: there is a single instance of all methods for the feature
   */
  method(agent, key) {
    return this.methods.get(key);
  }
  /** return dummy value */
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
