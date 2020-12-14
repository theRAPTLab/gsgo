/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Client-side subscriber to the PTRACK frame server

  (1) pt.Connect() to establish socket connection
  (2) JSON is received from PTrack TCP Forwarder
  (3) JSON data is processed behind-the-scenes automatically
  (3) pt.GetEntities() returns an array of entities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SyncMap from 'lib/class-syncmap';
import { IFrameStatus } from './t-input.d';
import EntityObject from './class-entity-object';

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

/// GLOBAL FILTER SETTINGS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT = {
  ptRadius: 0.1,
  ptMaxAge: 66,
  ptMinAge: 16
};
let MAX_NOP = 500;
let MIN_AGE = 350;
let MIN_NOP = MIN_AGE / 2;
let SRADIUS = 0.0001;
let CULL_YOUNGLINGS = true;

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class PTrackEndpoint {
  pt_sock: { onmessage?: Function };
  pt_url: string;
  entityDict: Map<string, EntityObject>;
  goodEntities: SyncMap;
  UDPStatus: Map<string, IFrameStatus>;

  constructor() {
    this.pt_sock = {};
    this.pt_url = 'ws://localhost:3030';
    this.goodEntities = new SyncMap({
      Constructor: EntityObject,
      name: 'RawEntityList'
    });
    this.goodEntities.setMapFunctions({
      onAdd: (raw, eo: EntityObject) => {
        eo.copy(raw);
        eo.nop = 0;
        eo.age = 0;
      },
      onUpdate: (raw: EntityObject, eo: EntityObject) => {
        eo.x = raw.x;
        eo.y = raw.y;
      },
      // this is called if an id disappears
      shouldRemove: (eo, seen_eos) => {
        // delete anyone who has not updated in a while
        if (eo.nop > MAX_NOP) return true;
        // delete "of-age" entities with too many nops
        if (eo.age > MIN_AGE && eo.nop > MAX_NOP) return true;
        // delete intermittent pop-in entities
        if (eo.age - eo.nop < MIN_NOP) return true;
        // if clustered close together, cull all but the senior
        if (eo.age < MAX_NOP || CULL_YOUNGLINGS)
          return !m_IsOldestInRadius(eo, seen_eos);
        // otherwise, we need to age
        eo.nop += 66; /* HACK NEED GLOBAL FRAMETIME */
        eo.age += 66;
        // dont remove yet
        return false;
      },
      onRemove: eo => {}
    });
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

  /** return the mapped object */
  GetEntities() {
    return [...this.goodEntities.getMappedObjects()]
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
      let tracks;
      ok = false;
      // detected people //
      if (frame.people_tracks) {
        tracks = frame.people_tracks;
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
        tracks = frame.object_tracks;
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
        tracks = frame.pose_tracks;
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
        tracks = frame.fake_tracks;
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
        tracks = frame.tracks;
        pf_type += TYPES.People;
        pf_entity_count = frame.tracks.length;
        ok = true;
      }
      // if no tracks were found, then error
      if (ok) return tracks;
      throw Error(`frame ${pf_id}/${pf_seq}: no track data`);
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
    let tracks;
    // check for valid id types
    switch (pf_id) {
      case 'world':
        tracks = parseTracks();
        pf_short_id = 'PTrak';
        break;
      case 'faketrack':
        tracks = parseTracks();
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
    let statobj: IFrameStatus = this.UDPStatus.get(dictkey);
    if (statobj === undefined)
      statobj = { lastseq: 0, lastsec: 0, lastnsec: 0, lastcount: 0 };

    // HACK Don't check for out of sequence frames because
    // ptrack frame ids are not unique.

    // save data for this dictkey
    statobj.lastseq = pf_seq;
    statobj.lastsec = pf_seconds;
    statobj.lastnsec = pf_nseconds;
    statobj.lastcount = pf_entity_count;

    // resave "last seen" data in connectStatus
    this.UDPStatus.set(dictkey, statobj);

    // process entities in track into to the 'entity dictionary'
    // that's used by INPUT managers
    // .. see if raw.id exists in entityDict
    // .. if not, create new object with nop 0
    // .. if exist, update object
    const entities = [];
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
        pf_type === TYPES.Pose &&
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
      raw.id = pf_type + raw.id; // attach type to guarantee unique id

      // MUTATE x to fixed precision
      // MUTATE is OK because the raw track is thrown away every frame
      raw.x = raw.x.toFixed(PRECISION);
      raw.y = raw.y.toFixed(PRECISION);
      // raw.isFaketrack = raw.isFaketrack;`
      // add additional properties that are in an EntityObject
      // based on other parameters
      raw.type = pf_type;
      raw.name = raw.object_name;
      raw.pose = raw.predicted_pose_name;
      // add aging elements
      raw.age = 0;
      raw.nop = 0;

      // SAVE RAW ENTITY TO LIST
      entities.push(raw);

      // SPECIAL OBJECT HANDLING
      if (pf_type === TYPES.Object) {
        // raw.object_name, raw.confidence available
      }

      // SPECIAL POSE HANDLING
      if (pf_type === TYPES.Pose) {
        // copy name over for display purposes in tracker utility
        raw.name = raw.predicted_pose_name;
        // x,y from poses is set from the CHEST joint
        // .. make sure the joints exist
        // raw.joints = raw.joints;
        raw.x = raw.joints.CHEST.x;
        raw.y = raw.joints.CHEST.y;
        // orientation
        // raw.orientation = raw.orientation; // in radians
      }

      /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
        HISTORICAL NOTE FROM PLAE

        According to Marco, any data that has a NaN CHEST coordinate should be
        rejected. but sometimes PTrack does include it.

        See the PLAE source code for the original commented-out code.
      :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
    }); // tracks.forEach

    // we have cleaned-up data in the entityDict map
    // console.log(this.entityDict.get('ft-ff0').x);
    this.goodEntities.syncFromArray(entities);
    this.goodEntities.mapObjects();
    console.log(this.goodEntities.getMappedIds());
  }

  /// TRACKER ENTITY FILTERING PARAMETERS ///////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// WARNING this is a GLOBAL SETTING for ALL PTRACK INSTANCES
  UpdateFilterSettings() {
    // 	needs update to use Settings
    MAX_NOP = DEFAULT.ptMaxAge;
    MIN_AGE = DEFAULT.ptMinAge;
    SRADIUS = DEFAULT.ptRadius;
    MIN_NOP = MIN_AGE / 2;
    console.log('SET PTRACK DEFAULT VALUES', MAX_NOP, MIN_AGE, SRADIUS);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetFilterTimeout(nop) {
    if (nop === undefined) return;
    if (nop < MIN_AGE) {
      console.warn('Timeout', nop, "can't be less than Age Threshold", MIN_AGE);
      return;
    }
    MAX_NOP = nop;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetFilterAgeThreshold(age) {
    if (age === undefined) return;
    if (age > MAX_NOP) {
      console.warn('Age', age, "can't be greater than tout1", MAX_NOP);
      return;
    }
    MIN_AGE = age;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetFilterFreshnessThreshold(threshold) {
    if (threshold === undefined) return;
    if (threshold > MIN_AGE / 2) {
      console.log(
        'Threshold',
        threshold,
        'should be lower compared to AgeThreshold'
      );
    }
    MIN_NOP = threshold;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetFilterRadius(rad) {
    if (rad === undefined) return;
    if (Number.isNaN(rad)) {
      console.warn('SetFilterRadius expects a number, not', rad);
      return;
    }
    SRADIUS = rad;
  }
} // end class

/// HELPER FUNCTIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** entity is checked against other entities in idsActive
 *  it's assumed that idsActive does NOT contain entity
 */
function m_IsOldestInRadius(entity, seenMap) {
  let rad2 = SRADIUS * SRADIUS;
  let result = true;
  let x2;
  let y2;
  seenMap.forEach((k, c) => {
    if (c === entity) return;
    x2 = (c.x - entity.x) ** 2;
    y2 = (c.y - entity.y) ** 2;
    // is point outside of circle? continue
    const out = x2 + y2 >= rad2;
    if (out) return;
    // otherwise we're inside, so check if older
    if (entity.age < c.age) {
      result = false;
      // merge position with baddies
      c.x = (c.x + entity.x) / 2;
      c.y = (c.y + entity.y) / 2;
    }
  });
  return result;
}

/// ENTITY HELPERS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Convert entity coordinates to gameworld gameworld coordinates.
 *  entity: { id, x, y, h, nop } - tracker coords
 *  trackerObject: { id, pos, valid } - game coords
 */
function m_TransformAndUpdate(entity) {
  // tracker space position
  let x = entity.x;
  let y = entity.y;
  let z = entity.h;

  console.log('entity', ...entity);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see export of default class above
