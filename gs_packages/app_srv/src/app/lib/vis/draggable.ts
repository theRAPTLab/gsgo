/** given a VOBJ, decorate it to add new features */
import { Visual } from 'lib/t-visual';
import { AGENT_GetById } from 'modules/runtime-datacore';

export function MakeDraggable(vobj: Visual) {
  function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    //
    vobj.setCaptive(true);
    this.alpha = 0.5;
    this.tint = 0xff8080;
    //
    const agent = AGENT_GetById(vobj.id);
    if (agent) {
      agent.setModePuppet();
      agent.setCaptive(true);
    }
  }
  function onDragEnd() {
    vobj.setCaptive(false);
    this.alpha = 1;
    this.tint = 0xffffff;
    //
    const agent = AGENT_GetById(vobj.id);
    if (agent) {
      agent.setPreviousMode();
      agent.setCaptive(false);
      console.log(`agent id ${agent.id} '${agent.name()}' dropped`, agent);
      //
      if (this.data) {
        // the originating object is sprite
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
    if (vobj.isCaptive) {
      const { x, y } = this.data.getLocalPosition(this.parent);
      this.x = x;
      this.y = y;
      const agent = AGENT_GetById(vobj.id);
      if (agent) {
        agent.prop('x').value = x;
        agent.prop('y').setTo(y); // alt way of setting
      }
    }
  }
  const spr = vobj.sprite;
  spr.interactive = true; // enable interactive events
  spr.on('mousedown', onDragStart);
  spr.on('mouseup', onDragEnd);
  spr.on('mouseupoutside', onDragEnd);
  spr.on('mousemove', onDragMove);
}
