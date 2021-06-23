/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import * as PIXI from 'pixi.js';
import UR from '@gemstep/ursys/client';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import { GetSpriteDimensions, GetTextureInfo } from 'modules/datacore/dc-globals';
import { Clamp } from 'lib/util-vector';
import {
  HSVfromRGB,
  RGBfromHSV,
  HSVfromHEX,
  NormalizedRGBfromHSV
} from 'lib/util-color';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatCostume');
const DBG = false;
let COUNTER = 0;

/// HELPERS ///////////////////////////////////////////////////////////////////

/// Keep between 0 and 1
function m_RGBMinMax(val) {
  return Clamp(val, 0, 1);
}
function m_Clamp1(val) {
  return Clamp(val, 0, 1);
}
function m_Clamp255(val) {
  return Clamp(val, 0, 255);
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
    this.featAddMethod('setColorizeHSV', this.setColorizeHSV);
    this.featAddMethod('randomizeColor', this.randomizeColor);
    this.featAddMethod('randomizeColorHSV', this.randomizeColorHSV);
    this.featAddMethod('colorHSVWithinRange', this.colorHSVWithinRange);
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
    // NOTE setting `flip` will not change the costume if Physics
    // is not being used.  This merely sets a flag.
    // If only Costume is being used, you need do a direct Costume.setScale
    // to trigger the flip.  We wanted to keep `flip` property
    // that could be easily set rather than a method.
    // REVIEW: Implement FEATURES_UPDATE phase processing for Costume
    //         to enable applicaiton of flip?
    this.featAddProp(agent, 'flipX', new GVarBoolean(false));
    this.featAddProp(agent, 'flipY', new GVarBoolean(false));
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
   * This sets the agent scale property directly, but costume does
   * not otherwise process scale.
   */
  // REVIEW: Is this method necessary?
  setScale(agent: IAgent, scale: number) {
    // Use `setTo` so that min an max are checked
    const newScale = agent.prop.Costume.flipX.value ? -scale : scale;
    agent.getProp('scale').setTo(newScale); // use the minmaxed number
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
  // Applies a colorOverlay and adjustmentFilter color multiply
  setColorizeHSV(agent: IAgent, hue: number, sat: number, val: number) {
    const rgb255 = RGBfromHSV(hue, sat, val);
    const color = PIXI.utils.rgb2hex([
      rgb255[0] / 255,
      rgb255[1] / 255,
      rgb255[2] / 255
    ]);
    agent.getProp('color').setTo(color);
  }
  // Randomizes the existing color
  // `dRed`, `dGreen`, and `dBlue` are the max change values
  // They are essentially +/-, e.g. if dRed is 0.2, then the random value
  // will change the existing value by +/- 0.2.
  randomizeColor(agent: IAgent, dRed: number, dGreen: number, dBlue: number) {
    const color = agent.getProp('color').value; // color is hex
    const [r, g, b] = PIXI.utils.hex2rgb(color); // rgb is normalized 0-1
    const newR = m_RGBMinMax(r + RNG() * 2 * dRed - dRed);
    const newG = m_RGBMinMax(g + RNG() * 2 * dGreen - dGreen);
    const newB = m_RGBMinMax(b + RNG() * 2 * dBlue - dBlue);
    if (DBG) console.log('randomized new color', newR, newG, newB);
    this.setColorize(agent, newR, newG, newB);
  }
  // Randomizes the existing color using HSL (Hue, Saturation, Lightness)
  // `dRed`, `dGreen`, and `dBlue` are the max change values
  // They are essentially +/-, e.g. if dRed is 0.2, then the random value
  // will change the existing value by +/- 0.2.
  randomizeColorHSV(agent: IAgent, dHue: number, dSat: number, dVal: number) {
    const color = agent.getProp('color').value; // color is hex
    const [h, s, v] = HSVfromHEX(color);
    const newH = m_Clamp1(h + RNG() * 2 * dHue - dHue);
    const newS = m_Clamp1(s + RNG() * 2 * dSat - dSat);
    const newV = m_Clamp1(v + RNG() * 2 * dVal - dVal);
    const [r, g, b] = NormalizedRGBfromHSV(newH, newS, newV);
    this.setColorize(agent, r, g, b);
  }
  colorHSVWithinRange(
    agent: IAgent,
    col1: number,
    col2: number,
    dHue: number,
    dSat: number,
    dVal: number
  ) {
    const [c1h, c1s, c1v] = HSVfromHEX(col1);
    const [c2h, c2s, c2v] = HSVfromHEX(col2);
    const res =
      Math.abs(c1h - c2h) <= dHue &&
      Math.abs(c1s - c2s) <= dSat &&
      Math.abs(c1v - c2v) <= dVal;
    // console.log(
    //   'reviewing',
    //   col1,
    //   col2,
    //   dHue,
    //   dSat,
    //   dVal,
    //   HSVfromHEX(col1),
    //   HSVfromHEX(col2),
    //   res
    // );

    return res;
  }
  // Removes the color overlay, reverting the sprite back to it's original colors
  resetColorize(agent: IAgent) {
    agent.getProp('color').clear();
  }
  // Dimensions of currently selected sprite frame's texture
  getBounds(agent: IAgent): { w: number; h: number } {
    const costumeName = agent.getProp('skin').value;
    const frame = agent.getFeatProp('Costume', 'currentFrame').value || 0;
    const { w, h } = GetSpriteDimensions(costumeName, frame);
    return { w, h };
  }
  getScaledBounds(agent: IAgent): { w: number; h: number } {
    const { w, h } = this.getBounds(agent);
    const scale = agent.scale;
    const scaleY = agent.scaleY || scale;
    return { w: scale * w, h: scaleY * h };
  }
  test(agent: IAgent) {
    console.log('GOT AGENT', agent.name, 'from FEATURE', this.name);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CostumePack('Costume');
Register(INSTANCE);
