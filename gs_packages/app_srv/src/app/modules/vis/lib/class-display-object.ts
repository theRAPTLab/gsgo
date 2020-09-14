/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A visual representation of an id-ish object, linking a data object
  to a visual object. These are used in Display Lists for the Renderer.

  Extends SMObject, which is our common stackmachine- compatible object.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// import SM_Object from '../../sim/lib/class-sm-object';
// import Sprite from './class-sprite';
import { I_PoolMappable } from './types-visual';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DisplayObject implements I_PoolMappable {
  visual: any;
  refId: any;
  dirty: boolean;
  poolId: number;
  valid: boolean;

  constructor() {
    this.init();
  }

  setVisual(vis: any) {
    this.visual = vis;
  }

  init() {
    this.visual = undefined; // visuals must implement Draw()
    this.refId = undefined; // store reference
    this.poolId = undefined;
    this.dirty = false; // set when needs processing
    this.valid = false;
  }

  validate(flag: boolean) {
    this.valid = flag;
  }

  isValid(): boolean {
    return this.valid;
  }

  dispose() {}

  /// SERIALIZE DATA //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  serialize() {}
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default DisplayObject;
