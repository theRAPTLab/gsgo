/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  T_Feature,
  T_Method,
  T_Agent,
  T_Scopeable,
  T_Stackable
} from '../types/t-smc';
import { DictionaryProp } from '../props/var';

const NOT_METHOD_ERR = 'retrieved method is not a method; got';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation.
 */
class Feature implements T_Feature {
  meta: { feature: string };
  methods: Map<string, T_Method>;
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
   *  return name of this feature feature, used for adding a GSDictionary
   *  property by name to Agent.props
   */
  name(): string {
    return this.meta.feature;
  }

  /**
   *  called by agent template function when creating new agent
   *  note: subclassers must override this method as necessary
   */
  decorate(agent: T_Agent) {
    console.log(`class feature '${this.name()}' decorate '${agent.name()}'`);
    if (agent.features.has(this.name()))
      console.log(`agent decorate '${agent.name()}'`);
    else throw Error(`decorate: agent already bound to feature ${this.name()}`);

    if (!agent.props.has(this.name()))
      agent.props.set(this.name(), new DictionaryProp(this.name()));
    else throw Error(`decorate: agent already has props.${this.name}`);
  }

  /**
   *  return prop located in the agent
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  addProp(agent: T_Agent, key: string, prop: T_Scopeable) {
    // agent.props = Map<string, T_Scopeable>;
    const dict = agent.props.get(this.name()) as DictionaryProp;
    dict.addItem(key, prop);
  }
  prop(agent: T_Agent, key: string): T_Scopeable {
    const dict = agent.props.get(this.name()) as DictionaryProp;
    return dict.getItem(key);
  }
  /** return method or function for feature invocation
   *  remember: there is a single instance of all methods for the feature
   *  note: this is a mirror implementation of SM_Object.prop
   */
  method(agent: T_Agent, key: string, ...args: any): any {
    const method = this.methods.get(key);
    if (typeof method === 'function') return method(agent, ...args);
    if (Array.isArray(method)) return agent.exec_smc(method);
    throw Error(`${NOT_METHOD_ERR} ${typeof method}`);
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
