/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A visual representation of an id-ish object, linking a data object
  to a visual object. These are used in Display Lists for the Renderer.

  Extends SMObject, which is our common stackmachine- compatible object.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable } from './t-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// TESTING UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function TestValidDOBJs(dobjs: any[]): boolean {
  const badCount = dobjs.reduce((acc: number, item: DisplayObject) => {
    let hasProps = true;
    if (item.x === undefined) console.log(item, 'bad x');
    if (item.y === undefined) console.log(item, 'bad y');
    if (item.skin === undefined) console.log(item, 'bad skin');
    if (item.visual === undefined) console.log(item, 'bad visual');
    hasProps = hasProps && item.x !== undefined;
    hasProps = hasProps && item.y !== undefined;
    hasProps = hasProps && item.skin !== undefined;
    hasProps = hasProps && item.visual !== undefined;
    return acc + (hasProps ? 0 : 1);
  }, 0);
  return badCount === 0;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DisplayObject implements IPoolable {
  // poolable
  id: number;
  _pool_id: number;
  // displayobj
  visual: any;
  valid: boolean;
  skin: string;
  x: number;
  y: number;

  constructor(id?: number) {
    this.init(id);
  }

  setVisual(vis: any) {
    this.visual = vis;
  }

  init(id?: number) {
    this.visual = undefined; // visuals must implement Draw()
    this.id = id; // store reference
    this.valid = false;
  }

  validate(flag: boolean) {
    this.valid = flag;
  }

  isValid(): boolean {
    return this.valid;
  }

  dispose() {
    if (this.visual) this.visual.dispose();
  }

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
