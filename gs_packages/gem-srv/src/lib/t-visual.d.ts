/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Visual System Typescript Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';
import { IPoolable } from 'lib/t-pool.d';
import { IActable } from 'lib/t-script';

/// VISUALS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IVisual {
  sprite: PIXI.Sprite;
  add: (root: PIXI.Container) => void;
  dispose: () => void;
  // use the Visual type instead for complete coverage
}

export type Visual = IVisual & IPoolable & IActable;
