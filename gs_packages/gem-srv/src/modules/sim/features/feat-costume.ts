/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!




\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { NumberProp, StringProp } from 'modules/sim/props/var';
import Feature from 'lib/class-feature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CostumePack extends Feature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('setCostume', this.setCostume);
    this.featAddMethod('pose', this.setPose);
    this.featAddMethod('test', this.test);
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
    this.featAddProp(agent, 'currentPose', new StringProp('default'));
    this.featAddProp(agent, 'currentFrame', new NumberProp(0));
    this.featAddProp(agent, 'costumeName', new StringProp('default'));
  }

  /// COSTUME METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featureCall Costume setCostume value
   */
  setCostume(agent: IAgent, costumeName: string, poseName?: string) {
    agent.featProp(this.name, 'costumeName').value = costumeName;
  }
  setPose(agent: IAgent, poseName: string) {
    agent.featProp(this.name, 'poseName').value = poseName;
  }
  test(agent: IAgent) {
    console.log('GOT AGENT', agent.name, 'from FEATURE', this.name);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CostumePack('Costume');
Register(INSTANCE);
