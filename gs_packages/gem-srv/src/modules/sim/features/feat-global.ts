/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Global is a special-case feature that is accessible to ALL agents in
  the simulation

  This can be used by scripts to add and update global variables.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { RegisterFeature } from 'modules/datacore/dc-sim-resources';
import { IAgent, TSymbolData } from 'lib/t-script';
import { GVarBoolean, GVarNumber, GVarString } from 'script/vars/_all_vars';
import { GetGlobalAgent } from 'lib/class-gagent';

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
    const global = GetGlobalAgent();
    let gvar;
    if (type === 'String') gvar = new GVarString();
    if (type === 'Number') gvar = new GVarNumber();
    if (type === 'Boolean') gvar = new GVarBoolean();
    global.addProp(pName, gvar);
    global.prop[pName].setTo(value);
  }

  globalProp(agent: IAgent, pName: string, method: string, value: any) {
    const global = GetGlobalAgent();
    global.prop[pName][method](value);
    if (DBG)
      console.log(...PR('globalProp', pName, method, global.prop[pName].value));
  }

  getGlobalProp(agent: IAgent, pName: string) {
    const global = GetGlobalAgent();
    return global.prop[pName];
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new GlobalPack('Global');
RegisterFeature(INSTANCE);
