/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

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
  /**
   *  hook into lifecycle methods
   */
  initialize(phaseMachine: any) {
    // do something
  }

  /**
   *  called by agent template function when creating new agent
   *  note: subclassers must override this method as necessary
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

  /**
   *  return name of this feature feature, used for adding a GSDictionary
   *  property by name to Agent.props
   */
  name(): string {
    return this.meta.feature;
  }

  /**
   *  return prop located in the agent
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  addProp(agent: IAgent, key: string, prop: IScopeable) {
    // agent.props = Map<string, IScopeable>;
    const dict = agent.props.get(this.name()) as DictionaryProp;
    dict.addItem(key, prop);
  }
  /**
   *  Return prop given the passed agent and key. This prop is stored
   *  in the agent's props map as a DictionaryProp, so this version
   *  of prop returns the contents of the DictionaryProp! */
  prop(agent: IAgent, key: string): IScopeable {
    const dict = agent.props.get(this.name()) as DictionaryProp;
    return dict.getItem(key);
  }
  /** return method or function for feature invocation
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  method(agent: IAgent, key: string, ...args: any): any {
    const m = this.methods.get(key);
    if (typeof m === 'function') return m(agent, ...args);
    if (Array.isArray(m)) return agent.exec_smc(m);
    throw Error(`${NOT_METHOD_ERR} ${typeof m}`);
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
