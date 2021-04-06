/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import { GetTextureInfo } from 'modules/datacore/dc-globals';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;
let COUNTER = 0;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CostumePack extends GFeature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('setCostume', this.setCostume);
    this.featAddMethod('setPose', this.setPose);
    this.featAddMethod('setScale', this.setScale);
    this.featAddMethod('test', this.test);
    this.featAddMethod('thinkHook', agent => {
      const prop = agent.prop.Costume.counter;
      prop.add(1);
      if (prop.value === 0) console.log(`${agent.name} is CostumeThinking`);
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  initialize(simloop) {
    super.initialize(simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add costume-specific properties to the agent. The feature methods
   *  are defined inside the featurepack instance, not the agent instance
   *  as props are.
   */
  decorate(agent) {
    super.decorate(agent);
    // add feature props here
    let prop = new GVarNumber(0);
    // initialize a counter in the agent
    // it will be checked during 'thinkHook' when it's invoked via a
    // featureHook keyword
    prop.setMax(120);
    prop.setMin(0);
    prop.setWrap();
    this.featAddProp(agent, 'counter', prop); // used by thinkhook example above
    this.featAddProp(agent, 'costumeName', new GVarString('default'));
    prop = new GVarNumber(0);
    prop.setWrap();
    prop.setMin(0);
    prop.setMax(0);
    this.featAddProp(agent, 'currentFrame', prop);
  }

  /// COSTUME METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featureCall Costume setCostume value
   */
  setCostume(agent: IAgent, costumeName: string, poseName: string | Number) {
    agent.getFeatProp(this.name, 'costumeName').value = costumeName;
    const { frameCount } = GetTextureInfo(costumeName);
    if (poseName !== undefined) {
      const cf = agent.getFeatProp(this.name, 'currentFrame') as GVarNumber;
      cf.value = poseName;
      cf.setMax(frameCount - 1);
    }
    agent.getProp('skin').value = costumeName;
  }
  setPose(agent: IAgent, poseName: string | number) {
    agent.getFeatProp(this.name, 'currentFrame').value = poseName;
  }
  setScale(agent: IAgent, scale: number) {
    // Use `setTo` so that min an max are checked
    agent.getProp('scale').setTo(scale); // use the minmaxed number
  }
  test(agent: IAgent) {
    console.log('GOT AGENT', agent.name, 'from FEATURE', this.name);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CostumePack('Costume');
Register(INSTANCE);
