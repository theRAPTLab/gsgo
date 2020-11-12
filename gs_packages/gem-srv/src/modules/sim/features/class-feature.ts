/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features. It is "Scopeable" in that it understands SMObject
  semantics, but isn't an SMObject itself as it is used to reference
  a collection of code routines that operate ON agents, not decorate
  agents with code routines

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IFeature, TMethod, IAgent, IScopeable, TStackable } from 'lib/t-smc';
import { DictionaryProp } from 'modules/sim/props/var';

/// CONSTANTS & DECLARATIONS  /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOT_METHOD_ERR = 'retrieved method is not a method; got';
const DBG = false;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation.
 */
class Feature implements IFeature {
  meta: { feature: string };
  methods: Map<string, TMethod>;
  //
  constructor(name: string) {
    this.meta = {
      feature: name
    };
    this.methods = new Map();
    // features only store methods!!!
    // because features are not instance per agent, but instead
    // are code libraries. agents provide memory context and props
  }
  /** hook into lifecycle methods
   *  a phasemachine instance is passed to initialize if the feature
   *  needs to access any part of the hook. In general, the pm is
   *  SIM, defined in api-sim.js
   */
  initialize(phaseMachine: object) {
    // do something
  }
  /** called during blueprint instantiation of an agent.
   *  used to add properties specific to the feature.
   *  note: subclassers call super.decorate(agent) to ensure that
   *  the properties are initialized in the agent's prop map
   */
  decorate(agent: IAgent) {
    if (DBG)
      console.log(`class feature '${this.name()}' decorate '${agent.name()}'`);
    if (agent.features.has(this.name())) {
      if (DBG) console.log(`agent decorate '${agent.name()}'`);
    } else throw Error(`decorate: agent already bound to feature ${this.name()}`);

    if (!agent.props.has(this.name()))
      agent.props.set(this.name(), new DictionaryProp(this.name()));
    else throw Error(`decorate: agent already has props.${this.name}`);
  }

  /** return name of this feature feature, used for adding a GSDictionary
   *  property by name to Agent.props
   */
  name(): string {
    return this.meta.feature;
  }

  /** Add property stored in an agent instance, used by decorate().
   *  This is a mirror implementation of SM_Object.prop, modified
   *  to store props in a DictionaryProp stored in the agent prop
   */
  addProp(agent: IAgent, key: string, prop: IScopeable) {
    // agent.props = Map<string, IScopeable>;
    const dict = agent.props.get(this.name()) as DictionaryProp;
    dict.addItem(key, prop);
  }
  /** Return prop given the passed agent and key. This prop is stored
   *  in the agent's props map as a DictionaryProp, so this version
   *  of prop returns the contents of the DictionaryProp!
   */
  prop(agent: IAgent, key: string): IScopeable {
    console.log('feature', agent);
    const dict = agent.props.get(this.name()) as DictionaryProp;
    return dict.getItem(key);
  }
  /** Define a method to this feature instance. Note that there is only one
   *  instance of a Feature at a time, so the code for instance methods
   *  exist in only one place, and require that an agent instance is
   *  passed to it. This is a mirror of SM_Object.addMethod, modified
   *  to use the local method map
   */
  defineMethod(name: string, smc_or_f: TMethod) {
    const { methods } = this;
    if (methods.has(name)) throw Error(`method '${name}' already added`);
    methods.set(name, smc_or_f);
  }
  /** invoke method or function stored in feature's method map.
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.method
   */
  method(agent: IAgent, key: string, ...args: any): any {
    const smc_or_f = this.methods.get(key);
    return agent.exec(smc_or_f, ...args);
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
