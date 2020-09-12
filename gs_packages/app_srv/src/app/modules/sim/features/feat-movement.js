/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Feature from './class-feature';
import { StringProp } from '../props/var';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.Prompt('MovementFeature');
console.log(...PR('module parse'));

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MovementPack extends Feature {
  constructor(name) {
    super(name);
    console.log(...PR('construct'));
    // super.meta
    // super.methods
    // super.decorate(agent)
    // super.prop()
    // super.method()
  }

  initialize(pm) {
    super.initalize(pm);
    pm.Hook('INPUT', this.HandleInput);
  }

  decorate(agent) {
    super.decorate(agent);
    this.addProp(agent, 'controller', new StringProp());
  }

  setController(agent, x) {
    console.log(`setting control to ${x}`);
    this.prop(agent, 'controller').value = x;
  }
}

/// EXPORT SINGLETON //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack('Movement');
export default INSTANCE;
