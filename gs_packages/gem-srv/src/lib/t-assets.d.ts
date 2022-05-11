/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Asset Manager Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export type TAssetDef = { assetId: number; assetName: string; assetUrl?: string };
export type TResource = TAssetDef & { rsrc?: any; error?: string };

export type TAssetId = number;
export type TAssetName = string;
export type TAssetURL = string;
export type TAssetType = 'sprites' | 'sounds' | 'projects';
export type TManifest = { [K in TAssetType]?: TAssetDef[] };

/* public API for any AssetLoader */
export abstract class TAssetLoader {
  type(): TAssetType;
  queueAssetList(assetList: TAssetDef[]): void;
  promiseLoadAssets(): Promise<TAssetDef[]>;
  reset(): void;
}

/// GEMPROJECT JSON FORMAT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the .gemproj file format is pseudo-JSON */
export type TProject = {
  id: string;
  label: string;
  description: string;
  metadata: TMetadata;
  rounds: TRounds[];
  blueprints: TBlueprint[];
  instances: TInstance[];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a mishmash of simulation input and stage properties */
export type TMetadata = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  wrap: [boolean, boolean];
  bounce: boolean;
  bgcolor: number;
  roundsCanLoop: boolean;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** simulation round controllers */
export type TRounds = {
  id: string;
  label: string;
  time: number;
  intro: string;
  outtro: string;
  initScript: string;
  endScript: string;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** blueprint scripts */
export type TBlueprint = {
  id?: string; // id is being phased out in favor of name
  name?: string; // name is required once id is resolved
  label: string;
  scriptText: string;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** instances to create from blueprints */
export type TInstance = {
  id: string;
  label: string;
  bdid: string;
  initScript: string;
};
