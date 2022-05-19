/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  sprite class + manager, wrapping PixiJS.Sprite with additional methods
  relevant to gemstep.

  Extends SMObject, which is our common stackmachine- compatible object.

  Container hierarchy

    root -- parent container
    + cone -- vision cone directly attached to root w absolute positions
    + container
      + text
      + graph
      + filterbox
        + sprite -- rotations and scales are applied only to the sprite
          + filters -- filters only applied to sprite
              filterColorOverlay
              filterAdjustment
        + meter
        + filters -- filters applied to all filterBox objects
            outlineSelected
            outlineHOver
            glow

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { OutlineFilter } from '@pixi/filter-outline';
import { GlowFilter } from '@pixi/filter-glow';
import * as ASSETS from 'modules/asset_core';
import FLAGS from 'modules/flags';
// uses types from t-visual, t-pool, t-script
import { MakeDraggable } from './vis/draggable';
import { MakeHoverable } from './vis/hoverable';
import { MakeSelectable } from './vis/selectable';
import { DrawLineGraph } from './util-pixi-linegraph';
import { DrawBarGraph } from './util-pixi-bargraph';

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
const glow = new GlowFilter({ distance: 50, outerStrength: 3, color: 0xffff00 });
// text styles
const style = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 18,
  fontWeight: 'bold',
  fill: ['#ffffffcc'],
  stroke: '#333333cc',
  strokeThickness: 3
});
// replacement for GLOBAL sprite
const SPRITES = ASSETS.GetLoader('sprites');

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

  // or maybe it's a straight-up texture already
  if (rsrc instanceof PIXI.Texture) {
    throw Error('resource is a PIXI.Texture, not PIXI.LoaderResource');
  }

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
  graph: PIXI.Graphics;
  cone: PIXI.Graphics;
  textContent: string; // cache value to avoid unecessary updates
  meterValue: number;
  assetId: number;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isCaptive: boolean;
  isGlowing: boolean;
  filterColorOverlay: any;
  filterAdjustment: any;
  filterColor: number;
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
    this.container = new PIXI.Container();
    this.container.addChild(this.filterbox);
    this.assetId = 0;
    this.refId = REF_ID_COUNTER++;
    this.isSelected = false; // use primary selection effect
    this.isHovered = false; // use secondary highlight effect
    this.isGrouped = false; // use tertiary grouped effect
    this.isCaptive = false; // use tertiary grouped effect
    this.isGlowing = false;
    this.filterColorOverlay = undefined;
    this.filterAdjustment = undefined;
  }

  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);
  setGlowing = (mode = this.isGlowing) => (this.isGlowing = mode);

  setTextureById(assetId: number, frameKey: string | number) {
    if (!Number.isInteger(assetId))
      throw Error('numeric frameKey must be integer');
    const { rsrc } = SPRITES.getAssetById(assetId);
    const tex = m_ExtractTexture(rsrc, frameKey);
    this.sprite.texture = tex;
    this.assetId = assetId;
  }

  setTexture(name: string, frameKey: string | number) {
    if (typeof name !== 'string') throw Error('arg1 must be texture asset name');
    try {
      const { rsrc } = SPRITES.getAsset(name);
      // is this a spritesheet?
      const tex = m_ExtractTexture(rsrc, frameKey);
      this.sprite.texture = tex;
      this.assetId = SPRITES.lookupAssetId(name);
      const px = this.sprite.texture.width / 2;
      const py = this.sprite.texture.height / 2;
      this.sprite.pivot.set(px, py);
    } catch (err) {
      console.error(
        `class-visual failed setting texture name ${name} for agent ${
          this.id
        } rsrc ${SPRITES.getAsset(name)}`
      );
    }
  }

  /**
   * setColorize was designed around the moth activity.
   * We want to colorize sprites, but retain their luminosity so you can still
   * see sprite details.  Using colorOverly with adjustmentFilter's color
   * multiply accomplishes this nicely: Blacks are rendered in the specified
   * color, and everything else is a range in the specified color.  It is
   * essentially a monotone image.  The 50% alpha on the color overlay
   * helps to retain the black values.
   * Setting color this way also helps to keep the dobj packet size down to a single number.
   *
   * To blow out the color: ColorOverlay alpha = 1, + AdjustmentFilter
   * Either setting by itself will not quite change the color.
   *
   * ColorOverlayFilter alpha = 1 by itself will blow out the color.
   * AdjustmentFIlter by itself will tint but not change values.
   */
  setColorize(color: number) {
    if (color === null || color === undefined) {
      // Remove Colorize
      this.filterColorOverlay = undefined;
      this.filterAdjustment = undefined;
      return;
    }

    // Don't cache color.  Always update color because vobjs are not reset during RESET Stage
    // if (this.filterColor === color) return; // color hasn't changed, skip update

    this.filterColor = color;
    const [r, g, b] = PIXI.utils.hex2rgb(color);
    this.filterColorOverlay = new ColorOverlayFilter([r, g, b], 0.5);
    this.filterAdjustment = new AdjustmentFilter({ red: r, green: g, blue: b });
  }
  /**
   * Call this AFTER
   *  setAlpha
   *  setTexture
   *  setScale
   */
  applyFilters() {
    // selected?
    const filters = []; // filters for the whole visual object
    const spriteFilters = []; // filters for the sprite texture only
    if (this.isSelected) filters.push(outlineSelected);
    if (this.isHovered) filters.push(outlineHover);
    if (this.isGlowing) filters.push(glow);
    if (this.filterColorOverlay) spriteFilters.push(this.filterColorOverlay);
    if (this.filterAdjustment) spriteFilters.push(this.filterAdjustment);
    if (this.isSelected || this.isHovered) {
      // HACK
      // temporarily override opacity so outlines will display
      this.sprite.alpha = 1;
    }
    this.filterbox.filters = filters;
    this.sprite.filters = spriteFilters;
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
    /* Properly disposing of vobjs is complicated:
       1. Nested objects need to be removed via `removeChild`
       2. But `removeChild` does not actually remove all of the pixi components
          and leads to a memory leak as more objects are added.
       3. `destroy()` will properly dispose of textures, but it leaves the
          pixi object intact.  e.g. this.text.destroy() does not =leave
          this.text undefined.  So we want it undefined, we have to explicitly
          set it so.
       4. We can't simply destroy the whole container because class-visual is
          is a pooled object that is re-used.  As such, the constructor is
          only called once.  If we destroy the container, we end up destroying
          some of the pixi components the constructor creates, such as the
          filterbox and the sprite.
       5. We also have to remove the container from the root or the
          vobj will remain on screen.
    */
    this.filterbox.removeChild(this.meter);
    this.container.removeChild(this.graph);
    this.container.removeChild(this.text);
    this.removeText();
    this.removeMeter();
    this.removeGraph();
    this.root.removeChild(this.container); // needed or vobj is not removed
    if (this.cone) this.root.removeChild(this.cone);
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

  /** zIndex depends on:
   *  --  parent.sortableChildren = true
   *  --  Sorting happens only when
   *      1. sortChildren() is called, or
   *      2. updateTransform() is called
   *      AND
   *      sortDirty has been set to true by
   *      1. adding a child, or
   *      2. setting zIndex of a child
   * In general, then it's best to set zIndex and make sure it's followed by a call
   * that updates the transform, like setting position.
   * We don't wnat to force an updateTransform here becasue it would trigger a
   * updateTransform for every display object update.
   *
   * REVIEW: Using zIndex might reduce performance
   *         Layers might be better: https://github.com/pixijs/pixi-display
   * See https://pixijs.download/release/docs/PIXI.Container.html#sortableChildren
   */
  setZIndex(zIndex: number) {
    this.container.zIndex = zIndex;
  }

  turnAngle(deltaA: number) {
    this.sprite.angle += deltaA;
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  setAlpha(o: number = 1) {
    this.sprite.alpha = o;
  }

  setAngle(angle: number) {
    this.sprite.angle = angle;
  }

  setRotation(rad: number = 0) {
    this.sprite.rotation = rad;
  }

  /** set plotting parameters all at once */
  setPlotValues(x, y, angle) {}

  /** set width, height in pixels. if arg==0, then means autoscale to fix */
  setSizeValues(w, h) {}

  /** set the scale factor of sprite, which affects width/height */
  setScale(x: number = 1, y: number = x) {
    this.sprite.scale.set(x, y);
  }

  /** rotate by angle (+ is counterclockwise) */
  rotateBy() {}

  /**
   * This should be called after setTexture so that we know
   * the bounds of the sprite for placing the text
   */
  setText(str: string) {
    if (this.text && this.textContent === str) return; // no update necessary

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

  removeText() {
    if (this.text) {
      this.text.destroy();
      // After text.destroy() it is still a pixi object
      // so we have to set it explicitly to undefined so that setText will
      // not inadvertently call destroy() on it again.
      this.text = undefined;
    }
  }

  setMeter(
    percent: number,
    color: number,
    position: number,
    isLargeGraphic: boolean
  ) {
    // Don't cache meterValue because script might change only color
    // if (percent === this.meterValue) return; // no update necessary
    if (!this.meter) {
      this.meter = new PIXI.Graphics();
      this.filterbox.addChild(this.meter);
    }
    if (!color) color = 0xff6600; // default is orange. If color is not set it is 0.

    const pad = 5;
    const w = isLargeGraphic ? 40 : 10;
    const h = isLargeGraphic ? 80 : 40;

    // meter position
    let xoff = 0; // x-offset
    const sw = this.sprite.width;
    if (position === FLAGS.POSITION.OUTSIDE_LEFT) xoff = -(w + pad);
    if (position === FLAGS.POSITION.INSIDE_LEFT) xoff = pad;
    if (position === FLAGS.POSITION.MIDDLE) xoff = sw / 2 - w / 2;
    if (position === FLAGS.POSITION.INSIDE_RIGHT) xoff = sw - w - pad;
    if (position === FLAGS.POSITION.OUTSIDE_RIGHT) xoff = sw + pad;

    const x = isLargeGraphic ? -w / 2 : -this.sprite.width / 2 + xoff;
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
  }
  removeMeter() {
    if (this.meter) {
      this.meter.destroy();
      this.meter = undefined;
    }
  }

  m_addGraph() {
    if (!this.graph) {
      this.graph = new PIXI.Graphics();
      this.container.addChild(this.graph);
    }
  }
  setGraph(data: number[], isLargeGraph: boolean) {
    this.m_addGraph();
    const [w, h] = this.getSizeValues();
    DrawLineGraph(this.graph, data, {
      scale: isLargeGraph ? 1 : 0.25, // scale 1 = 100 pixels
      scaleY: isLargeGraph ? 1 : 0.25,
      color: 0xffff00,
      offsetY: isLargeGraph ? 0 : h
    });
  }
  setBarGraph(data: number[], labels: string[], isLargeGraph: boolean = true) {
    // if (data.length > 0) console.log('Draw', data);
    this.m_addGraph();
    const [w, h] = this.getSizeValues();
    DrawBarGraph(this.graph, data, labels, {
      scale: isLargeGraph ? 1 : 0.25, // scale 1 = 100 pixels
      scaleY: isLargeGraph ? 1 : 0.25,
      color: 0xffff00,
      offsetY: isLargeGraph ? 0 : h
    });
  }
  removeGraph() {
    if (this.graph) {
      this.graph.removeChildren(); // REVIEW: Need to destroy text children too?
      this.graph.destroy();
      this.graph = undefined;
    }
  }

  // General Debugging property to test sending data.
  setDebug(data: any) {
    // hacked to draw vision cone
    this.drawVisionCone(data);
  }

  removeDebug() {
    // hacked to remove vision cone
    if (this.cone) {
      this.cone.destroy();
      this.cone = undefined;
    }
  }

  // Hack a vision cone for debugging purposes.
  // This draws a polygon using the values passed via setDebug.
  // The polygon is attached to root, not the sprite, so that we
  // can test absolute values.
  drawVisionCone(path: number[] = []) {
    // const path = [0, 0, -100, -100, 100, -100];
    if (!this.cone) {
      this.cone = new PIXI.Graphics();
      if (this.root) this.root.addChild(this.cone);
    }
    this.cone.clear();
    this.cone.beginFill(0x6666ff, 0.2);
    this.cone.drawPolygon(path);
    this.cone.endFill();
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
