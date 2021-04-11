/** given a VOBJ, decorate it to add new features */
import UR from '@gemstep/ursys/client';
import { Visual } from 'lib/t-visual';
import { GetAgentById } from 'modules/datacore/dc-agents';

export function MakeHoverable(vobj: Visual) {
  function onPointerOver(event) {
    const agent = GetAgentById(vobj.id);
    if (!agent) {
      console.error(
        'hoverable: Hovered agent not found!!! This should not happen!'
      );
    } else {
      UR.RaiseMessage('SIM_INSTANCE_HOVEROVER', { agentId: agent.id });
    }
  }

  function onPointerOut(event) {
    const agent = GetAgentById(vobj.id);
    if (!agent) {
      console.error(
        'hoverable: Hovered agent not found!!! This should not happen!'
      );
    } else {
      UR.RaiseMessage('SIM_INSTANCE_HOVEROUT', { agentId: agent.id });
    }
  }

  const spr = vobj.container;
  spr.interactive = true; // enable interactive events
  spr.on('pointerover', onPointerOver);
  spr.on('pointerout', onPointerOut);
}
