/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Frames raw PTrack JSON converted into Javascript
  EntityObjects are the processed Frames

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

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

export interface EntityObject {
  type: TrackType; // default is people
  id: any; // ptrack entity id
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
}

export interface FrameStatus {
  lastseq: number;
  lastsec: number;
  lastnsec: number;
  lastcount: number;
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
