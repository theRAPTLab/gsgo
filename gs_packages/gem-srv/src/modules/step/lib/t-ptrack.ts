/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Frames raw PTrack JSON converted into Javascript
  EntityObjects are the processed Frames

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable } from 'lib/t-pool.d';

export interface Frame {
  header: {
    frame_id: number;
    seq: number;
    stamp: {
      sec: number;
      nsec: number;
    };
    people_tracks?: EntityObject[];
    pose_tracks?: EntityObject[];
    fake_tracks?: EntityObject[];
    object_tracks?: EntityObject[];
    tracks: EntityObject[];
  };
}

export interface IPoseJoint {
  // to be documented
}

/** a storage class */
export class EntityObject implements IPoolable {
  id: any; // ptrack entity id
  _pool_id: any;
  valid: boolean;
  type: string;
  x: number; // ptrack raw x
  y: number; // ptrack raw y
  h: number; // ptrack raw height
  name?: string; // set by object tracks only
  pose?: string; // set by pose tracks only
  joints?: object;
  orientation?: number;
  isFaketrack?: boolean; // set by faketrack only
  // added by MapEntities
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
    this.nop = obj.nop;
    this.age = obj.age;
  }

  validate(flag: boolean) {
    this.valid = flag;
  }

  isValid(): boolean {
    return this.valid;
  }

  dispose() {}
}

export class FrameStatus {
  lastseq: number;
  lastsec: number;
  lastnsec: number;
  lastcount: number;
  init() {
    this.lastseq = 0;
    this.lastsec = 0;
    this.lastnsec = 0;
    this.lastcount = 0;
  }
}

export enum TrackType {
  Undefined = '?',
  object = 'ob',
  people_tracks = 'pp',
  Pose = 'po',
  Faketrack = 'ft'
}

export enum TrackerMode {
  MODE_JUMP = 1,
  MODE_LERP,
  MODE_SEEK
}
