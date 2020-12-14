/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  We have two kinds of inputs currently:
  * PTRACK - EntityObjects contain converted PTrack JSON data
  * USER - InputObjects contain input events received from the net

  EntityObjects are a special legacy data structure based on the requirements
  of PTRACK.

  InputObjects are new in GEMSTEP, and are the abstraction of various kinds
  of input events we expect to see across the system.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE 1 LEGACY PTRACK INPUT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** JSON format of incoming PTRACK frame packet. There is one track per packet
 */
export enum ETrackType {
  Undefined = '?',
  object = 'ob',
  people_tracks = 'pp',
  Pose = 'po',
  Faketrack = 'ft'
}
/** data that can be inside of a PTRACK track list.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface ITrackerData {
  id: any; // ptrack entity id
  type: any; // ptrack subtype
  x: number; // ptrack raw x
  y: number; // ptrack raw y
  h: number; // ptrack raw height
  name?: string; // set by object tracks only
  pose?: string; // set by pose tracks only
  joints?: object; // set by pose tracks only
  orientation?: number;
  isFaketrack?: boolean; // set by faketrack only
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IFrameStatus {
  lastseq: number;
  lastsec: number;
  lastnsec: number;
  lastcount: number;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by people_tracks */
export interface IPoseJoint {
  // to be documented
}

/// TYPE 2 USER INPUTS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** base input object */
export interface IIOStream {
  id: any; // used to identify events related to the same stream
  sourceAddr: () => string; // the source UADDR of this IIOStream
  init: (id?: any) => void; // reset the input object
  type: () => string; // the type of input (ptrack, continuous, trigger, etc)
  event: () => IIOEvent; // return the state of this input event
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** kinds of inputs supported by the system*/
export enum EIOType {
  PTRACK = 'PT',
  CONTINUOUS = 'CT', // continuous value
  TRIGGER = 'TR',
  PRESS = 'PR'
}
export interface IIOEvent {
  timestamp: () => number; // return the timestamp of this event
  event_id: any; // unique event_id
}
