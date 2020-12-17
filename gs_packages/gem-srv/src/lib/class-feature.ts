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

import {
  IKeyObject,
  IFeature,
  TMethod,
  IAgent,
  IScopeable,
  TStackable
} from 'lib/t-script';
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
  method: IKeyObject;
  //
  constructor(name: string) {
    this.meta = {
      feature: name
    };
    this.method = {};
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
  get name() {
    return this.meta.feature;
  }
  /** called during blueprint instantiation of an agent.
   *  used to add properties specific to the feature.
   *  note: subclassers call super.decorate(agent) to ensure that
   *  the properties are initialized in the agent's prop map
   */
  decorate(agent: IAgent) {
    if (DBG) console.log(`class feature '${this.name}' decorate '${agent.name}'`);
    if (agent.featureMap.has(this.name)) {
      if (DBG) console.log(`decorate(): '${agent.name}' w/  ${this.name}`);
    } else {
      console.warn(`decorate(): ${agent.name} no featureMap key:${this.name}`);
      return;
    }

    if (!agent.prop[this.name]) agent.prop[this.name] = {};
    // prop.FeatureName props go here
    else throw Error(`decorate: agent already has props.${this.name} object`);
  }

  /** Add property stored in an agent instance, used by decorate().
   *  This is a mirror implementation of SM_Object.prop, modified
   *  to store props in agent.prop.FeatureName
   */
  featAddProp(agent: IAgent, pKey: string, prop: IScopeable) {
    // agent.props = Map<string, IScopeable>;
    let dict = agent.prop[this.name];
    if (!dict) {
      dict = {};
      agent.prop[this.name] = {};
    }
    dict[pKey] = prop;
  }
  /** Return prop given the passed agent and key. This prop is stored
   *  in the agent's props map as a DictionaryProp, so this version
   *  of prop returns the contents of the DictionaryProp!
   */
  featGetProp(agent: IAgent, pKey: string): IScopeable {
    const dict = agent.prop[this.name] as DictionaryProp;
    return dict.getItem(pKey);
  }
  /** Define a method to this feature instance. Note that there is only one
   *  instance of a Feature at a time, so the code for instance methods
   *  exist in only one place, and require that an agent instance is
   *  passed to it. This is a mirror of SM_Object.addMethod, modified
   *  to use the local method map
   */
  addMethod(mKey: string, smc_or_f: TMethod) {
    const { method } = this;
    if (method[mKey])
      throw Error(`method '${mKey}' already in Feature.${this.name}`);
    method[mKey] = smc_or_f;
  }
  /** invoke method or function stored in feature's method map.
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.method
   */
  featExec(agent: IAgent, mKey: string, ...args: any): any {
    const smc_or_f = this.method[mKey];
    if (!smc_or_f)
      throw Error(`method '${mKey}' doesn't exist in Feature.${this.name}`);
    return agent.exec(smc_or_f, ...args);
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
