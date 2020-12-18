/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Global instances are maintained here is a pure data module that can be included anywhere
  to access global data.

  IMPORTANT:
  Do not import other modules into here unless you are absolutely
  sure it will not create a circular dependency!
  This module is intended to be "pure" so any module can import
  it and access its

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import PixiTextureMgr from 'lib/class-pixi-asset-mgr';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('GLOBAL', 'TagRed');
let FRAME_TIME = 0;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ASSET_MGR = new PixiTextureMgr();

/// ASSET LOADING API METHODS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const GetAsset = ASSET_MGR.getAsset;
export const GetAssetById = ASSET_MGR.getAssetById;
export const LookupAssetId = ASSET_MGR.lookupAssetId;
export const LoadAssetsSync = ASSET_MGR.loadManifestSync;
export const GetTextureInfo = ASSET_MGR.getTextureInfo;

/// FORWARD INTRINSIC OBJECTS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const LibMath = Math;
export const _frame = () => FRAME_TIME;

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for erasing data structures
UR.SystemHook('SIM/RESET', () => {});
UR.SystemHook('SIM/INPUTS', frameTime => {
  FRAME_TIME = frameTime;
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exported functions
/// expose maps and managers
