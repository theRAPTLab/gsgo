/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import * as PIXI from 'pixi.js';
import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import { GetSpriteDimensions, GetTextureInfo } from 'modules/datacore/dc-globals';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatCostume');
const DBG = false;
let COUNTER = 0;

/// HELPERS ///////////////////////////////////////////////////////////////////

/// Keep between 0 and 1
function m_RGBMinMax(val) {
  return Math.min(1, Math.max(0, val));
}

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
    this.featAddMethod('setGlow', this.setGlow);
    this.featAddMethod('setColorize', this.setColorize);
    this.featAddMethod('randomizeColor', this.randomizeColor);
    this.featAddMethod('resetColorize', this.resetColorize);
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
  /**
   * If Physics are being used, it's better to use Physics' setSize()
   * @param agent
   * @param scale
   */
  setScale(agent: IAgent, scale: number) {
    // Use `setTo` so that min an max are checked
    agent.getProp('scale').setTo(scale); // use the minmaxed number
  }
  setGlow(agent: IAgent, seconds: number) {
    agent.isGlowing = true;
    setTimeout(() => {
      agent.isGlowing = false;
    }, seconds * 1000);
  }
  // Applies a colorOverlay and adjustmentFilter color multiply
  setColorize(agent: IAgent, red: number, green: number, blue: number) {
    const color = PIXI.utils.rgb2hex([red, green, blue]);
    agent.getProp('color').setTo(color);
  }
  // Randomizes the existing color
  // `dRed`, `dGreen`, and `dBlue` are the max change values
  // They are essentially +/-, e.g. if dRed is 0.2, then the random value
  // will change the existing value by +/- 0.2.
  randomizeColor(agent: IAgent, dRed: number, dGreen: number, dBlue: number) {
    const color = agent.getProp('color').value;
    const [r, g, b] = PIXI.utils.hex2rgb(color);
    const newR = m_RGBMinMax(r + RNG() * 2 * dRed - dRed);
    const newG = m_RGBMinMax(g + RNG() * 2 * dGreen - dGreen);
    const newB = m_RGBMinMax(b + RNG() * 2 * dBlue - dBlue);
    if (DBG) console.log('randomized new color', newR, newG, newB);
    this.setColorize(agent, newR, newG, newB);
  }
  // Removes the color overlay, reverting the sprite back to it's original colors
  resetColorize(agent: IAgent) {
    agent.getProp('color').setTo(-1);
  }
  // Dimensions of currently selected sprite frame's texture
  getBounds(agent: IAgent): { w: number; h: number } {
    const costumeName = agent.getProp('skin').value;
    const frame = agent.getFeatProp('Costume', 'currentFrame').value || 0;
    const { w, h } = GetSpriteDimensions(costumeName, frame);
    return { w, h };
  }
  test(agent: IAgent) {
    console.log('GOT AGENT', agent.name, 'from FEATURE', this.name);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CostumePack('Costume');
Register(INSTANCE);
