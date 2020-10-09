/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-self-assign */
/* eslint-disable no-continue */
/* eslint-disable no-lonely-if */
/* eslint-disable new-cap */
/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable func-names */
/* eslint-disable import/no-mutable-exports */
// TrackerObject
// PTRACK
// TrackerPiece

const SYSLOOP = {}; // MOCK
const XSETTINGS = {}; // MOCK
const UISTATE = {}; // MOCK
const $ = {}; // MOCK
const TrackerPiece = () => {}; // MOCK
const TrackerObject = () => {}; // MOCK
const PTRACK = {}; // MOCK
const THREE = {}; // MOCK

let DBGOUT = false;
let DBGEDGE = false;

///////////////////////////////////////////////////////////////////////////////
/**	HOW INPUT WORKS **********************************************************\

  INPUT is the home of all inputs into InqSim. Its primary purpose is to
  handle the OpenPTrack "tracks" of position data from kids tracked in the
  "physical world". It applies a transformation from physical space to
  "game world" coordinates. In the future, this module may handle additional
  data types.

  PTRACK CONNECTION AND MAPPING
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  InitializeConnection (token, serverAddress )
  -
  InitializeTrackerPiecePool ({ count: cstrFunc: initFunc })
  UpdateTrackerPieces ( ms, createFunc )
  GetValidTrackerPieces ()

  LOCATION USER INTERFACE BINDING
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  BindLocationUI ( viewmodel )


  SET LOCATION (PTRACK) AND GAME WORLD TRANSFORMS
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetLocationTransform ( locationObj )
  SetWorldTransform ( dimObj )

  NOISE REJECTION PARAMETERS & RAW DATA ACCESS
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  UpdateFilterSettings ()
  SetFilterTimeout ( nop )
  SetFilterAgeThreshold ( age )
  SetFilterFreshnessThreshold ( threshold )
  SetFilterRadius ( rad )
  -
  MapEntities ( pieceDict, intervalMS )
  PTrackEntityDict ()

  INPUT SAVING AND PLAYBACK
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SelectReplayFile ( filename )
  ReplayTrackerData ( filename )


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE DECLARATIONS *****************************************************/

// maintain list of all connected input submodules
// contents of m_input_modules are descriptor objects
let m_input_modules = []; // stack of registered input modules

// piece management utilities
let m_inputs = []; // activity-wide tracker piece pool
let m_pieces = []; // valid tracker pieces

// master object for location transform properties
let m_transform = {};
// master object for webrtc address
let m_webrtc = {};

// module flags
let _enable_ui_handlers = null; // control event handler processing
let m_location_subscribers = [];

// HTML element used for updating debug info
// defined in input-transform.html subview
let ui_udp_status;
let ui_ptrack_entities;
let ui_xformed_entities;

// input filtering parameters
let MAX_NOP = 500;
let MIN_AGE = 350;
let MIN_NOP = MIN_AGE / 2;
let SRADIUS = 0.0001;

// active timer instance, if any
let m_AutoSave = null;
let m_saved_vm = null;

// pool creation parameters
let m_pool_parm = null;

///////////////////////////////////////////////////////////////////////////////
/**	PUBLIC API DEFINITION ****************************************************/

let API = SYSLOOP.New('Input');

/// TRANSFORM VALUES DATA BIND ////////////////////////////////////////////////
/*/
    (1) When the location_id changes, INPUT has to respond by loading the
    location object and sending transforma data back to the UI to display.
    (2) When the transform changes in the UI, we want to update that too.
    (3) On startup, we send the entire location object (including location_id)
    to the UI
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ (1) handle UI change of location dropdown
/*/ API.HandleUILocationChange = function (
  prop,
  loc_id
) {
  if (prop !== 'location_id')
    throw Error('location_id handler got incorrect property');
  API.ChangeLocation(loc_id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ (2) Call this whenever there is a UI update to update values.
/*/ API.HandleUIXFormChange = function (
  prop,
  val
) {
  if (!_enable_ui_handlers) {
    console.log('INPUT.HandleChangedUI ui not enabled');
    return;
  }
  if (DBGOUT)
    console.log('INPUT.HandleChangedUI received', prop.squote(), ':', val);
  switch (prop) {
    case 'sx':
      m_transform.sx = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'sy':
      m_transform.sy = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'sz':
      m_transform.sz = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'rx':
      m_transform.rx = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'ry':
      m_transform.ry = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'rz':
      m_transform.rz = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'tx':
      m_transform.tx = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'ty':
      m_transform.ty = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'tz':
      m_transform.tz = val;
      m_UpdateLocationTransform();
      m_TimedAutoSave();
      break;
    case 'width':
      m_transform.width = parseFloat(val);
      m_transform.t_width = m_transform.width;
      m_transform.t_halfwidth = m_transform.t_width / 2;
      m_TimedAutoSave();
      break;
    case 'depth':
      m_transform.depth = parseFloat(val);
      m_transform.t_depth = m_transform.width;
      m_transform.t_halfdepth = m_transform.t_width / 2;
      m_TimedAutoSave();
      break;
    case 'webrtc_ip':
      m_webrtc.ip = val;
      m_TimedAutoSave();
      break;
    case 'webrtc_port':
      // eslint-disable-next-line radix
      m_webrtc.port = parseInt(val);
      m_TimedAutoSave();
      break;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle Location change. Does not set location_id again to avoid loop.
/*/ API.ChangeLocation = function (
  locId
) {
  locId = locId || XSETTINGS.CurrentLocationId();
  let lobj = XSETTINGS.SelectLocation(locId);
  API.SetLocationTransform(lobj);
  // inform subscribers to INPUT location changes
  m_UpdateLocationSubscribers(lobj);
  m_UpdateUIXformState(lobj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ for subscribers to changes in location state change
/*/ API.AddLocationListener = function (
  subFunc
) {
  if (typeof subFunc === 'function') m_location_subscribers.push(subFunc);
  else throw Error('LocationSubscribe() expects a function');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Add change handlers for Knockout databound fields, so when a UI element
  in the location changes transforms are updated and saved to cache
/*/ API.UI_EnableProcessing = function () {
  // these elements are now valid
  ui_udp_status = $('#ui-ptrack-udp-status');
  ui_ptrack_entities = $('#ui-ptrack-entities');
  ui_xformed_entities = $('#ui-transformed-entities');
  // initialize ui handle blocking handlers
  if (_enable_ui_handlers === null) {
    _enable_ui_handlers = true;
  } else {
    console.warn('EnableUIProcessing() was called unnecessarily again');
  }
  // hook into UISTATE
  API.HandleUILocationChange.name = 'HandleUILocationChange';
  API.HandleUIXFormChange.name = 'HandleUIXFormChange';
  UISTATE.AddPropListener(API, 'location_id', API.HandleUILocationChange);
  let transprops = [
    'sx',
    'sy',
    'sz',
    'rx',
    'ry',
    'rz',
    'tx',
    'ty',
    'tz',
    'width',
    'depth',
    'webrtc_ip',
    'webrtc_port'
  ];
  for (let i = 0; i < transprops.length; i++) {
    UISTATE.AddPropListener(API, transprops[i], API.HandleUIXFormChange);
  }
  // one-time update of location_id
  // because INPUT.ChangeLocation() does not update this value
  let loc_id = XSETTINGS.CurrentLocationId();
  UISTATE.SetProp(API, 'location_id', loc_id);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by m_TimedAutoSave() and also by ChangeLocation()
/*/ function m_UpdateLocationSubscribers(
  lobj
) {
  for (let i = 0; i < m_location_subscribers.length; i++) {
    m_location_subscribers[i](lobj);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by ChangeLocation() to send transform state back to UI,
    which doesn't include location_id
/*/ function m_UpdateUIXformState(
  lobj
) {
  let state = {};
  if (lobj.sx !== undefined) state.sx = lobj.sx;
  if (lobj.sy !== undefined) state.sy = lobj.sy;
  if (lobj.sz !== undefined) state.sz = lobj.sz;
  if (lobj.rx !== undefined) state.rx = lobj.rx;
  if (lobj.ry !== undefined) state.ry = lobj.ry;
  if (lobj.rz !== undefined) state.rz = lobj.rz;
  if (lobj.tx !== undefined) state.tx = lobj.tx;
  if (lobj.ty !== undefined) state.ty = lobj.ty;
  if (lobj.tz !== undefined) state.tz = lobj.tz;
  if (lobj.width !== undefined) state.width = lobj.width;
  if (lobj.depth !== undefined) state.depth = lobj.depth;
  if (lobj.webrtc_ip !== undefined) state.webrtc_ip = lobj.webrtc_ip;
  if (lobj.webrtc_port !== undefined) state.webrtc_port = lobj.webrtc_port;
  UISTATE.Set(API, state);
}

/// AUTOSAVETIMOUT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Attempt to autosave once despite multiple updates. This happens because
  loading location data triggers multiple subscription events, so we wait
  a bit before triggering a single save.
/*/ function m_TimedAutoSave() {
  if (m_AutoSave) {
    clearTimeout(m_AutoSave);
  }
  m_AutoSave = setTimeout(function () {
    // update S.cached location object
    // console.log("m_TimedAutoSave");
    let lobj = XSETTINGS.CurrentLocationObj();
    // note that lobj is a reference to the location obj
    // so this magic copy will update the xsettings data
    // before StepCacheSave() executes. I think.
    m_MagicCopyLocationProps(m_transform, lobj);
    // also copy webrtc
    lobj.webrtc_ip = m_webrtc.ip;
    lobj.webrtc_port = m_webrtc.port;
    XSETTINGS.StepCacheSave();
    // inform subscribers
    m_UpdateLocationSubscribers(lobj);
    // done!
    m_AutoSave = null;
  }, 250);
}

/// SIMPLIFIED TRACKER INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Resize the input pool for tracker objects, if needed. Pass createFunc
  to receive a piece to further initialize as needed.
/*/ API.InitializeTrackerPiecePool = function (
  parm
) {
  if (typeof parm !== 'object')
    throw Error('InitializeTrackerPiecePool: must pass parameter object');
  parm.count = parm.count || 5;
  parm.cstrFunc = parm.cstrFunc || TrackerPiece;
  if (typeof parm.cstrFunc !== 'function')
    throw Error(
      `InitializeTrackerPiecePool: parm.cstrFunc not constructor:${parm.cstrFunc}`
    );

  let cstrFunc = parm.cstrFunc;
  let initFunc = parm.initFunc;
  let count = parm.count;
  // save parameters for use by UpdateTrackerPieces()
  m_pool_parm = parm;

  let num = count - m_inputs.length;
  if (num > 0) {
    console.group('INPUT creating', num, 'TrackerPieces');
    for (let i = 0; i < num; i++) {
      let p = new cstrFunc(`input${m_inputs.length}`);
      if (initFunc && typeof initFunc === 'function') {
        initFunc.call(this, p);
      }
      m_inputs.push(p);
    }
    console.groupEnd();
  } else {
    console.log('TrackerPoolSize is already >', count);
  }
  return m_inputs;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ MAIN ROUTINE for handling entity mapping to pieces.
  m_inputs    List of pieces that are assigned TrackerObjects
        by INPUT.MapEntities(). This is a pool of pieces used
        for TrackerObject mapping.
  m_pieces    List of pieces that the player considers "active",
        constructed every frame by scanning the list of valid
        pieces in m_inputs. When writing player logic, you should
        be using m_pieces, not m_inputs
/*/ API.UpdateTrackerPieces = function (
  ms,
  parm
) {
  let lostFunc = parm.lostFunc; // used by MapEntities to clear
  let addedFunc = parm.addedFunc; // used by MapEntities to set

  // update the piece mapping by setting update
  let i;
  let p;
  let tobj;
  let vis; // local vars
  let unassigned = []; // trackerobjs needing pieces
  let reclaimed = []; // pieces lost trackerobjs

  // are there any "input pieces" that need tracking?
  if (m_inputs.length && m_inputs.length > 0) {
    // assign TrackerObjects to input pieces
    // save the list of unassigned TrackerObject ids for later
    unassigned = this.MapEntities(m_inputs, ms, addedFunc, lostFunc);

    // process all input pieces, grab their TrackerObject,
    // and tell them to LERP to its position
    // ALSO
    // if there is no valid TrackerObject, reclaim the
    // piece and mark it as available for reuse
    for (i = 0; i < m_inputs.length; i++) {
      p = m_inputs[i];
      if (p) {
        tobj = p.TrackerObject();
        if (tobj && tobj.IsValid()) {
          if (tobj.isNew) {
            p.SetPosition(tobj.Position());
            // if (DEBUG) console.log('new tracked object',tobj.id);
            tobj.isNew = false;
          } else {
            p.Track();
          }
        } else {
          p.Visual().Hide();
          reclaimed.push(p);
        }
      }
    }

    // create new pieces for m_inputs pool as necessary
    // calculate how many are needed and make them
    let piecesToCreate = unassigned.length - reclaimed.length;

    if (piecesToCreate > 0) {
      piecesToCreate += m_inputs.length;
      m_pool_parm.count = piecesToCreate;
      API.InitializeTrackerPiecePool(m_pool_parm);
    }
  }

  // CREATE LIST OF VALID PIECES in m_pieces
  // first erase m_pieces reference safely...
  while (m_pieces.length > 0) {
    m_pieces.pop();
  }

  // ...then create filtered list of valid m_pieces
  for (i = 0; i < m_inputs.length; i++) {
    p = m_inputs[i];
    tobj = p.TrackerObject();
    if (tobj && tobj.IsInside()) {
      m_pieces.push(p);
      p.Visual().Show();
    } else {
      p.Visual().Hide();
    }
  }

  // return the valid piece list
  return m_pieces;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the TrackerObject pool
/*/ API.GetValidTrackerPieces = function () {
  return m_pieces;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Display UDP Connection Status
/*/ API.UI_ShowUDPConnectStatus = function () {
  let sdict = PTRACK.GetConnectStatusDict();
  let out =
    "<div style='font-family:monospace;font-size:smaller;white-space:pre'>";
  out += 'DATA FROM      COUNT  /  SEQ NUM\n';
  out += '-----------------------------------\n';

  // process each entry
  let keys = Object.keys(sdict);
  for (let i = 0; i < keys.length; i++) {
    let entry = keys[i];
    let istate = sdict[entry];
    // show entry
    // show lastse
    // count of entities
    out += `${u_pad(entry) + u_format(istate.lastcount, 0)} ${u_format(
      istate.lastseq,
      0
    )}\n`;
  }
  out += '</div>';
  if (ui_udp_status) ui_udp_status.html(out);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update Transformed Entities UI Field. Accepts React state object
  Used to accept KNOCKOUT viewmodel
/*/ API.UI_ShowPieceInformation = function (
  state
) {
  let c_out = '';
  let hw = state.width / 2;
  let hh = state.depth / 2;
  //		c_out += "<p>Set Interaction Bounds so transformed entities fall within red rectangle</p>";
  c_out += "<div style='font-family:monospace;white-space:pre'>";
  c_out += `gameworld is ${u_format(m_transform.g_halfwidth * 2)}, ${u_format(
    m_transform.g_halfdepth * 2
  )}\n`;
  c_out += `PTRAK div by ${u_format(hw)}, ${u_format(hh)}\n`;
  c_out += `      mul by ${u_format(m_transform.g_halfwidth)}, ${u_format(
    m_transform.g_halfdepth
  )}\n`;
  c_out += '---\n';
  for (let i = 0; i < m_pieces.length; i++) {
    let p = m_pieces[i];
    let tobj = p.TrackerObject();
    if (tobj) {
      let id = tobj.id;
      let x = tobj.pos.x;
      let y = tobj.pos.y;
      let a = tobj.age / 1000;
      c_out += `${u_pad(id) + u_format(x)}, ${u_format(y)} ${u_format(a, 1)}\n`;
      // if (i==0) { robotPiece.SetPositionXY(x,y); console.log(p.name,x,y); }
      // if (i==1) { p.SetPosition(x,y); console.log(p.name,x,y);}
    }
  }
  c_out += '</div>';
  if (ui_xformed_entities) ui_xformed_entities.html(c_out);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Override the default mode and create seeker-style trackerpieces
/*/ API.SetTrackerPiecesToSeekMode = function () {
  TrackerObject.ConstructorTrackMode(TrackerObject.MODE_SEEK);
  for (let i = 0; i < m_inputs.length; i++) {
    m_inputs[i].tracker_object.mode = TrackerObject.MODE_SEEK;
  }
};

/// TRACKER ENTITY FILTERING PARAMETERS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.UpdateFilterSettings = function () {
  // 	needs update to use Settings
  //	MAX_NOP = XSETTINGS.CurrentLocationKeyValue('ptrackTimeout');
  //	MIN_AGE = XSETTINGS.CurrentLocationKeyValue('ptrackMinAge');
  //	SRADIUS = XSETTINGS.CurrentLocationKeyValue('ptrackSRadius');
  //	MIN_NOP = MIN_AGE / 2;
  console.log('SET PTRACK FILTER VALUES', MAX_NOP, MIN_AGE, SRADIUS);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.SetFilterTimeout = function (nop) {
  if (nop === undefined) return;
  if (nop < MIN_AGE) {
    console.warn('Timeout', nop, "can't be less than Age Threshold", MIN_AGE);
    return;
  }
  MAX_NOP = nop;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.SetFilterAgeThreshold = function (age) {
  if (age === undefined) return;
  if (age > MAX_NOP) {
    console.warn('Age', age, "can't be greater than timeout", MAX_NOP);
    return;
  }
  MIN_AGE = age;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.SetFilterFreshnessThreshold = function (threshold) {
  if (threshold === undefined) return;
  if (threshold > MIN_AGE / 2) {
    console.log(
      'Threshold',
      threshold,
      'should be lower compared to AgeThreshold'
    );
  }
  MIN_NOP = threshold;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.SetFilterRadius = function (rad) {
  if (rad === undefined) return;
  if (Number.isNaN(rad)) {
    console.warn('SetFilterRadius expects a number, not', rad);
    return;
  }
  SRADIUS = rad;
};

/// TRANSFORMATIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Copies transform parameters from passed object. Locations are defined
  in the master settings file
/*/ API.SetLocationTransform = function (
  locationObj
) {
  let lobj = locationObj;
  if (!lobj) {
    console.error('locationObject is undefined');
  }

  // console.log("SetLocationTransform",lobj);
  m_MagicCopyLocationProps(lobj, m_transform);

  if (m_transform.width === undefined) m_transform.width = +1;
  if (m_transform.depth === undefined) m_transform.depth = +1;

  // precalculations
  m_transform.t_width = m_transform.width;
  m_transform.t_halfwidth = m_transform.t_width / 2;
  m_transform.t_depth = m_transform.depth;
  m_transform.t_halfdepth = m_transform.t_depth / 2;

  // now update everything
  m_UpdateLocationTransform();
  // no longer necessary with React
  // handled
  // m_WriteTransformToUI();

  if (DBGOUT) {
    console.log('Setting Location Parms');
    window.show_xform();
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Used to scale normalized tracker entity coordinates into desired "world"
  coordinates. This is the final transform applied to the tracker entities
/*/ API.SetWorldTransform = function (
  dimObj
) {
  dimObj.offx = dimObj.offx || 0;
  dimObj.offy = dimObj.offy || 0;
  m_transform.g_width = dimObj.width;
  m_transform.g_depth = dimObj.depth;
  m_transform.g_halfwidth = dimObj.width / 2;
  m_transform.g_halfdepth = dimObj.depth / 2;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
API.WorldDimensions = function () {
  return {
    width: m_transform.g_width,
    depth: m_transform.g_depth,
    hwidth: m_transform.g_halfwidth,
    hdepth: m_transform.g_halfwidth
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Copies location properties from sobj to dobj. Checks for existence of src
  but writes dst property regardless (important for init)
/*/ function m_MagicCopyLocationProps(
  sobj,
  dobj
) {
  let props = [
    'sx',
    'sy',
    'sz',
    'rx',
    'ry',
    'rz',
    'tx',
    'ty',
    'tz',
    'width',
    'depth'
  ];
  for (let i = 0; i < props.length; i++) {
    let prop = props[i];
    // the m_transform
    let src = sobj[prop] !== undefined ? sobj[prop] : sobj[`k${prop}`];
    console.assert(
      src !== undefined,
      'src does not have location property for',
      prop,
      sobj
    );
    let dst = dobj[prop] !== undefined ? dobj[prop] : dobj[`k${prop}`];
    // handle four cases of knockout/value
    if (typeof src === 'function') {
      // src is KO
      if (typeof dst === 'function') {
        // dst is KO
        dst(src());
      } else {
        // dst is value
        dobj[prop] = src();
      }
    } else {
      // src is a value
      if (typeof dst === 'function') {
        // dst is KO
        dst(src);
      } else {
        // dst is value
        dobj[prop] = src;
      }
    }
  } // end for
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Read the LocationTransform from UI fields
/*/ function m_ReadTransformFromUI(
  viewmodel
) {
  let VM = viewmodel || m_saved_vm;

  // read initial values
  console.log('m_ReadTransformFromUI');
  m_MagicCopyLocationProps(VM, m_transform);

  if (m_transform.width === undefined) m_transform.width = +1;
  if (m_transform.depth === undefined) m_transform.depth = +1;

  // precalculations
  m_transform.t_width = m_transform.width;
  m_transform.t_halfwidth = m_transform.t_width / 2;
  m_transform.t_depth = m_transform.depth;
  m_transform.t_halfdepth = m_transform.t_depth / 2;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Write the LocationTransform to the UI fields
/*/ function m_WriteTransformToUI(
  viewmodel
) {
  let RCOMP = viewmodel || m_saved_vm;

  // set UI values
  // note this will trigger the subscribed
  // KO change handlers!
  _enable_ui_handlers = false;
  // console.log("m_WriteTransformToUI");
  //		m_MagicCopyLocationProps( m_transform, VM );
  _enable_ui_handlers = true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* debug xform console command */
window.show_xform = function () {
  console.log('SCALE :', m_transform.sx, m_transform.sy, m_transform.sz);
  console.log('ROTATE:', m_transform.rx, m_transform.ry, m_transform.rz);
  console.log('TRANS :', m_transform.tx, m_transform.ty, m_transform.tz);
  console.log('PLAY WIDTH:', m_transform.width);
  console.log('PLAY DEPTH:', m_transform.depth);
  return m_transform;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Create Transform from saved transform values. These values are either
  set via SetLocationTransform() (on location change/startup)
  Called whenever a value changes in the
  user interface by KO.
/*/ function m_UpdateLocationTransform() {
  // calculate transforms
  let convertRadians = Math.PI / 180;

  let scale = new THREE.Matrix4().makeScale(
    m_transform.sx,
    m_transform.sy,
    m_transform.sz
  );
  let rotatex = new THREE.Matrix4().makeRotationX(
    m_transform.rx * convertRadians
  );
  let rotatey = new THREE.Matrix4().makeRotationY(
    m_transform.ry * convertRadians
  );
  let rotatez = new THREE.Matrix4().makeRotationZ(
    m_transform.rz * convertRadians
  );
  let translate = new THREE.Matrix4().makeTranslation(
    m_transform.tx,
    m_transform.ty,
    m_transform.tz
  );

  let m = new THREE.Matrix4();
  m.multiplyMatrices(scale, rotatex);
  m.multiply(rotatey);
  m.multiply(rotatez);
  m.multiply(translate);

  /* finally! */
  m_transform.matrix_align = m;
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize the Input System to connect to server
/*/ API.InitializeConnection = function (
  token,
  serverAddress
) {
  m_Initialize(token, serverAddress);
  this.UpdateFilterSettings();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Called by API.Initialize().
  token is reserved for future use
  serverAddress is the broadcast UDP address that PTRACK is on
/*/ function m_Initialize(
  token,
  serverAddress
) {
  console.assert(serverAddress, 'Must pass ServerAddress?');
  //	Initialize PTRACK
  PTRACK.Initialize(token);
  PTRACK.SetServerDomain(serverAddress);
  PTRACK.Connect();
  m_RegisterInputModule(PTRACK);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called during INPUT initialization (and possibly asynchronously later)
  to register an input module with the system. This creates an EntityMap
  object that is stored here in INPUT, and is shared with the input_module
  to be the "data bridge"
/*/ function m_RegisterInputModule(
  input_module
) {
  console.assert(input_module, 'Must call with valid input module');
  // desc.name = descriptive name of input module
  // desc.id = unique name assigned by INPUT to input module
  // desc.maxTrack = maximum number of tracks in entity
  // desc.instance = instance of the actual module
  let desc = input_module.GetDescriptor();

  // ensure this is a good Descriptor
  console.assert(desc.maxTrack, 'Not a descriptor object?');
  console.assert(desc.name, 'Descriptor does not have valid name');
  console.assert(
    desc.id === null,
    `Descriptor has unexpected non-empty id field${desc.id}`
  );

  // assign a unique ID and save descriptor w/ pointer to module
  desc.id = m_input_modules.length.zeroPad(3) + desc.name;
  desc.instance = input_module;
  desc.IsAssigned = function () {
    return this.id !== null;
  };

  // save module if all works out
  m_input_modules.push(input_module);
}

/// Tracker Services //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EnumerateTrackers returns a list of inputs of type "tracker", which are
  input modules that are PTRACK-style
/*/ API.EnumerateTrackers = function () {
  return m_Enumerate({ type: 'tracker' });
};
//	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EnumerateInputTypes returns a list of all input modules, filtered by
  optional search object.
/*/ API.Enumerate = function (
  searchObj
) {
  return m_Enumerate(searchObj);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns a list of inputs in descriptor format
/*/ function m_Enumerate(
  searchObj
) {
  console.assert(m_input_modules.length, 'ERROR: no registered input modules');

  let filtered = [];
  let fobj = searchObj;

  if (fobj) {
    // create an array based on filter test function
    filtered = m_input_modules.filter(function (input) {
      let el = input.GetDescriptor();
      console.assert(el, 'invalid descriptor');

      let matchName = true;
      let matchType = true;
      let matches = false;

      if (fobj.name) {
        matches = true;
        matchName = fobj.name === el.name;
      }
      if (fobj.type) {
        matches = true;
        matchType = fobj.type === el.type;
      }
      return matches && matchName && matchType;
    });

    return filtered;
  }
  // otherwise just return all the descriptors
  return m_input_modules;
}

/// RAW ENTITY SERVICES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ MapEntities() accepts a pieceDict and the current timestep interval.
  The pieces in pieceDict are assigned a TrackerObject, which the pieces
  will track automatically and LERP toward. Pieces are assigned a new
  TrackerObject when invalid. MapEntities returns an array of unassigned
  trackerids if any are leftover; use this to create more pieces as needed.
/*/ API.MapEntities = function (
  pieceDict,
  intervalMS,
  addedFunc,
  lostFunc
) {
  console.assert(intervalMS, 'MapEntities requires interval in');
  return m_MapEntities(pieceDict, intervalMS, addedFunc, lostFunc);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EntityDict() returns the PTrack Entity Dictionary
/*/ API.PTrackEntityDict = function () {
  // dict: entityid -> { id,x,y,h,nop }
  let entityDict = PTRACK.GetEntityDict();
  return entityDict;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ KEY FUNCTION: Maps TrackerEntities to Pieces every frame in the form
  of a TrackerObject, which is similar to TrackerEntity but has gameworld
  coordinates instead. Algorithm:
    Maintain a list of "active entity ids" from which to allocate.
    Check list of pieces "tracker object", and get entity id.
    Update entity id if it's in the pool of active entity ids
    .. otherwise, add piece to list of "orphaned/lost pieces"
    .. remove updated id from the list of "active entity ids"
    If there are any active entity ids left, then:
    .. assign them to "orphaned/lost" pieces
    .. assign remainder to "new pieces" (didn't have a TrackerObject)
/*/ function m_MapEntities(
  pieceList,
  intervalMS,
  addedFunc,
  lostFunc
) {
  // dict: entityid -> { id,x,y,h,nop }
  let entityDict = PTRACK.GetEntityDict();

  // init entity processing list with all entities
  let idsActive = Object.keys(entityDict);

  // reused loop variables
  let i;
  let id;
  let entity;
  let p;
  let tobj;
  let arrayCount;
  let found;

  /// AGING ///////////////////////////////////////////////////////////

  let maxNOP = MAX_NOP; // max "no operation" time in milliseconds
  let minAge = MIN_AGE; // minimum age to be considered "active"
  let minNOP = MIN_NOP; // threshold for detecting single-frame popups

  let ui_out = '';
  ui_out += "<div style='font-family:monospace;white-space:pre'>";

  arrayCount = idsActive.length;
  if (arrayCount < 1) {
    ui_out += 'No PTRACK entities detected';
  }
  for (i = 0; i < arrayCount; i++) {
    id = idsActive.shift();
    entity = entityDict[id];

    // delete any entity that is too old
    if (entity.nop > maxNOP) {
      delete entityDict[id];
      continue;
    }

    // check for case of an active, appropriately aged entity
    // a solid trace will have a low nop, whereas a momentary
    // one will have not updated in a while, up to the value of
    // maxNOP
    if (entity.age > minAge) {
      // old, but not updated in a while
      if (entity.nop > maxNOP) {
        delete entityDict[id];
        continue;
      }

      // If entities appeared for just a few frames,
      // we want to remove them more quickly than maxNOP
      // To detect them, age-nop > a threshold
      if (entity.age - entity.nop < minNOP) {
        if (DBGOUT) console.log(`suppress\t${id}`, 'noise');
        delete entityDict[id];
        continue;
      }

      // check for suppression due to overlap for young pieces
      if (entity.age < maxNOP || true) {
        if (!m_IsOldestInRadius(entity, idsActive, entityDict)) {
          if (DBGOUT) console.log(`suppress\t${id}`, 'overlap');
          delete entityDict[id];
          continue;
        }
      }

      // otherwise, go ahead and add the id
      idsActive.push(id);
    }

    // update counters
    entity.nop += intervalMS;
    entity.age += intervalMS;

    // update ui
    entity.name = entity.name || '';
    ui_out += `${u_pad(id + entity.name) + u_format(entity.x)}, ${u_format(
      entity.y
    )}\t${entity.nop}\n`;
  }
  // isdActive is now purged of stale entities
  // entityMap is now purged of stale entities

  // finish UI stuff
  ui_out += '</div>';
  // output if #ui-ptrack-entities was found in Initialize()
  if (ui_ptrack_entities) ui_ptrack_entities.html(ui_out);

  /// UPDATING ////////////////////////////////////////////////////////

  /*/
    UPDATE THE PIECES
    if there is a trackerobject,
    .. get its id and look it up in entityDict
    .. copy values with transform
    .. remove id from idsActive (use for later assignment)
    !! if id invalid, save piece and zero trackerobject
    /*/
  let piecesLost = [];
  let piecesNew = [];
  // update pieces
  for (i = 0; i < pieceList.length; i++) {
    p = pieceList[i];
    tobj = p.TrackerObject();
    if (tobj) {
      entity = entityDict[tobj.id];
      if (entity) {
        found = idsActive.indexOf(tobj.id);
        if (found < 0) {
          console.log('unexpected error:', tobj.id, 'was not found');
        } else {
          m_TransformAndUpdate(entity, tobj);
          idsActive.splice(found, 1);
        }
      } else {
        p.SetTrackerObject(null);
        piecesLost.push(p);
        // a 'lost' piece also needs to be reset for next time
        // it is used (see StepBees issue #59 on Github)
        if (lostFunc) lostFunc.call(this, p);
      }
    } else {
      piecesNew.push(p);
    }
  }
  // pieces that need new entities assigned in piecesLost
  // idsActive has been shrunk to unassigned ids

  // put the new pieces on the end of the lost array
  let piecesToAssign = piecesLost.concat(piecesNew);

  /*/
    ASSIGN ORPHANED/UNASSIGNED PIECES
    /*/
  for (i = 0; i < piecesToAssign.length; i++) {
    p = piecesToAssign[i];
    id = idsActive.shift();
    if (id) {
      entity = entityDict[id];
      tobj = new TrackerObject(id);
      p.SetTrackerObject(tobj);
      m_TransformAndUpdate(entity, tobj);
      tobj.Validate();
      if (addedFunc) addedFunc.call(this, p);
    } else if (DBGEDGE) console.log('ran out of entities for', p.id);
  }

  /* debug */
  if (!window.show_entities)
    window.show_entities = function (mode) {
      console.log('active tracker entities');
      if (mode !== undefined) {
        return entityDict;
      }
      let out = '\n';
      Object.keys(entityDict).forEach(function (key) {
        let obj = entityDict[key];
        out += `${obj.id}\t${obj.x.toFixed(2)}, ${obj.y.toFixed(2)}`;
        out += `\t${obj.nop}ms`;
        out += '\n';
      });
      out += '\n';
      return out;
    };
  // return unassigned ids (array)
  return idsActive;
} // end of m_MapEntities()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_places = 2;
/*/ Utility function to format a string to a padding length.
  Used by Tracker Utility
/*/ function u_format(
  num,
  fixed = 2
) {
  // HACK *****  to deal with string input
  // marco is always sending a string now to deal with a nan
  // data for some orientation and pose predictions
  num = parseFloat(num);

  let str = num.toFixed(fixed).toString();
  if (str.length > m_places) m_places = str.length;
  while (str.length < m_places) str = ` ${str}`;
  return str;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility function to clip a string to given length
  http://stackoverflow.com/questions/2686855/is-there-a-javascript-function-that-can-pad-a-string-to-get-to-a-determined-leng
/*/ function u_pad(
  str,
  padLeft
) {
  let pad = '            '; // 15 spaces
  if (padLeft) return (pad + str).slice(-pad.length);
  return (str + pad).substring(0, pad.length);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Convert entity coordinates to gameworld gameworld coordinates.
    entity: { id, x, y, h, nop } - tracker coords
    trackerObject: { id, pos, valid } - game coords
/*/ function m_TransformAndUpdate(
  entity,
  trackerObj
) {
  // tracker space position
  let x = entity.x;
  let y = entity.y;
  let z = entity.h;

  // invert tracker axis?
  if (m_transform.invertX) x = -x;
  if (m_transform.invertY) y = -y;

  // create working vector to convert to game space
  let pos = new THREE.Vector3(x, y, z);

  // DEBUG - REMOVE LATER
  // if (!m_transform.matrix_align) return;

  if (entity.isFaketrack) {
    // skip transform if the tracker object is from faketrack
    // faketrack data should already be normalized
    // console.log('skipping transform');
  } else {
    // align coordinate axis and origin
    pos = pos.applyMatrix4(m_transform.matrix_align);
    // normalize
    pos.x /= m_transform.t_halfwidth;
    pos.y /= m_transform.t_halfdepth;
  }

  // check inside or not
  let outsideX = pos.x < -1 || pos.x > 1;
  let outsideY = pos.y < -1 || pos.y > 1;
  trackerObj.isOutside = outsideX || outsideY;

  // add age
  trackerObj.age = entity.age;

  // convert normalized to gameworld coordinates
  pos.x *= m_transform.g_halfwidth;
  pos.y *= m_transform.g_halfdepth;
  pos.z = pos.z;

  // copy transform values
  trackerObj.pos.set(pos.x, pos.y, pos.z);

  // copy object and pose track info
  trackerObj.type = entity.type;
  trackerObj.name = entity.name;
  trackerObj.pose = entity.pose;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ entity is checked against other entities in idsActive
  it's assumed that idsActive does NOT contain entity
/*/ function m_IsOldestInRadius(
  entity,
  idsActive,
  entityDict
) {
  let rad2 = SRADIUS * SRADIUS;
  let result = true;
  for (let i = 0; i < idsActive.length; i++) {
    let c = entityDict[idsActive[i]];
    let x2 = Math.pow(c.x - entity.x, 2);
    let y2 = Math.pow(c.y - entity.y, 2);
    // is point outside of circle? continue
    if (x2 + y2 >= rad2) continue;
    // otherwise we're inside, so check who's older
    if (entity.age < c.age) {
      result = false;
      // merge position with baddies
      c.x = (c.x + entity.x) / 2;
      c.y = (c.y + entity.y) / 2;
      break;
    }
  }
  return result;
}

/// Return RequireJS Module //////////////////////////////////////////////////
export default API;
