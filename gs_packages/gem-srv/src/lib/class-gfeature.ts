/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features. It is "Scopeable" in that it understands SMObject
  semantics, but isn't an SMObject itself as it is used to reference
  a collection of code routines that operate ON agents, not decorate
  agents with code routines

  BOILERPLATE

  import GFeature from 'lib/class-gfeature';
  import { IAgent } from 'lib/t-script'
  import { Register } from 'modules/datacore/dc-features';

  class FeaturePack extends GFeature {
    constructor(name:string) {
      super(name);
      // add feature methods here
      // e.g. this.featAddMethod('methodName',this.classMethod);
    }
    initialize(SIM:PhaseMachine) {
      // hook into sim lifecycle here if feature needs it
      // e.g. SIM.hook('INPUT',()=>{});
      // or import UR and use UR.HookPhase('SIM/INPUT',()=>{});
    }
    decorate(agent:IAgent) {
      super.decorate(agent);
      // add feature props here
      // e.g. this.featAddProp(agent,'propName',new GVarString('default'));
    }

    // ... add feature methods from constructor definitions ...

    // end of class
  }
  /// REGISTER FEATURE INSTANCE ///
  Register(new FeaturePack('FeatureName');

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  IKeyObject,
  IFeature,
  FeatureMethod,
  IAgent,
  IScopeable,
  TSymbolData,
  TStackable
} from 'lib/t-script';
import { GVarDictionary } from 'modules/sim/vars/_all_vars';

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
  static Symbols: TSymbolData; // symbol data
  //
  constructor(name: string) {
    this.meta = {
      feature: name
    };
    this.method = {};
    // features only store methods!!! props are stored in the agent
    // props object as a property named after the feature.
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
  featAddProp(agent: IAgent, pName: string, prop: IScopeable) {
    // note: agent.props = Map<string, IScopeable>;
    let dict = agent.prop[this.name];
    if (!dict) {
      dict = {};
      agent.prop[this.name] = {};
    }
    dict[pName] = prop;
  }
  /** Features do not have to store properties if they are for private use by
   *  the feature. Only use props if you expect students to script with them,
   *  as props can be inspected to see what their allowed values are. For speed,
   *  you can use this instead. Make sure it's named with _ though to tell them
   *  apart from student-scriptable vars
   */
  featAddVar(agent: IAgent, vName: string, literal: any) {
    // note: agent.props = Map<string, IScopeable>;
    if (!vName.startsWith('_')) throw Error('feature var name must start with _');
    let dict = agent.prop[this.name];
    if (!dict) {
      dict = {};
      agent.prop[this.name] = {};
    }
    dict[vName] = literal;
  }
  /** Define a method to this feature instance. Note that there is only one
   *  instance of a Feature at a time, so the code for instance methods
   *  exist in only one place, and require that an agent instance is
   *  passed to it. This is a mirror of SM_Object.addMethod, modified
   *  to use the local method map
   */
  featAddMethod(mName: string, smc_or_f: FeatureMethod) {
    const { method } = this;
    if (method[mName]) {
      console.warn('method', method, mName);
      throw Error(`method '${mName}' already in Feature.${this.name}`);
    }
    method[mName] = smc_or_f;
  }
  /** retrieve a defined method for shenanigans outside the agent context */
  featGetMethod(mName: string): FeatureMethod {
    const { method } = this;
    return method[mName];
  }
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Feature;
