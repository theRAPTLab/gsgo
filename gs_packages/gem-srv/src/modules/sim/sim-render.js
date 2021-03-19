/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Renderer Phase Machine Interface

  Works purely with display objects, so it is up to other code to convert
  lists of Agents, etc into an array or map of DisplayObjects.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SyncMap from 'lib/class-syncmap';
import Visual from 'lib/class-visual';
import { Render } from 'modules/render/api-render';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_RENDER');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DOBJ_LIST;
const MAPPED_VISUALS = new SyncMap({
  Constructor: Visual, // sprites track display objs
  autoGrow: true,
  name: 'DisplayObjectToSprite'
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Manager for handling changes in the display objects, and handling their
 *  individual updates
 */
function m_Initialize() {
  MAPPED_VISUALS.setMapFunctions({
    onAdd: (dobj, vobj) => {
      vobj.setPosition(dobj.x, dobj.y);
      vobj.setSkin(dobj.skin());
    },
    onUpdate: (dobj, spr) => {
      spr.x = dobj.x;
      spr.y = dobj.y;
    },
    onRemove: vobj => {}
  });
}

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_RenderDisplayList(frameNum) {
  Render(frameNum);
}

/// API FUNCTIONS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Accepts a list of display objects that were presumably already derived from
 *  the agents list
 */
function SaveDisplayList(dobjs) {
  DOBJ_LIST = dobjs;
}
/** Update the sprites from the saved list of display objects
 */
function RenderDisplayList() {
  MAPPED_VISUALS.syncFromArray(DOBJ_LIST);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PHASE_LOAD
UR.HookPhase('SIM/RESET', () => {
  m_Initialize();
});
UR.HookPhase('SIM/SETMODE', () => {});
UR.HookPhase('SIM/WAIT', () => {});
UR.HookPhase('SIM/INIT', () => {});
UR.HookPhase('SIM/READY', () => {});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PHASE_LOOP
UR.HookPhase('SIM/VIS_UPDATE', () => {
  // use this for updating anything other than mapped display objects,
  // since MAPPED_SPRITES updates sprites implicitly after
});
UR.HookPhase('SIM/VIS_RENDER', m_RenderDisplayList);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SaveDisplayList, RenderDisplayList };
