/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TrackerObjects are expressed in SimWorld coordinates. They are updated
  by the client-side INPUT module, which takes PTRACK entities and
  transforms their positions into SimWorld coordinates.

  TrackerObjects have a number of flags and settings for interacting in
  the SimWorld.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TrackerMode, TrackType } from 'step/lib/t-ptrack';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of an object provided by PTRACK */
export default class TrackerObject {
  id: any; // copied from EntityObject
  pos: [number, number, number];
  valid: boolean; // set
  isNew: boolean; // set when this is a new trackerobject
  isOutside: boolean; // set if not inside width/depth of room
  mode: TrackerMode; // LERP, JUMP, or SEEK
  type: TrackType; // obj, people, pose, fake
  name: string; // set by object tracks
  constructor(entityID) {
    this.id = entityID;
    this.pos = [0, 0, 0];
    this.valid = false;
    this.isNew = true;
    this.isOutside = false;
    this.mode = TrackerMode.MODE_LERP;
    this.type = TrackType.Undefined;
    this.name = '';
  }
  Position() {}
  IsValid() {}
  IsOutside() {}
  IsInside() {}
  Invalidate() {}
  Validate() {}
  SetId() {}
}
