import UR from '@gemstep/ursys/client';
import Feature from './class-feature';

const { makeLogHelper } = UR.util.PROMPTS;
const PR = makeLogHelper('TimerFeature');

class MovementPack extends Feature {
  constructor(name) {
    super(name);
    console.log(...PR(`feature init: ${name}`));
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

  setController(x) {
    console.log(`setting control to ${x}`);
  }
}
const INSTANCE = new MovementPack('Movement');

export default INSTANCE;
