/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Make Selectable

  NOTE: Use draggable.ts if dragging is desired.
        draggable will handle the click event.

        Use selectable.ts if you ONLY want click
        detection and NO drag support.

  Handles clicks on a sprite:
  1. This will set the `isSelected` state
  2. This will show an outline on the sprite

  given a VOBJ, decorate it to add new features

  Call Order
    1.  selectable.ts detects the pointertap
        => sends SIM_INSTANCE_CLICK
    2.  InstanceEditor handles SIM_INSTANCE_CLICK
        => sends NET:INSTANCE_REQUEST_EDIT
    3.  project-data handles NET:INSTANCE_REQUEST_EDIT
        => Sets agent.isSelected
        => raises INSTANCE_EDIT_ENABLE
           InstanceEditor handles INSTANCE_EDIT_ENABLE
           => enables editing if agentId matches
           => disables eidting if agentID doesn't match
              => also rasies NET:INSTANCE_DESELECT
        => raises AGENTS_RENDER
    4.  sim-agents handles AGENTS_RENDER
        => Runs AgentUpdate()
        => Calls RENDERER.Render()

  See https://whimsical.com/selection-call-order-FpmKdWgi4ffz9dsdT84sZa

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';
import { Visual } from 'lib/t-visual';
import { GetAgentById } from 'modules/datacore/dc-agents';

const DBG = false;

export function MakeSelectable(vobj: Visual) {
  function onTap(event) {
    const agent = GetAgentById(vobj.id);
    if (DBG) console.log(`selectable.ts: Tapped on vobj.id ${agent.id}`);
    if (!agent) {
      console.error(
        'selectable: Clicked agent not found!!! This should not happen!'
      );
    } else {
      // vobj.id and dobj.id are the same
      UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId: agent.id });
    }
  }

  const spr = vobj.container;
  spr.interactive = true; // enable interactive events
  spr.on('pointertap', onTap);
}
