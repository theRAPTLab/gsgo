/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  stub class for tracker pieces, which don't exist in the new system

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { Vec3 } from './t-tracking';
import { TrackerMode, TrackType } from './t-ptrack';
import TrackerObject from './class-tracker-object';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of an object provided by PTRACK */
export default class TrackerPiece {
  trackerobj: TrackerObject;
  id: any;
  pos: Vec3;
  valid: boolean;
  isNew: boolean;
  isOutside: boolean;
  mode: TrackerMode;
  type: TrackType;
  name: string;

  constructor(entityID: any) {
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
