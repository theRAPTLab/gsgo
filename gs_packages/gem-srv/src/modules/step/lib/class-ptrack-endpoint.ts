/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Client-side subscriber to the PTRACK frame server

  (1) pt.Connect() to establish socket connection
  (2) JSON is received from PTrack TCP Forwarder
  (3) JSON data is processed behind-the-scenes automatically
  (3) pt.GetEntities() returns an array of entities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { EntityObject, FrameStatus } from './t-ptrack';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PTRAK');
const TYPES = {
  Undefined: '?',
  Object: 'ob',
  People: 'pp',
  Pose: 'po',
  Faketrack: 'ft'
};
const PRECISION = 4;

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class PTrackEndpoint {
  pt_sock: { onmessage?: Function };
  pt_url: string;
  entityDict: Map<string, EntityObject>;
  UDPStatus: Map<string, FrameStatus>;

  constructor() {
    this.pt_sock = {};
    this.pt_url = 'ws://localhost:3030';
    this.entityDict = new Map();
    // 2.0 infer the connection status of PTRACK with our system
    this.UDPStatus = new Map();
  }

  Connect(ptrackHost: string = document.domain) {
    this.pt_url = `ws://${ptrackHost}:3030`;
    if (this.pt_sock instanceof WebSocket) {
      console.log(...PR('dropping old socket connection'));
      this.pt_sock.close();
    }
    this.pt_sock = new WebSocket(this.pt_url);
    this.pt_sock.onmessage = event => {
      this.ProcessFrame(event.data); // new routine
    };
  }

  /** return an array of raw entity objects */
  GetCachedEntities() {
    return [...this.entityDict.values()];
  }

  /** issue this after each GetCachedEntities() call to flush
   *  the dictionary
   */
  ClearCachedEntities() {
    this.entityDict.clear();
  }

  /// PROCESS FRAME /////////////////////////////////////////////////////////////
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    This is an enormous block of code ported as-is from PLAE, with minor
    fixes to syntax. It is the last method of this class, and it contains
    two internal functions parseTracks() and isBadData() that depend on the
    local variables declared therein
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  ProcessFrame(frameData: string) {
    // these variables are predeclared to minimize creating new
    let frame;
    // frame.header: { seq: stamp:{sec: nsec:} pf_id: }
    // frame.people_tracks: [ { id: x: y: height: } ... ]
    let pf_type;
    let pf_seq;
    let pf_seconds;
    let pf_nseconds;
    let pf_short_id;
    let pf_id;
    let pf_entity_count;
    let ok = false;

    /// HELPER FUNCTIONS //////////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// this is used in the switch statement below!
    function parseTracks() {
      ok = false;
      // detected people //
      if (frame.people_tracks) {
        pf_type += TYPES.People;
        pf_entity_count = frame.people_tracks.length;
        ok = true;
      }
      // detected objects (can not co-exist with people_tracks) //
      if (frame.object_tracks) {
        if (pf_type)
          throw Error(
            `both people and objects defined in same ptrack world frame seq# ${pf_seq}`
          );
        pf_type += TYPES.Object;
        pf_entity_count = frame.object_tracks.length;
        ok = true;
      }
      // detected pose data //
      if (frame.pose_tracks) {
        if (pf_type)
          throw Error(
            `both pose and people or objects defined in same ptrack world frame seq# ${pf_seq}`
          );
        pf_type += TYPES.Pose;
        pf_entity_count = frame.pose_tracks.length;
        ok = true;
      }
      // detected ptrack simulated data //
      if (frame.fake_tracks) {
        if (pf_type)
          throw Error(
            `both pose and people or objects and fake_tracks defined in same ptrack world frame seq# ${pf_seq}`
          );
        pf_type += TYPES.Faketrack;
        pf_entity_count = frame.fake_tracks.length;
        ok = true;
      }
      // detected old PTRACK format //
      if (frame.tracks) {
        if (pf_type)
          throw Error(
            `both original 14.04 ptrack people and new 16.04+ people defined in same ptrack world frame seq# ${pf_seq}`
          );
        pf_type += TYPES.People;
        pf_entity_count = frame.tracks.length;
        ok = true;
      }
      // if no tracks were found, then error
      if (!ok) throw Error(`frame ${pf_id}/${pf_seq}: no track data`);
    }

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// this is used in the for loop to reject bad data
    function hasBadData(raw) {
      let isGood = true;
      if (raw.orientation !== undefined) {
        isGood = isGood && typeof raw.orientation === 'number';
      }
      if (raw.x !== undefined) {
        isGood = isGood && typeof raw.x === 'number';
      }
      if (raw.y !== undefined) {
        isGood = isGood && typeof raw.y === 'number';
      }
      return !isGood;
    }

    /// START PROCESSING FRAME ////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// (1) Get packet and verify its structure
    try {
      frame = JSON.parse(frameData);
    } catch (e) {
      console.log('*** PROCESS FRAME Bad JSON', e);
    }
    // check for valid header
    if (!frame.header === undefined) throw new Error('missing ptrack header');
    if (!frame.header.seq === undefined) throw Error('missing ptrack header.seq');
    if (!frame.header.stamp === undefined) throw Error('missing header.stamp');
    if (!frame.header.frame_id) throw Error('missing header.frame_id');
    pf_seq = frame.header.seq;
    pf_seconds = frame.header.stamp.sec;
    pf_nseconds = frame.header.stamp.nsec;
    pf_id = frame.header.frame_id;

    // world frames can contain EITHER people or objects, so have to detect
    // this difference to determine how to save in this.UDPStatus dictionary
    pf_type = '';

    // check for valid id types
    switch (pf_id) {
      case 'world':
        parseTracks();
        pf_short_id = 'PTrak';
        break;
      case 'faketrack':
        parseTracks();
        pf_short_id = 'FTrak';
        break;
      case 'heartbeat':
        if (!frame.alive_IDs) throw Error('missing alive_IDs in heartbeat frame');
        pf_entity_count = frame.alive_IDs.length;
        pf_short_id = 'Hbeat';
        break;
      default:
        throw Error(`unknown id type [${pf_id}]`);
    }

    // check for faketrack 'fake_id' to modify pf_type
    pf_type += frame.fake_id ? `-${frame.fake_id}` : '';

    // save "last seen" data in connectStatus dictionary
    // this is used to display data about different tracks being received
    // key by pf_type, value = { lastseq, lastsec, lastnsec, lastcount }
    let dictkey = `${pf_short_id}-${pf_type}`;
    let statobj: FrameStatus = this.UDPStatus.get(dictkey) || new FrameStatus();

    // HACK Don't check for out of sequence frames because
    // ptrack frame ids are not unique.

    // save data for this dictkey
    statobj.lastseq = pf_seq;
    statobj.lastsec = pf_seconds;
    statobj.lastnsec = pf_nseconds;
    statobj.lastcount = pf_entity_count;

    // resave "last seen" data in connectStatus
    this.UDPStatus.set(dictkey, statobj);

    // (2) process track data
    // REMAP says that it's UNLIKELY that there will be a packet
    // with BOTH object_tracks and people_tracks
    let tracks;
    let trackType;

    // are there object or people tracks?
    if (frame.object_tracks && frame.object_tracks.length > 0) {
      tracks = frame.object_tracks;
      trackType = TYPES.Object;
    } else if (frame.people_tracks && frame.people_tracks.length > 0) {
      tracks = frame.people_tracks;
      trackType = TYPES.People;
    } else if (frame.pose_tracks && frame.pose_tracks.length > 0) {
      tracks = frame.pose_tracks;
      trackType = TYPES.Pose;
    } else if (frame.fake_tracks && frame.fake_tracks.length > 0) {
      tracks = frame.fake_tracks;
      trackType = TYPES.Faketrack;
    } else if (frame.tracks && frame.tracks.length > 0) {
      // support for original 14.04 ptrack data format, ca PLAE spring 2017 study (pre-pose, pre-props)
      tracks = frame.tracks;
      trackType = TYPES.People;
    } else {
      // no tracks
      return;
    }

    // process entities in track into to the 'entity dictionary'
    // that's used by INPUT managers
    // .. see if raw.id exists in entityDict
    // .. if not, create new object with nop 0
    // .. if exist, update object
    tracks.forEach(raw => {
      // ABORT ON BAD DATA (but don't crash)
      if (hasBadData(raw)) return;

      // VALIDATE POSE CHECKING
      // If the track is pose data and joints or chests are malformed, we can
      // end up with NaN x and y.
      //
      // So we avoid updating the entityDict if the data appears malformed. This
      // should probably be put in the hasBadData function.
      if (
        trackType === TYPES.Pose &&
        (raw.joints === undefined ||
          raw.joints.CHEST === undefined ||
          raw.joints.CHEST.x === undefined ||
          typeof raw.joints.CHEST.x !== 'number' ||
          raw.joints.CHEST.y === undefined ||
          typeof raw.joints.CHEST.y !== 'number')
      ) {
        return;
      }

      // CALCULATE KEY INTO ENTITY DICT
      raw.id = trackType + raw.id; // attach type to guarantee unique id

      // UPDATE/ADD RAW ENTITY TO DICT
      let ent = this.entityDict.get(raw.id);
      if (ent) {
        ent.id = raw.id;
        ent.x = raw.x.toFixed(PRECISION);
        ent.y = raw.y.toFixed(PRECISION);
        ent.h = raw.height.toFixed(PRECISION);
        // ent.age; // don't reset this to zero!
        ent.nop = 0; // new frame, so reset no-op timer
        // version 1.0 extensions
        ent.isFaketrack = raw.isFaketrack; // faketrack tracks only, otherwise undefined
        // version 2.0 extensions
        ent.name = raw.object_name; // object tracks only, otherwise undefined
        ent.pose = raw.predicted_pose_name; // pose tracks only, otherwise undefined
      } else {
        ent = new EntityObject();
        ent.copy({
          id: raw.id,
          x: raw.x.toFixed(PRECISION),
          y: raw.y.toFixed(PRECISION),
          h: raw.height.toFixed(PRECISION),
          age: 0,
          nop: 0,
          type: trackType,
          name: raw.object_name, // object tracks only, otherwise undefined
          pose: raw.predicted_pose_name, // pose tracks only, otherwise undefined
          isFaketrack: raw.isFaketrack // faketrack tracks only, otherwise undefined
        });
        this.entityDict.set(raw.id, ent);
      }

      // SPECIAL OBJECT HANDLING
      if (trackType === TYPES.Object) {
        // raw.object_name, raw.confidence available
      }

      // SPECIAL POSE HANDLING
      if (trackType === TYPES.Pose) {
        // copy name over for display purposes in tracker utility
        ent.name = raw.predicted_pose_name;
        // x,y from poses is set from the CHEST joint
        // .. make sure the joints exist
        ent.joints = raw.joints;
        ent.x = raw.joints.CHEST.x;
        ent.y = raw.joints.CHEST.y;
        // orientation
        ent.orientation = raw.orientation; // in radians
      }

      /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
        According to Marco, any data that has a NaN CHEST coordinate should be
        rejected. but sometimes PTrack does

        For some reason though, only "orientation" is being set to NaN, and the
        CHEST data is being passed as 0.  So we check "orientation" instead.

        Also, orientation is sending a string "nan" instead of NaN, so we
        explicitly check for the string.

        VESTIGIAL CODE BELOW

        if (raw.orientation === 'nan') {
          // delete entity from dict
        }
        if (Number.isNaN(raw.joints.CHEST.x) || Number.isNaN(raw.joints.CHEST.y)) {
          // delete entity from dict
        }
        if (raw.joints.CHEST.x && typeof raw.joints.CHEST.x === 'number') {
          ent.x = raw.joints.CHEST.x;
          ent.y = raw.joints.CHEST.y;
        }
      :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
    }); // tracks.forEach
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see export of default class above
