/** given a VOBJ, decorate it to add new features */
import UR from '@gemstep/ursys/client';
import { Visual } from 'lib/t-visual';
import { GetAgentById } from 'modules/datacore/dc-agents';

export function MakeDraggable(vobj: Visual) {
  let dragStartTime; // Used to differentiate between a click and a drag
  let origX; // Used to restore original position if drag is abandoned
  let origY;

  let offsetX; // Used to calculate click relative to sprite center
  let offsetY;

  function onDragStart(event) {
    dragStartTime = Date.now();
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    //
    const dragStartPos = this.data.getLocalPosition(this.parent);
    offsetX = this.x - dragStartPos.x;
    offsetY = this.y - dragStartPos.y;
    //
    vobj.setCaptive(true);
    this.alpha = 0.5;
    this.tint = 0xff8080;
    //
    const agent = GetAgentById(vobj.id);
    if (agent) {
      agent.setModeDrag();
      agent.setCaptive(true);
      origX = agent.prop.x.value;
      origY = agent.prop.y.value;
    }
  }
  function onDragEnd() {
    const dragStopTime = Date.now();
    // ignore mouseup if we did not receive a mousedown
    // this fixes a problem where dragging one agent and releasing it
    // near another agent causes the two agents to swap positions.
    if (!vobj.isCaptive) return;
    vobj.setCaptive(false);
    this.alpha = 1;
    this.tint = 0xffffff;
    //
    const agent = GetAgentById(vobj.id);
    if (agent) {
      agent.setPreviousMode();
      agent.setCaptive(false);
      console.log(`agent id ${agent.id} '${agent.name}' dropped`, agent);
      //
      if (this.data && dragStopTime - dragStartTime > 150) {
        // Consider it a drag if the mouse was down for > 150 ms
        // the originating object is sprite
        UR.RaiseMessage('DRAG_END', { agent });
      } else {
        // otherwise it's a click, so restore the original position
        agent.prop.x.value = origX;
        agent.prop.y.value = origY;
        // and raise SIM_INSTANCE_CLICK
        // used in place of selectable.ts
        // need to handle this here in draggable to differentiate
        // the mouseup from dragging
        //
        // We specify 'source' so that InstanceEditor knows to ignore the
        // next ClickAwayListener click.
        UR.RaiseMessage('SIM_INSTANCE_CLICK', {
          agentId: agent.id,
          source: 'stage'
        });
      }
    }
    // set the interaction data to null
    this.data = null;
  }
  function onDragMove() {
    if (vobj.isCaptive) {
      const { x, y } = this.data.getLocalPosition(this.parent);
      const newx = x + offsetX;
      const newy = y + offsetY;
      // Don't set x/y here or input agent will get dragged
      // this.x = newx;
      // this.y = newy;
      const agent = GetAgentById(vobj.id);
      if (agent && !agent.isModePuppet()) {
        // don't move if agent is user input
        this.x = newx;
        this.y = newy;

        // NEW METHOD with Movement
        if (agent.hasFeature('Movement')) {
          // If Movement, use queuePosition so that `isMoving` is calcuated
          agent.callFeatMethod('Movement', 'queuePosition', newx, newy);
        } else {
          // If no movement, then set directly
          agent.x = newx;
          agent.y = newy;
        }
      }
    }
  }
  const spr = vobj.container;
  spr.interactive = true; // enable interactive events
  spr.on('mousedown', onDragStart);
  spr.on('mouseup', onDragEnd);
  spr.on('mouseupoutside', onDragEnd);
  spr.on('mousemove', onDragMove);
}
