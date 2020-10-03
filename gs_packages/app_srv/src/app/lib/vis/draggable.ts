/** given a VOBJ, decorate it to add new features */
import { Visual } from 'lib/t-visual';
import { AGENT_GetById } from 'modules/runtime-datacore';

export function MakeDraggable(vobj: Visual) {
  function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
    this.tint = 0xff0000;
  }
  function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    const agent = AGENT_GetById(vobj.id);
    if (agent) {
      console.log(`agent id ${agent.id} '${agent.name()}' dropped`, agent);
      this.tint = 0x00ff00;
      if (this.data) {
        const newPosition = this.data.getLocalPosition(this.parent);
        const { x, y } = newPosition;
        agent.prop('x').value = x;
        agent.prop('y').setTo(y);
      }
    }
    // set the interaction data to null
    this.data = null;
  }
  function onDragMove() {
    if (this.dragging) {
      const agent = AGENT_GetById(vobj.id);
      const newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x;
      this.y = newPosition.y;
      agent.prop('x').value = this.x;
      agent.prop('y').setTo(this.y);
    }
  }
  const spr = vobj.sprite;
  spr.interactive = true;
  spr.on('mousedown', onDragStart);
  spr.on('mouseup', onDragEnd);
  spr.on('mouseupoutside', onDragEnd);
  spr.on('mousemove', onDragMove);
}
