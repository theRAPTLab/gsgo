/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import * as PIXI from 'pixi.js';
import UR from '@gemstep/ursys/client';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent, TSymbolData } from 'lib/t-script';
import { GetAgentById } from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';
import { GetLoader } from 'modules/asset_core/asset-mgr';
import { Clamp } from 'lib/util-vector';
import { HSVfromRGB, RGBfromHSV, HSVfromHEX, HEXfromHSV } from 'lib/util-color';
import * as ASSETS from 'modules/asset_core';

///
/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatCostume');
const DBG = false;
let COUNTER = 0;

const COSTUME_AGENTS = new Map();
const SPRITE = GetLoader('sprites');

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

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * PHYSICS_AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  if (!a) COSTUME_AGENTS.delete(agentId);
  return a;
}

/// UPDATES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Update(frame) {
  const agentIds = Array.from(COSTUME_AGENTS.keys());
  agentIds.forEach(id => {
    const agent = m_getAgent(id);
    if (!agent) return;
    let h;
    let s;
    let v;
    let color;

    // COLOR can be set two different ways: colorScale or HSV
    // NOTE: color scale will override any hsv settings
    if (agent.prop.Costume.colorScaleIndex.value !== undefined) {
      // retrieve color from color scale
      color = agent.prop.Costume._colorScale.get(
        agent.prop.Costume.colorScaleIndex.value
      );
      // set hsv
      [h, s, v] = HSVfromHEX(color);
      agent.prop.Costume.colorHue.setTo(h);
      agent.prop.Costume.colorSaturation.setTo(s);
      agent.prop.Costume.colorValue.setTo(v);
    }

    // convert feature color data to hex for agent
    h = agent.prop.Costume.colorHue.value;
    s = agent.prop.Costume.colorSaturation.value;
    v = agent.prop.Costume.colorValue.value;
    if (h !== undefined && s !== undefined && v !== undefined) {
      color = HEXfromHSV(h, s, v);
    }

    // always set color, esp if it's undefined (to clear filters)
    agent.prop.color.setTo(color);
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Runs only when sim is running (GLOOP)
function m_Animate(frame) {
  const SPRITES = ASSETS.GetLoader('sprites');
  const agentIds = Array.from(COSTUME_AGENTS.keys());
  agentIds.forEach(id => {
    const agent = m_getAgent(id);
    if (!agent) return;

    // Animation?
    if (agent.prop.Costume._animationBaseSkin) {
      // check framerate
      if (frame % agent.prop.Costume._animationFrameRate === 0) {
        agent.prop.Costume._animationFrame++;
        let skin = `${agent.prop.Costume._animationBaseSkin}${agent.prop.Costume._animationFrame}.${agent.prop.Costume._animationBaseSkinExt}`;
        if (DBG) console.log(...PR('looking up skin', skin));
        if (!SPRITES.hasAsset(skin)) {
          // Ran out of frame, reset to start
          agent.prop.Costume._animationFrame =
            agent.prop.Costume._animationStartFrame;
          skin = `${agent.prop.Costume._animationBaseSkin}${agent.prop.Costume._animationFrame}.${agent.prop.Costume._animationBaseSkinExt}`;
          if (DBG) console.log(...PR('....failed, reset to', skin));
        }
        agent.prop.skin.setTo(skin);
      }
    }
  });
}

/// HOOKS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// REVIEW: Use PHYSIC for now to set agent before VIS_UPDATE
UR.HookPhase('SIM/VIS_UPDATE', m_Update);
UR.HookPhase('SIM/FEATURES_EXEC', m_Animate);

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CostumePack extends GFeature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('setCostume', this.setCostume);
    this.featAddMethod('setPose', this.setPose);
    this.featAddMethod('setAnimatedCostume', this.setAnimatedCostume);
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
    // Costume color will override agent color during m_Update
    prop = new GVarNumber();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorHue', prop);
    prop = new GVarNumber();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorSaturation', prop);
    prop = new GVarNumber();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorValue', prop);
    prop = new GVarNumber();
    this.featAddProp(agent, 'colorScaleIndex', prop);
    prop = new GVarNumber(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleHue', prop);
    prop = new GVarNumber(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleSaturation', prop);
    prop = new GVarNumber(1);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleValue', prop);
    this.featAddProp(agent, 'colorScaleType', new GVarString('value'));
    prop = new GVarNumber(5);
    this.featAddProp(agent, 'colorScaleSteps', prop);

    COSTUME_AGENTS.set(agent.id, agent.id);

    // Private Variables
    agent.prop.Costume.colorHue.value = undefined;
    agent.prop.Costume.colorSaturation.value = undefined;
    agent.prop.Costume.colorValue.value = undefined;

    agent.prop.Costume._animationBaseSkin = undefined;
    agent.prop.Costume._animationBaseSkinExt = undefined;
    agent.prop.Costume._animationFrame = undefined;
    agent.prop.Costume._animationStartFrame = undefined;
    agent.prop.Costume._animationFrameRate = undefined;
  }

  symbolize(): TSymbolData {
    return {
      props: {
        counter: GVarNumber.Symbols,
        costumeName: GVarString.Symbols,
        currentFrame: GVarNumber.Symbols,
        flipX: GVarBoolean.Symbols,
        flipY: GVarBoolean.Symbols,
        colorHue: GVarNumber.Symbols,
        colorSaturation: GVarNumber.Symbols,
        colorValue: GVarNumber.Symbols,
        colorScaleIndex: GVarNumber.Symbols,
        colorScaleHue: GVarNumber.Symbols,
        colorScaleSaturation: GVarNumber.Symbols,
        colorScaleValue: GVarNumber.Symbols,
        colorScaleType: GVarString.Symbols,
        colorScaleSteps: GVarNumber.Symbols
      },
      methods: {
        setCostume: { args: ['costumeName:string', 'poseName:string'] },
        setPose: { args: ['poseName:string'] },
        setAnimatedCostume: { args: ['costumeName:string', 'frameRate:number'] },
        setScale: { args: ['scale:number'] },
        setGlow: { args: ['seconds:number'] },
        setColorize: { args: ['red:number', 'green:number', 'blue:number'] },
        setColorizeHSV: { args: ['hue:number', 'sat:number', 'val:number'] },
        randomizeColor: {
          args: ['dRed:number', 'dGreen:number', 'dBlue:number']
        },
        randomizeColorHSV: {
          args: ['dHue:number', 'dSat:number', 'dVal:number']
        },
        colorHSVWithinRange: {
          args: [
            'col1:number',
            'col2:number',
            'dHue:number',
            'dSat:number',
            'dVal:number'
          ]
        },
        resetColorize: {},
        test: {},
        thinkHook: {}
      }
    };
  }

  /// COSTUME METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featureCall Costume setCostume value
   */
  setCostume(agent: IAgent, costumeName: string, poseName?: string | Number) {
    // Clear animated costume if previously set so animated costume will not
    // replace the `setCostume` with the next animation update.
    agent.prop.Costume._animationBaseSkin = undefined;

    agent.getFeatProp(this.name, 'costumeName').value = costumeName;
    const { frameCount } = SPRITE.getTextureInfo(costumeName);
    if (poseName !== undefined) {
      const cf = agent.getFeatProp(this.name, 'currentFrame') as GVarNumber;
      cf.value = poseName;
      cf.setMax(frameCount - 1);
    }
    agent.getProp('skin').value = costumeName;

    // If Physics feature is used, update physics body.
    if (agent.hasFeature('Physics')) {
      agent.callFeatMethod('Physics', 'init');
    }
  }
  setPose(agent: IAgent, poseName: string | number) {
    agent.getFeatProp(this.name, 'currentFrame').value = poseName;
  }
  /**
   * Animate by stepping through costume name, not spritesheet
   * e.g. fly1.png, fly2.png, fly3.png
   * This is intended to make it easy for non-technical users to create animations
   * This supports an arbitrary number of frames.
   * Turn off animation by setting the framerate to 0.
   * The animation will cycle back to to the first frame specified in the costumeName,
   * e.g. if you call it with `fly2.png` then fly2 will be the first frame.
   */
  setAnimatedCostume(
    agent: IAgent,
    costumeName: string,
    frameRate: number = 0.3
  ) {
    const findEndNumbers = /(\w+?)([0-9]+)\.([A-z]+)$/;
    const result = findEndNumbers.exec(costumeName);
    if (!result || result.length < 3) {
      // eslint-disable-next-line no-alert
      alert(
        `AnimatedCostume should be an image file that ends with a number, e.g. 'bunny1.jpg'.  You entered '${costumeName}'`
      );
      return;
    }
    const baseSkin = result[1];
    const frame = result[2]; // numbers
    const ext = result[3];

    agent.prop.Costume._animationBaseSkin = baseSkin;
    agent.prop.Costume._animationBaseSkinExt = ext;
    agent.prop.Costume._animationFrame = frame;
    agent.prop.Costume._animationStartFrame = frame;
    agent.prop.Costume._animationFrameRate = 30 * frameRate; // frames per second
    const skin = `${baseSkin}${frame}.${ext}`;

    const SPRITES = ASSETS.GetLoader('sprites');
    if (!SPRITES.hasAsset(skin)) {
      // eslint-disable-next-line no-alert
      alert(`Costume ${skin} not found!`);
      return;
    }

    agent.prop.skin.setTo(skin);
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
    agent.prop.scale.setTo(newScale); // use the minmaxed number
  }
  setGlow(agent: IAgent, seconds: number) {
    if (seconds === 0) {
      agent.isGlowing = false;
      return;
    }
    agent.isGlowing = true;
    setTimeout(() => {
      agent.isGlowing = false;
    }, seconds * 1000);
  }
  getColorHSV(agent: IAgent) {
    return [
      agent.prop.Costume.colorHue.value,
      agent.prop.Costume.colorSaturation.value,
      agent.prop.Costume.colorValue.value
    ];
  }
  // Applies a colorOverlay and adjustmentFilter color multiply
  setColorize(agent: IAgent, red: number, green: number, blue: number) {
    const [h, s, v] = HSVfromRGB(red, green, blue);
    agent.prop.Costume.colorHue.setTo(h);
    agent.prop.Costume.colorSaturation.setTo(s);
    agent.prop.Costume.colorValue.setTo(v);
  }
  // Applies a colorOverlay and adjustmentFilter color multiply
  setColorizeHSV(agent: IAgent, hue: number, sat: number, val: number) {
    agent.prop.Costume.colorHue.setTo(hue);
    agent.prop.Costume.colorSaturation.setTo(sat);
    agent.prop.Costume.colorValue.setTo(val);
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
  // `dHue`, `dSat`, and `dVal` are the max change values
  // They are essentially +/-, e.g. if dHue is 0.2, then the random value
  // will change the existing value by +/- 0.2.
  // If the current HSV of the agent has not been defined, we default
  // to randomize everything.  (Otherwise, we end up with black if the
  // color had been previously reset.)
  randomizeColorHSV(agent: IAgent, dHue: number, dSat: number, dVal: number) {
    const [h = 0.5, s = 0.5, v = 0.5] = this.getColorHSV(agent);
    const newH = m_Clamp1(h + RNG() * 2 * dHue - dHue);
    const newS = m_Clamp1(s + RNG() * 2 * dSat - dSat);
    const newV = m_Clamp1(v + RNG() * 2 * dVal - dVal);
    this.setColorizeHSV(agent, newH, newS, newV);
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
    //   agent.id,
    //   'colorhSVWithinRange reviewing',
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
    agent.prop.color.clear();
    // clear other color settings
    agent.prop.Costume.colorScaleIndex.setTo(undefined);
    agent.prop.Costume.colorHue.setTo(undefined);
    agent.prop.Costume.colorSaturation.setTo(undefined);
    agent.prop.Costume.colorValue.setTo(undefined);
  }
  initHSVColorScale(
    agent: IAgent,
    hue: number,
    sat: number,
    val: number,
    type: string,
    steps: number
  ) {
    // featProp overrides
    if (hue === undefined) hue = agent.prop.Costume.colorScaleHue.value;
    if (sat === undefined) sat = agent.prop.Costume.colorScaleSaturation.value;
    if (val === undefined) val = agent.prop.Costume.colorScaleValue.value;
    if (type === undefined) type = agent.prop.Costume.colorScaleType.value;
    if (steps === undefined) steps = agent.prop.Costume.colorScaleSteps.value;

    agent.prop.Costume._colorScale = new Map();
    // index is 0-based
    const max = steps - 1;
    for (let i = 0; i <= max; i++) {
      let color;
      if (type === 'hue') color = HEXfromHSV(i / max, sat, val);
      if (type === 'saturation') color = HEXfromHSV(hue, i / max, val);
      if (type === 'value') color = HEXfromHSV(hue, sat, i / max);
      if (color === undefined)
        console.error('initHSVColorScale with bad "type".');
      agent.prop.Costume._colorScale.set(i, color);
    }
    agent.prop.Costume.colorScaleIndex.setMax(steps - 1);
    agent.prop.Costume.colorScaleIndex.setMin(0);
  }
  getHSVColorScaleColor(agent: IAgent, index: number) {
    if (agent.prop.Costume._colorScale)
      return agent.prop.Costume._colorScale.get(index);
    return 0; // black by default?
  }
  // Dimensions of currently selected sprite frame's texture
  getBounds(agent: IAgent): { w: number; h: number } {
    const costumeName = agent.getProp('skin').value;
    const frame = agent.getFeatProp('Costume', 'currentFrame').value || 0;
    const { w, h } = SPRITE.getSpriteDimensions(costumeName, frame);
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
