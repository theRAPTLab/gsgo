/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own high-performance features in Javascript that are too difficult
  for a student or teacher to write on their own. Technically, an SM_Feature
  is a collection of named Javascript functions that can be invoked
  using the keyword 'objref method' pattern:

    call Costume setCostume 'banana.json'

  BOILERPLATE:

    import SM_Feature from 'lib/class-gfeature';
    import { IAgent } from 'lib/t-script'
    import { RegisterFeature } from 'modules/datacore/dc-sim-data';

    class FeaturePack extends SM_Feature {
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
        // e.g. this.featAddProp(agent,'propName',new SM_String('default'));
      }
      ...
      add feature methods from constructor definitions
      ...
    }

  TO REGISTER FEATURE INSTANCE:

    RegisterFeature(new FeaturePack('FeatureName');

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS  /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** SM_Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation. */
class SM_Feature implements IFeature {
  meta: { name: string };
  method: SM_Dict;

  /// SETUP ///////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(name: string) {
    this.meta = { name };
    this.method = {};
    // features only store methods!!! props are stored in the agent
    // props object as a property named after the feature.
  }

  /** hook into lifecycle methods
   *  a phasemachine instance is passed to initialize if the feature
   *  needs to access any part of the hook. In general, the pm is
   *  SIM, defined in api-sim.js */
  initialize(phaseMachine: any) {
    // do something
  }

  /** so can use feature.name */
  get name() {
    return this.meta.name;
  }

  /// AGENT INITIALIZATION ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** called during blueprint instantiation of an agent. used to add properties
   *  specific to the feature. note: subclassers call super.decorate(agent) to
   *  ensure that the properties are initialized in the agent's prop map */
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

  /// FEATURE API /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add property stored in an agent instance, used by decorate(). This is a
   *  mirror implementation of SM_Object.prop, modified to store props in
   *  agent.prop.FeatureName */
  featAddProp(agent: IAgent, pName: string, prop: ISM_Object) {
    // note: agent.props = Map<string, ISM_Object>;
    let dict = agent.prop[this.name];
    if (!dict) {
      dict = {};
      agent.prop[this.name] = {};
    }
    dict[pName] = prop;
  }

  /** Define a method to this feature instance */
  featAddMethod(mName: string, func: TSM_FeatureMethod) {
    const { method } = this;
    if (method[mName]) {
      console.warn('method', method, mName);
      throw Error(`method '${mName}' already in SM_Feature.${this.name}`);
    }
    method[mName] = func;
  }

  /** retrieve a defined method for shenanigans outside the agent context */
  featGetMethod(mName: string): TSM_FeatureMethod {
    const { method } = this;
    return method[mName];
  }

  /// SM_OBJECT COMPATIBILITY API /////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Alias getGetMethod for SM_Object interface */
  getMethod(mName: string): TSM_FeatureMethod {
    return this.featGetMethod(mName);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override to reset data on sim reset */
  reset() {}
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** provide instance version of Symbolize static method for compat */
  symbolize() {
    return SM_Feature.Symbolize();
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to write a 'name' property into any methods dictionary as a copy
   *  of its key, so we don't have to define the same data it twice (once as a
   *  key, once as a name */
  static _SymbolizeNames(symbols: TSymbolData): TSymbolData {
    const fn = 'SMFeature.SymbolizeNames:';
    const { methods } = symbols || {};
    if (methods === undefined) return;
    Object.keys(methods).forEach(methodKey => {
      if (methods[methodKey].name === undefined) {
        methods[methodKey].name = methodKey;
        if (DBG)
          console.log(
            `${fn} copying ${methodKey} into name:`,
            methods[methodKey]
          );
      }
    });
    return symbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(SM_Feature.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static symbol declarations */
  static Symbols: TSymbolData = {}; // symbol data
} // end of class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SM_Feature;
