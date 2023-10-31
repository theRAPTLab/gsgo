/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Costume Class!

  Setting the costume size will also set the default physics body dimensions.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import * as PIXI from 'pixi.js';
import UR from '@gemstep/ursys/client';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Feature from 'lib/class-sm-feature';
import { GetAgentById } from 'modules/datacore/dc-sim-agents';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import { GetLoader } from 'modules/asset_core/asset-mgr';
import { Clamp } from 'lib/util-vector';
import { HSVfromRGB, RGBfromHSV, HSVfromHEX, HEXfromHSV } from 'lib/util-color';
import * as ASSETS from 'modules/asset_core';
import { SIM_TICKS_PER_SEC } from 'modules/sim/api-sim';
import { DEFAULT_SPRITE } from 'modules/flags';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatCostume');
const DBG = false;

const THISFEAT = 'Costume';

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

/// Calculates the scale to set the agent visual to based on:
/// 1. the current sprite size
/// 2. any `size` the user has defined (in pixels)
/// 2. any `width/height` the user has defined
/// 3. any `scale/scaleY` the user has defined
function m_CalculateScale(agent: IAgent): { scale: number; scaleY: number } {
  //   if sprite size hasn't been set, set it
  if (!agent.prop.Costume._spriteWidth)
    agent.callFeatMethod(THISFEAT, '_getBounds');
  const sw = agent.prop.Costume._spriteWidth;
  const sh = agent.prop.Costume._spriteHeight;
  //   user defined `size` sets both width and height
  const size = agent.prop.Costume.size.value;
  let sizew; // retain aspect ratio when sizing
  let sizeh; // retain aspect ratio when sizing
  if (sw > sh) {
    sizew = size;
    sizeh = (sh / sw) * size;
  } else {
    sizew = (sw / sh) * size;
    sizeh = size;
  }
  //   user defined w/h is used to scale the original sprite
  //   and overrides size
  const uw = agent.prop.Costume.width.value;
  const uh = agent.prop.Costume.height.value;
  const spriteScale = uw ? uw / sw : size ? sizew / sw : 1;
  const spriteScaleY = uh ? uh / sh : size ? sizeh / sh : 1;
  //   user defined scale is applied on to of current scale
  const us = agent.prop.Costume.scale.value; // "u"ser
  const usY = agent.prop.Costume.scaleY.value;
  let newScale = us ? us * spriteScale : spriteScale;
  let newScaleY = usY ? usY * spriteScaleY : us ? us * spriteScaleY : spriteScale;
  //   flip
  newScale = agent.prop.Costume.flipX.value ? -newScale : newScale;
  newScaleY = agent.prop.Costume.flipY.value ? -newScaleY : newScaleY;

  //   if Physics is present, set physics private body values
  if (agent.prop.Physics) {
    const bw = sw * Math.abs(newScale); // "b"ody
    const bh = sh * Math.abs(newScaleY);
    agent.prop.Physics._bodyWidth = bw;
    agent.prop.Physics._bodyHeight = bh;
    agent.prop.Physics._bodyRadius = bw / 2;
  }
  return { scale: newScale, scaleY: newScaleY };
}
/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * PHYSICS_AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  // Also delete if agent has switched bp and no longer has the feature
  if (!a || !a.prop.Costume) COSTUME_AGENTS.delete(agentId);
  else return a;
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

    // Set COSTUME (skin + size)
    const costumeName =
      agent.prop.Costume.costumeName && agent.prop.Costume.costumeName.value;
    if (costumeName !== undefined) {
      // Clear animated costume if previously set so animated costume will not
      // replace the `setCostume` with the next animation update.
      agent.prop.Costume._animationBaseSkin = undefined;

      // Set agent skin
      // new costume?
      if (agent.prop.skin.value !== costumeName) {
        agent.prop.skin.setTo(costumeName);
        agent.prop.Costume._spriteWidth = undefined; // force bounds recalculation
      }

      // Set agent scale (size)
      const { scale, scaleY } = m_CalculateScale(agent);
      agent.scale = scale;
      agent.scaleY = scaleY;
    }

    // Set COLOR
    // COLOR can be set three different ways:
    // 1. colorScale or
    // 2. color
    // 3. HSV
    // We use HSV as the common denominator base color format,
    // and convert to HEX when we assign the agent.prop.color.
    // NOTE: color scale will override any color and hsv settings
    if (agent.prop.Costume.colorScaleIndex.value !== undefined) {
      // 1. colorScale -- retrieve color from color scale
      color = agent.prop.Costume._colorScale.get(
        agent.prop.Costume.colorScaleIndex.value
      );
      // set hsv
      [h, s, v] = HSVfromHEX(color);
      agent.prop.Costume.colorHue.setTo(h);
      agent.prop.Costume.colorSaturation.setTo(s);
      agent.prop.Costume.colorValue.setTo(v);
    } else if (agent.prop.Costume.color.value !== undefined) {
      // 2. color hex
      [h, s, v] = HSVfromHEX(agent.prop.Costume.color.value);
      agent.prop.Costume.colorHue.setTo(h);
      agent.prop.Costume.colorSaturation.setTo(s);
      agent.prop.Costume.colorValue.setTo(v);
    }
    // 3. hsv -- convert feature color data to hex for agent
    h = agent.prop.Costume.colorHue.value;
    s = agent.prop.Costume.colorSaturation.value;
    v = agent.prop.Costume.colorValue.value;
    if (h !== undefined && s !== undefined && v !== undefined) {
      color = HEXfromHSV(h, s, v);
    }
    //   always set color, esp if it's undefined (to clear filters)
    agent.prop.color.setTo(color);

    // Set GLOW
    if (agent.prop.Costume.glow.value > 0) {
      agent.prop.Costume.glow.sub(1 / SIM_TICKS_PER_SEC); // frame rate
      agent.isGlowing = true;
    } else {
      agent.isGlowing = false;
    }
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
class CostumePack extends SM_Feature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('setAnimatedCostume', this.setAnimatedCostume);
    this.featAddMethod('setColorize', this.setColorize);
    this.featAddMethod('setColorizeHSV', this.setColorizeHSV);
    this.featAddMethod('randomizeColor', this.randomizeColor);
    this.featAddMethod('randomizeColorHSV', this.randomizeColorHSV);
    this.featAddMethod('colorHSVWithinRange', this.colorHSVWithinRange);
    this.featAddMethod('resetColorize', this.resetColorize);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  initialize(simloop) {
    super.initialize(simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    COSTUME_AGENTS.clear();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add costume-specific properties to the agent. The feature methods
   *  are defined inside the featurepack instance, not the agent instance
   *  as props are.
   */
  decorate(agent) {
    super.decorate(agent);
    // add feature props here
    let prop = new SM_Number(0);
    this.featAddProp(agent, 'costumeName', new SM_String(DEFAULT_SPRITE));
    prop = new SM_Number(0);
    prop.setWrap();
    prop.setMin(0);
    prop.setMax(0);
    this.featAddProp(agent, 'currentFrame', prop);
    // User-defined size -- single dimension shortcut for width/height
    prop = new SM_Number();
    this.featAddProp(agent, 'size', prop);
    // User-defined width/height -- will be applied to agent.scale on update
    prop = new SM_Number();
    this.featAddProp(agent, 'width', prop);
    prop = new SM_Number();
    this.featAddProp(agent, 'height', prop);
    // User-defined Scale -- will be applied to agent.scale on update
    prop = new SM_Number(1);
    this.featAddProp(agent, 'scale', prop);
    prop = new SM_Number();
    this.featAddProp(agent, 'scaleY', prop);
    // NOTE setting `flip` will not change the costume if Physics
    // is not being used.  This merely sets a flag.
    // If only Costume is being used, you need do a direct Costume.setScale
    // to trigger the flip.  We wanted to keep `flip` property
    // that could be easily set rather than a method.
    // REVIEW: Implement FEATURES_UPDATE phase processing for Costume
    //         to enable applicaiton of flip?
    this.featAddProp(agent, 'flipX', new SM_Boolean(false));
    this.featAddProp(agent, 'flipY', new SM_Boolean(false));
    // Costume color will override agent color during m_Update
    prop = new SM_Number();
    this.featAddProp(agent, 'glow', prop); // in seconds
    prop = new SM_Number();
    prop.setMax(16777215);
    prop.setMin(0);
    this.featAddProp(agent, 'color', prop);
    prop = new SM_Number();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorHue', prop);
    prop = new SM_Number();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorSaturation', prop);
    prop = new SM_Number();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorValue', prop);
    prop = new SM_Number();
    this.featAddProp(agent, 'colorScaleIndex', prop);
    prop = new SM_Number(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleHue', prop);
    prop = new SM_Number(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleSaturation', prop);
    prop = new SM_Number(1);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorScaleValue', prop);
    this.featAddProp(agent, 'colorScaleType', new SM_String('value'));
    prop = new SM_Number(5);
    this.featAddProp(agent, 'colorScaleSteps', prop);

    COSTUME_AGENTS.set(agent.id, agent.id);

    // Private Variables
    agent.prop.Costume.colorHue.value = undefined;
    agent.prop.Costume.colorSaturation.value = undefined;
    agent.prop.Costume.colorValue.value = undefined;

    agent.prop.Costume._spriteWidth = undefined;
    agent.prop.Costume._spriteHeight = undefined;

    agent.prop.Costume._animationBaseSkin = undefined;
    agent.prop.Costume._animationBaseSkinExt = undefined;
    agent.prop.Costume._animationFrame = undefined;
    agent.prop.Costume._animationStartFrame = undefined;
    agent.prop.Costume._animationFrameRate = undefined;
  }

  /// COSTUME METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featureCall Costume setCostume value
   */

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
    // clear costumeName so it does  not override animatedCostume
    agent.prop.Costume.costumeName.value = undefined;

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
  // NOTE: This involves an expensive call to get sprite dimensions
  _getBounds(agent: IAgent): { w: number; h: number } {
    const costumeName = agent.prop.Costume.costumeName.value;
    const frame = agent.prop.Costume.currentFrame.value;
    const { w, h } = SPRITE.getSpriteDimensions(costumeName, frame);
    agent.prop.Costume._spriteWidth = w;
    agent.prop.Costume._spriteHeight = h;
    return { w, h };
  }
  _getScaledBounds(agent: IAgent): { w: number; h: number } {
    const { w, h } = this._getBounds(agent);
    const scale = agent.prop.Costume.scale.value;
    const scaleY = agent.prop.Costume.scaleY.value || scale;
    return { w: scale * w, h: scaleY * h };
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(CostumePack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return CostumePack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      costumeName: SM_String.Symbols,
      currentFrame: SM_Number.Symbols,
      size: SM_Number.Symbols,
      width: SM_Number.Symbols,
      height: SM_Number.Symbols,
      scale: SM_Number.Symbols,
      scaleY: SM_Number.Symbols,
      flipX: SM_Boolean.Symbols,
      flipY: SM_Boolean.Symbols,
      glow: SM_Number.Symbols,
      color: SM_Number.Symbols, // hex css
      colorHue: SM_Number.Symbols,
      colorSaturation: SM_Number.Symbols,
      colorValue: SM_Number.Symbols,
      colorScaleIndex: SM_Number.Symbols,
      colorScaleHue: SM_Number.Symbols,
      colorScaleSaturation: SM_Number.Symbols,
      colorScaleValue: SM_Number.Symbols,
      colorScaleType: SM_String.Symbols,
      colorScaleSteps: SM_Number.Symbols
    },
    methods: {
      setAnimatedCostume: { args: ['costumeName:string', 'frameRate:number'] },
      getColorHSV: {
        returns: ['hue:number', 'saturation:number', 'value:number']
      },
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
      initHSVColorScale: {
        args: [
          'hue:number',
          'saturation:number',
          'value:number',
          'type:string',
          'steps:number'
        ]
      },
      getHSVColorScaleColor: {
        args: ['index:number'],
        returns: 'color:number'
      }
    }
  };
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CostumePack('Costume');
RegisterFeature(INSTANCE);
