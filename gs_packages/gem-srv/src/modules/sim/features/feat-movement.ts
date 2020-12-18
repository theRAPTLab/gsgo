/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { StringProp } from 'modules/sim/props/var';
import Feature from 'lib/class-feature';
import { Register } from 'modules/datacore/dc-features';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MovementPack extends Feature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
    // super.decorate(agent)
    // super.prop(agent, key)
    // super.method(agent, key, ...args)
    this.handleInput = this.handleInput.bind(this);
    this.featAddMethod('jitterPos', this.jitterPos);
    this.featAddMethod('setController', this.setController);
  }

  /** This runs once to initialize the feature for all agents */
  initialize(pm) {
    super.initialize(pm);
    pm.hook('INPUT', this.handleInput);
  }

  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'controller', new StringProp());
  }

  handleInput() {
    // hook into INPUT phase and do what needs doing for
    // the feature as a whole
  }

  setController(agent, x) {
    if (DBG) console.log(...PR(`setting control to ${x}`));
    agent.prop('controller').value = x;
  }

  jitterPos(agent, min: number = -5, max: number = 5, round: boolean = true) {
    const x = m_Random(min, max, round);
    const y = m_Random(min, max, round);
    agent.prop.x.value += x;
    agent.prop.y.value += y;
  }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Random(min, max, round) {
  const n = Math.random() * (max - min) + min;
  if (round) return Math.round(n);
  return n;
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack('Movement');
Register(INSTANCE);
