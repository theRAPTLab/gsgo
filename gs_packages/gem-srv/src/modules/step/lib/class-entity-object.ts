/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PTrack EntityObjects are a type of legacy input

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// uses types from t-pool
import { ITrackerData } from './t-input';

/** A storage class for PTrack Entities. This is a legacy
 *  input type that has its own semantics versus
 *  IInputObject.
 */
export default class EntityObject implements IPoolable, ITrackerData {
  id: any; // ptrack entity id
  _pool_id: any;
  valid: boolean;
  type: any;
  x: number; // ptrack raw x
  y: number; // ptrack raw y
  h: number; // ptrack raw height
  name?: string; // set by object tracks only
  pose?: string; // set by pose tracks only
  joints?: object;
  orientation?: number;
  isFaketrack?: boolean; // set by faketrack only
  isPozyx?: boolean; // set by pozyx only
  acc?: number[]; // accelerometer on wearable pozyx

  // added by entity aging algorithm
  nop?: number; // how many frames this id NOT updated
  age?: number; // how many frames this id has existed

  constructor(id?: number) {
    this.init(id);
  }

  init(id?: number) {
    this.id = id;
    this.valid = false;
  }

  copy(obj) {
    this.id = obj.id;
    this.type = obj.type;
    this.x = obj.x;
    this.y = obj.y;
    this.h = obj.h;
    this.name = obj.name;
    this.pose = obj.pose;
    this.joints = obj.joints;
    this.orientation = obj.orientation;
    this.isFaketrack = obj.isFaketrack;
    this.isPozyx = obj.isPozyx;
    this.acc = obj.acc;
    // don't touch these
    // this.age = obj.age;
  }

  validate(flag: boolean) {
    this.valid = flag;
  }

  isValid(): boolean {
    return this.valid;
  }

  dispose() {}
}
