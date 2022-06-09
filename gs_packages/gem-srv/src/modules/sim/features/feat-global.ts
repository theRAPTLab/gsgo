/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


  DEPRECATED
  The global agent is now accessible directly via script, so the Global
  Feature is really no longer necessary.
  e.g. `prop global.sparkCounter add 1`
  See: https://gitlab.com/stepsys/gem-step/gsgo/-/wikis/Scripting/Global


  Global is a special-case feature that is accessible to ALL agents in
  the simulation

  This can be used by scripts to add and update global variables.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Agent from 'lib/class-sm-agent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const PR = UR.PrefixUtil('GLOBALPROP');
const DBG = true;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GlobalPack extends GFeature {
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  symbolize(): TSymbolData {
    return {
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
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new GlobalPack('Global');
RegisterFeature(INSTANCE);
