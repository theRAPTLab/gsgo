/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TrackerObjects store transformed PTRACK entities. They are updated by the
  client-side INPUT module, which takes PTRACK entities and transforms their
  positions into SimWorld coordinates.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable } from 'lib/t-pool';
import { TrackerMode, TrackType } from './t-input';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of an object provided by PTRACK */
export default class TrackerObject implements IPoolable {
  _pool_id: any;
  id: any; // copied from EntityObject
  pos: number[]; // vector3
  mode: TrackerMode; // LERP, JUMP, or SEEK
  type: TrackType; // obj, people, pose, fake
  name: string; // set by object tracks
  is_valid: boolean;
  is_new: boolean; // set when this is a new trackerobject
  is_outside: boolean; // set if not inside width/depth of room

  constructor(entityID: any) {
    this.name = '';
    this.id = entityID;
    this.pos = [0, 0, 0];
    this.is_valid = false;
    this.is_new = true;

    this.is_outside = false;
    this.mode = TrackerMode.MODE_LERP;
    this.type = TrackType.Undefined;
  }

  /// POOLABLE ////////////////////////////////////////////////////////////////
  init() {}
  validate() {}
  dispose() {}
  isValid() {
    return true;
  }

  /// TRACKER /////////////////////////////////////////////////////////////////
  Position() {}
  IsValid() {}
  IsOutside() {}
  IsInside() {}
  Invalidate() {}
  Validate() {}
  SetId() {}
}
