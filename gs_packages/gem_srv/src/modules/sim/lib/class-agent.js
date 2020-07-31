/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object, { AddProp, AddMethod } from './class-sm-object';
import { FEATURES } from '../runtime-core';
import NumberVar from '../props/var-number';
import StringVar from '../props/var-string';

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
class Agent extends SM_Object {
  constructor(agentName = '<anon>') {
    super(agentName); // sets _value to agentName, which is only for debugging
    // this.props map defined in SM_Object
    // this.methods map defined in SM_Object
    this.features = new Map();
    this.events = [];

    // declare agent basic properties
    this._name = new StringVar(agentName);
    this._x = new NumberVar();
    this._y = new NumberVar();
    this._skin = new StringVar();
    // mirror basic props in props for conceptual symmetry
    this.props.set('name', this._name);
    this.props.set('x', this._x);
    this.props.set('y', this._y);
    this.props.set('skin', this._skin);
  }

  // accessor methods for built-in props
  name = () => this._name.value;
  x = () => this._x.value;
  y = () => this._y.value;
  skin = () => this._skin.value;

  // definition methods
  defProp = (name, gvar) => AddProp(this, name, gvar);
  defMethod = (name, methodFunc) => AddMethod(this, name, methodFunc);

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
    // does key already exist in this agent? double define in template!
    if (features.has(fName))
      throw Error(`feature '${fName}' already in template`);
    // save the FeaturePack object reference in agent.feature map
    const fpack = FEATURES.get(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    // this should return agent
    this.features.set(fName, fpack);
    return fpack.decorate(this);
  }
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

  // serialization
  serialize() {
    const obj = {
      name: this.name(),
      x: this.x(),
      y: this.y(),
      skin: this.skin()
    };
    // call serialize on all features
    // call serialize on all props
    return JSON.stringify(obj);
  }
} // end of Agent class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// attach as static methods
Agent.AddMethod = AddMethod; // forward from SM_Object
Agent.AddProp = AddProp; // forward from SM_Object
/// export main Agent
export default Agent;
/*/ use as
    import Agent from './class-agent'
    const { AddMethods, AddProp } = Agent
/*/
