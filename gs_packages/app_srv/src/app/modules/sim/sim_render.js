/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  render manager for main simulation view area


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Sprite from './lib/class-sprite';
import SyncMap from './lib/class-syncmap';
import Viewport from './lib/class-viewport';
import * as POOL from './lib/class-pool';
import TEST from '../tests/test-vis';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_RENDER', 'TagRed');

const DISPLAY_LIST = new SyncMap('DOB-SPR', {
  Constructor: Sprite,
  autoGrow: true
});
DISPLAY_LIST.setObjectHandlers({
  onAdd: (dobj, spr) => {
    spr.x = dobj.x;
    spr.y = dobj.y;
  },
  onUpdate: (dobj, spr) => {
    spr.x = dobj.x;
    spr.y = dobj.y;
  },
  onRemove: spr => {}
});

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HandleDisplayList(displayList) {
  const { added, updated, removed } = DISPLAY_LIST.syncFromArray(displayList);
  console.log(
    ...PR('add:', added.length, 'upd:', updated.length, 'rem:', removed.length)
  );
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// UR.SystemHook('SIM', 'WAIT', () => {
//   console.log(...PR('initialize viewport'));
// });

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { HandleDisplayList };
