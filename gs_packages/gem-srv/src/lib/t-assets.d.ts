/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Asset Manager Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export type TAssetDef = { assetId: number; assetName: string; assetUrl?: string };
export type TResource = TAssetDef | { rsrc?: any; error?: string };

export type TAssetId = number;
export type TAssetName = string;
export type TAssetURL = string;
export type TAssetType = 'sprites' | 'sounds';
export type TManifest = { [K in TAssetType]?: TAssetDef[] };

/* public API for any AssetLoader */
export abstract class TAssetLoader {
  type(): TAssetType;
  queueAssetList(assetList: TAssetDef[]): void;
  promiseLoadAssets(): Promise<TAssetDef[]>;
}
