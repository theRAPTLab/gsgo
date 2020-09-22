/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  sprite class + manager, wrapping PixiJS.Sprite with additional methods
  relevant to gemstep.

  Extends SMObject, which is our common stackmachine- compatible object.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import { IVisual } from './t-visual';
import { IPoolable } from './t-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Sprite implements IVisual, IPoolable {
  // visual
  sprite: PIXI.Sprite;
  refId: number;
  // poolable
  id: number;
  _pool_id: number;

  constructor(id: number) {
    this.sprite = new PIXI.Sprite();
    this.id = id; // store reference
  }

  /// RENDERING ///////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  draw() {}

  /// POOLABLE REQUIREMENTS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  dispose() {}
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

  /** set plotting parameters all at once */
  setPlotValues(x, y, angle) {}

  /** set width, height in pixels. if arg==0, then means autoscale to fix */
  setSizeValues(w, h) {}

  /** set the scale factor of sprite, which affects width/height */
  setScale(z) {}
  /** rotate by angle (+ is counterclockwise) */
  rotateBy() {}
} // end class Sprite

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Sprite;
