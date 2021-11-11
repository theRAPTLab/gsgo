/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DEPRECATED as of 10/29/2021 BL -- No longer being used in GAgent.

  Global instances are maintained here is a pure data module that can be
  included anywhere to access global data.

  IMPORTANT: Do not import other modules into here unless you are absolutely
  sure it will not create a circular dependency! This module is intended to be
  "pure" so any module can import it and access its

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// ASSET LOADING API METHODS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ THESE HAVE BEEN DEPRECATED
 *  see modules/mediacore/asset-mgr.ts which treats assets as a separate
    top-level source alongside APPCORE (appstate) and DATACORE (model data)
/*/
/// export const GetAsset = ASSET_MGR.getAsset;
/// export const GetAssetById = ASSET_MGR.getAssetById;
/// export const LookupAssetId = ASSET_MGR.lookupAssetId;
/// export const LoadAssetsSync = ASSET_MGR.loadManifestSync;
/// export const GetTextureInfo = ASSET_MGR.getTextureInfo;
/// export const GetSpriteDimensions = ASSET_MGR.getSpriteDimensions;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let FRAME_TIME = 0;

/// FORWARD INTRINSIC OBJECTS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const LibMath = Math;
export const _frame = () => FRAME_TIME;

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for erasing data structures
UR.HookPhase('SIM/RESET', () => {});
UR.HookPhase('SIM/INPUTS_READ', frameTime => {
  FRAME_TIME = frameTime;
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exported functions
/// expose maps and managers
