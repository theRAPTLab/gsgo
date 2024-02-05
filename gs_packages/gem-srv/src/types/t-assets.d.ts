/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Asset Manager Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

declare global {
  /// ASSET MANAGER TYPES ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  type TAssetDef = {
    assetId: number;
    assetName: string;
    assetUrl?: string;
  };
  type TResource = TAssetDef & { rsrc?: any; error?: string };

  /// ASSET MANIFEST TYPES //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  type TAssetId = number;
  type TAssetName = string;
  type TAssetURL = string;
  type TAssetType = 'sprites' | 'sounds' | 'projects' | 'preferences';
  type TManifest = { [K in TAssetType]?: TAssetDef[] };

  /// PUBLIC API FOR ASSET LOADER SUBCLASSERS ///////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface TAssetLoader {
    type(): TAssetType;
    queueAssetList(assetList: TAssetDef[]): void;
    promiseLoadAssets(): Promise<TAssetDef[]>;
    reset(): void;
  }

  /// GEMPROJECT JSON FORMAT ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** the .gemproj file format is pseudo-JSON */
  type TProject = {
    id: string;
    label: string;
    description: string;
    metadata: TMetadata;
    rounds: TRounds[];
    ecaTypes?: TConversationAgent[];
    blueprints: TBlueprint[];
    instances: TInstanceDef[];
  };
  type TProjectList = { id: string; label: string };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a mishmash of simulation input and stage properties */
  type TMetadata = {
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
  type TRounds = {
    id: string;
    label: string;
    time: number;
    intro: string;
    outtro: string;
    initScript: string;
    endScript: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** embodied conversation agents associated with the project */
  type TConversationAgent = {
    label?: string;
    name: string;
    initialMessage?: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** blueprint scripts */
  type TBlueprint = {
    id?: string; // id is being phased out in favor of name
    name?: string; // name is required once id is resolved
    label?: string;
    scriptText: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instances to create from blueprints */
  type TInstanceDef = {
    id: string;
    label: string;
    bpid: string;
    initScript: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** project preferences */
  type TPreferences = {
    commentTypes: [any];
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used to map blueprint name to blueprint instance definitions */
  type TInstanceDefsByBP = Map<string, TInstanceDef[]>; // string is blueprint name
}

/// EXPORT AS MODULE FOR GLOBALS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
