/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A visual representation of an id-ish object, linking a data object
  to a visual object. These are used in Display Lists for the Renderer.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable } from './t-pool.d';

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
    hasProps = hasProps && item.x !== undefined;
    hasProps = hasProps && item.y !== undefined;
    hasProps = hasProps && item.skin !== undefined;
    return acc + (hasProps ? 0 : 1);
  }, 0);
  return badCount === 0;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DisplayObject implements IPoolable {
  // poolable
  id: any;
  refId?: any;
  _pool_id: any;
  // displayobj
  valid: boolean;
  skin: string;
  x: number;
  y: number;

  constructor(id?: any) {
    this.init(id);
  }

  init(id?: any) {
    this.id = id; // store reference
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
