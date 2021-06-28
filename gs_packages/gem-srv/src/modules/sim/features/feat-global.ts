/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Global is a special-case feature that is accessible to ALL agents in
  the simulation

  This can be used by scripts to add and update global variables.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
import { IAgent } from 'lib/t-script';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import { GetGlobalAgent } from 'lib/class-gagent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// GLOBAL AGENT

  addGlobalProp(agent: IAgent, pName: string, type: string, value: any) {
    const global = GetGlobalAgent();
    console.log('global', global);
    let gvar;
    if (type === 'String') gvar = new GVarString();
    if (type === 'Number') gvar = new GVarNumber();
    if (type === 'Boolean') gvar = new GVarBoolean();
    global.addProp(pName, gvar);
    global.prop[pName].setTo(value);
    // console.error('global', global.prop[pName].value);
  }

  globalProp(agent: IAgent, pName: string, method: string, value: any) {
    const global = GetGlobalAgent();
    global.prop[pName][method](value);
    // console.error('global', pName, method, global.prop[pName].value);
  }

  getGlobalProp(agent: IAgent, pName: string) {
    const global = GetGlobalAgent();
    return global.prop[pName];
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new GlobalPack('Global');
Register(INSTANCE);
