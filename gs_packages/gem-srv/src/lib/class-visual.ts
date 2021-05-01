/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  sprite class + manager, wrapping PixiJS.Sprite with additional methods
  relevant to gemstep.

  Extends SMObject, which is our common stackmachine- compatible object.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { GlowFilter } from '@pixi/filter-glow';
import * as DATACORE from 'modules/datacore';
import * as GLOBAL from 'modules/datacore/dc-globals';
import { IVisual } from './t-visual';
import { IPoolable } from './t-pool.d';
import { IActable } from './t-script';
import { MakeDraggable } from './vis/draggable';
import { MakeHoverable } from './vis/hoverable';
import { MakeSelectable } from './vis/selectable';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// placeholders
interface ISpriteStore {
  sheet?: PIXI.Spritesheet;
}
let REF_ID_COUNTER = 0;
/// outline filters
const outlineHover = new OutlineFilter(3, 0xffff0088);
const outlineSelected = new OutlineFilter(6, 0xffff00);
const glow = new GlowFilter({ distance: 50, outerStrength: 3, color: 0x00ff00 });
// text styles
const style = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 18,
  fontWeight: 'bold',
  fill: ['#ffffffcc'],
  stroke: '#ffffff'
});

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
  refId?: any;
  // visual
  container: PIXI.Container;
  filterbox: PIXI.Container; // Filters are applied to everything in this container
  sprite: PIXI.Sprite;
  text: PIXI.Text;
  meter: PIXI.Graphics;
  textContent: string; // cache value to avoid unecessary updates
  meterValue: number;
  assetId: number;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isCaptive: boolean;
  isGlowing: boolean;
  // poolable
  id: any;
  _pool_id: any;
  // sprite
  root: PIXI.Container; // parent container

  constructor(id: number) {
    this.id = id; // store reference
    const spr = new PIXI.Sprite();
    spr.pivot.x = spr.width / 2;
    spr.pivot.y = spr.height / 2;
    this.sprite = spr;
    const filterbox = new PIXI.Container();
    filterbox.filters = []; // init for hover and select outlines
    filterbox.addChild(this.sprite);
    this.filterbox = filterbox;
    this.assetId = 0;
    this.refId = REF_ID_COUNTER++;
    this.isSelected = false; // use primary selection effect
    this.isHovered = false; // use secondary highlight effect
    this.isGrouped = false; // use tertiary grouped effect
    this.isCaptive = false; // use tertiary grouped effect
    this.isGlowing = false;
    this.container = new PIXI.Container();
    this.container.addChild(this.filterbox);
  }

  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);
  setGlowing = (mode = this.isGlowing) => (this.isGlowing = mode);

  setTextureById(assetId: number, frameKey: string | number) {
    if (!Number.isInteger(assetId))
      throw Error('numeric frameKey must be integer');
    const rsrc = GLOBAL.GetAssetById(assetId);
    const tex = m_ExtractTexture(rsrc, frameKey);
    this.sprite.texture = tex;
    this.assetId = assetId;
  }

  setTexture(name: string, frameKey: string | number) {
    if (typeof name !== 'string') throw Error('arg1 must be texture asset name');
    const rsrc: PIXI.LoaderResource = GLOBAL.GetAsset(name);
    if (rsrc === undefined) {
      console.log(`ERR: couldn't find resource '${name}'`);
      (window as any).DC = DATACORE;
      (window as any).GLOB = GLOBAL;
      return;
    }
    // is this a spritesheet?
    const tex = m_ExtractTexture(rsrc, frameKey);
    this.sprite.texture = tex;
    this.assetId = GLOBAL.LookupAssetId(name);
    const px = this.sprite.texture.width / 2;
    const py = this.sprite.texture.height / 2;
    this.sprite.pivot.set(px, py);

  }

  /**
   * Call this AFTER
   *  setAlpha
   *  setTexture
   *  setScale
   */
  applyFilters() {
    // selected?
    const filters = [];
    if (this.isSelected) filters.push(outlineSelected);
    if (this.isHovered) filters.push(outlineHover);
    if (this.isGlowing) filters.push(glow);
    if (filters.length > 0) {
      // override opacity so outlines will display
      this.sprite.alpha = 1;
    }
    this.filterbox.filters = filters;
  }

  setFrame(frameKey: string | number) {
    if (this.assetId === undefined)
      console.warn(`asset for sprite ${this.id} not set`);
    this.setTextureById(this.assetId, frameKey);
  }

  add(root: PIXI.Container) {
    this.root = root;
    root.addChild(this.container);
  }

  dispose() {
    this.root.removeChild(this.container);

    // `removeChild` does not actually remove the sprite
    // and leads to a memory leak.
    // We need to destroy the sprite.
    this.container.destroy({ children: true });

    // this.filterbox.removeChild(this.meter);
    // this.filterbox.removeChild(this.sprite);
    // this.container.removeChild(this.filterbox);
    // this.container.removeChild(this.text);
    // this.root.removeChild(this.container);
    // this.root = undefined;
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

  getZIndex() {
    return this.container.zIndex;
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
    this.container.position.set(x, y);
  }

  /**
   * REVIEW: Using zIndex might reduce performance
   *         Layers might be better: https://github.com/pixijs/pixi-display
   * See https://pixijs.download/release/docs/PIXI.Container.html#sortableChildren
   * @param zIndex
   */
  setZIndex(zIndex: number) {
    this.container.zIndex = zIndex;
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

  /**
   * This should be called after setTexture so that we know
   * the bounds of the sprite for placing the text
   */
  setText(str: string) {
    if (this.textContent === str) return; // no update necessary

    // Remove any old text
    // We have to remove the child and reset it to update the text?
    this.container.removeChild(this.text);
    if (this.text) this.text.destroy();

    this.text = new PIXI.Text(str, style);
    this.textContent = str; // cache

    // position text bottom centered
    const textBounds = this.text.getBounds();
    const spacer = 5;
    const x = -textBounds.width / 2;
    const y = this.sprite.height / 2 + spacer;
    this.text.position.set(x, y);

    this.container.addChild(this.text);
  }

  setMeter(percent: number, color: number, isLargeMeter: boolean) {
    if (percent === this.meterValue) return; // no update necessary
    if (!this.meter) this.meter = new PIXI.Graphics();
    if (!color) color = 0xff6600; // default is orange. If color is not set it is 0.

    const w = isLargeMeter ? 40 : 10;
    const h = isLargeMeter ? 80 : 40;
    const spacer = w + 5;
    const x = isLargeMeter ? -w / 2 : -this.sprite.width / 2 - spacer;
    const y = this.sprite.height / 2 - h; // flush with bottom of sprite

    this.meter.clear();

    // background
    this.meter.beginFill(0xffffff, 0.3);
    this.meter.drawRect(x, y, w, h);
    this.meter.endFill();

    // bar
    this.meter.beginFill(color, 0.5);
    this.meter.drawRect(x, y + h - percent * h, w, percent * h);
    this.meter.endFill();

    this.meterValue = percent;
    this.filterbox.addChild(this.meter);
  }

  removeMeter() {
    if (this.meter) {
      this.meter.destroy();
      this.meter = undefined;
    }
  }
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
export { MakeHoverable };
export { MakeSelectable };
