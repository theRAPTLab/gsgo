/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  sprite class + manager, wrapping PixiJS.Sprite with additional methods
  relevant to gemstep.

  Extends SMObject, which is our common stackmachine- compatible object.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import * as DATACORE from 'modules/runtime-datacore';
import { IVisual } from './t-visual';
import { IPoolable } from './t-pool.d';
import { IActable } from './t-interaction';
import { MakeDraggable } from './vis/draggable';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// placeholders
interface ISpriteStore {
  sheet?: PIXI.Spritesheet;
}
let REF_ID_COUNTER = 0;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractTexture(rsrc: any, frameKey: number | string): PIXI.Texture {
  // is spritesheet?
  if (rsrc.spritesheet) {
    let key: number;
    let tex: PIXI.Texture;
    const t = typeof frameKey;
    switch (t) {
      case 'string':
        tex = rsrc.textures[frameKey];
        if (tex === undefined) console.error(`invalid frame name '${frameKey}'`);
        break;
      case 'number':
        if (!Number.isInteger(<number>frameKey))
          throw Error('numeric frameKey must be integer');
        key = rsrc.spritesheet._frameKeys[frameKey];
        if (key === undefined) {
          key = rsrc.spritesheet._frameKeys[0];
          console.error(`invalid frame[${frameKey}]; using frame[0]`);
        }
        tex = rsrc.textures[key];
        break;
      case 'undefined':
        key = rsrc.spritesheet._frameKeys[0];
        tex = rsrc.textures[key];
        break;
      default:
        throw Error(`rsrc.spritesheet._frameKeys[${frameKey}] does not exist`);
    }
    return tex;
  }
  // otherwise, is this a regular texture?
  if (rsrc.texture) return rsrc.texture;

  // if we got here, the passed rsrc  might not be one
  throw Error('could not find texture in resource');
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Visual implements IVisual, IPoolable, IActable {
  // class
  refId?: number;
  // visual
  sprite: PIXI.Sprite;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isCaptive: boolean;
  // poolable
  id: number;
  _pool_id: number;
  // sprite
  root: PIXI.Container;

  constructor(id: number) {
    this.id = id; // store reference
    const spr = new PIXI.Sprite();
    spr.pivot.x = spr.width / 2;
    spr.pivot.y = spr.height / 2;
    this.sprite = spr;
    this.refId = REF_ID_COUNTER++;
    this.isSelected = false; // use primary selection effect
    this.isHovered = false; // use secondary highlight effect
    this.isGrouped = false; // use tertiary grouped effect
    this.isCaptive = false; // use tertiary grouped effect
  }

  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);

  setTextureById(assetId: number, frameKey: string | number) {
    if (!Number.isInteger(assetId))
      throw Error('numeric frameKey must be integer');
    const rsrc = DATACORE.GetAssetById(assetId);
    const tex = m_ExtractTexture(rsrc, frameKey);
    this.sprite.texture = tex;
  }

  setTexture(name: string, frameKey: string | number) {
    if (typeof name !== 'string') throw Error('arg1 must be texture asset name');
    const rsrc: PIXI.LoaderResource = DATACORE.GetAsset(name);
    if (rsrc === undefined) {
      console.log(`ERR: couldn't find resource '${name}'`);
      (window as any).DC = DATACORE;
      return;
    }
    // is this a spritesheet?
    const tex = m_ExtractTexture(rsrc, frameKey);
    this.sprite.texture = tex;
    const px = this.sprite.texture.width / 2;
    const py = this.sprite.texture.height / 2;
    this.sprite.pivot.set(px, py);
    // we're done
  }

  add(root: PIXI.Container) {
    this.root = root;
    root.addChild(this.sprite);
  }

  dispose() {
    this.root.removeChild(this.sprite);
    this.root = undefined;
  }

  /// POOLABLE REQUIREMENTS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  init() {}
  validate() {}
  isValid() {
    return true;
  }

  /// POSITION, ANGLE, SIZE ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns [x,y,angle] of visual */
  getPlotValues() {
    const spr = this.sprite;
    return [spr.x, spr.y, spr.angle];
  }

  /** returns [w,h] of visual */
  getSizeValues() {
    const spr = this.sprite;
    return [spr.width, spr.height];
  }

  /** returns color, opacity */
  getColorValues() {
    // return [spr.color, spr.opacity, spr.visibility];
  }

  /** return position array */
  getPosition() {
    const spr = this.sprite;
    return [spr.x, spr.y];
  }

  /** get direction by angle (0 points right) */
  getAngle() {
    return this.sprite.angle;
  }

  getScale() {
    return {
      x: this.sprite.scale.x,
      y: this.sprite.scale.y
    };
  }

  setPosition(x: number, y: number) {
    this.sprite.position.set(x, y);
  }

  turnAngle(deltaA: number) {
    this.sprite.angle += deltaA;
  }

  setAlpha(o: number) {
    this.sprite.alpha = o;
  }
  setAngle(angle: number) {
    this.sprite.angle = angle;
  }

  setRotation(rad: number) {
    this.sprite.rotation = rad;
  }

  /** set plotting parameters all at once */
  setPlotValues(x, y, angle) {}

  /** set width, height in pixels. if arg==0, then means autoscale to fix */
  setSizeValues(w, h) {}

  /** set the scale factor of sprite, which affects width/height */
  setScale(x: number, y: number = x) {
    this.sprite.scale.set(x, y);
  }

  /** rotate by angle (+ is counterclockwise) */
  rotateBy() {}
} // end class Sprite

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Visual;
export { MakeDraggable };
