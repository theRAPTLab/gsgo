/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


  DEPRECATED
  The global agent is now accessible directly via script, so the Global
  SM_Feature is really no longer necessary.
  e.g. `prop global.sparkCounter add 1`
  See: https://gitlab.com/stepsys/gem-step/gsgo/-/wikis/Scripting/Global


  Global is a special-case feature that is accessible to ALL agents in
  the simulation

  This can be used by scripts to add and update global variables.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Feature from 'lib/class-sm-feature';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Agent from 'lib/class-sm-agent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const PR = UR.PrefixUtil('GLOBALPROP');
const DBG = true;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GlobalPack extends SM_Feature {
  constructor(name) {
    super(name);
    this.featAddMethod('addGlobalProp', this.addGlobalProp);
    this.featAddMethod('globalProp', this.globalProp);
    this.featAddMethod('getGlobalProp', this.getGlobalProp);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // /** This runs once to initialize the feature for all agents */
  // initialize(simloop) {
  //   super.initialize(simloop);
  //   simloop.hook('INPUT', frame => console.log(frame));
  // }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// GLOBAL AGENT
  addGlobalProp(agent: IAgent, pName: string, type: string, value: any) {
    const global = SM_Agent.GetGlobalAgent();
    let gvar;
    if (type === 'String') gvar = new SM_String();
    if (type === 'Number') gvar = new SM_Number();
    if (type === 'Boolean') gvar = new SM_Boolean();
    global.addProp(pName, gvar);
    global.prop[pName].setTo(value);
  }

  globalProp(agent: IAgent, pName: string, method: string, value: any) {
    const global = SM_Agent.GetGlobalAgent();
    global.prop[pName][method](value);
    if (DBG)
      console.log(...PR('globalProp', pName, method, global.prop[pName].value));
  }

  getGlobalProp(agent: IAgent, pName: string) {
    const global = SM_Agent.GetGlobalAgent();
    return global.prop[pName];
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(GlobalPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return GlobalPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {},
    methods: {
      // REVIEW TODO: 'value' is :any...is it a GVAR?
      'addGlobalProp': { args: ['pName:string', 'type:string', 'value:gvar'] },
      // REVIEW TODO: 'value' is :any...is it a GVAR?
      'globalProp': { args: ['pName:string', 'method:string', 'value:gvar'] },
      'getGlobalProp': { args: ['pName:string'] }
    }
  };
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new GlobalPack('Global');
RegisterFeature(INSTANCE);
