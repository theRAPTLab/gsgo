/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  mod-faketrack is the code that creates the faketrack tool inside of an
  existing HTML structure. It produces fake PTrack-style UDP via  the nodejs
  server's step-tracker.js module.

  The root UI is instantiated in 1401-games/faketrack/game-run.js:
  .. game-run.jsx instantiates <FakeTrack controller={mod_faketrack}
  .. FakeTrack.componentDidMount calls this.controller.Initialize( this );

  This module is the "controller", and FakeTrack.jsx implements the "view"
  that talks to us through the exm_fakeported controller interface.

  *** WARNING ***
  This module was created in 2014 and still uses fishy Javascript practices!
  - Dave 5/29/2017

  *** NOTES ***
  Touch support from: stackoverflow.com/questions/5186441

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// info about gl-matrix usage
/// http://math.hws.edu/graphicsbook/c7/s1.html
import { vec3 } from 'gl-matrix';
import UR from '@gemstep/ursys/client';
import * as UI from './ui-handlers';
import * as XFORM from './ui-state';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FAKETK' /* 'TagInput' */);

// React user interface (the "view")
let m_approot = null;
// dimensions
let m_canvaswidth;
let m_canvasheight;
let m_spacewidth = 5; // logical units of world
let m_spacedepth = 5;

// HTML element dereferencing
let m_container; // parent div
let m_entities; // HTMLCollection of moveable markers
let m_testentities; // HTMLCollection of moveable markers

// current FAKETRACK frame
let m_frame = {
  header: {},
  tracks: []
};
let m_seq = 0; // sequence number
let m_status = ''; // HTML status string

// constants for packet update rate
const FRAMERATE = 15;
const INTERVAL = (1 / FRAMERATE) * 1000;
let m_current_time = 0;

// constants for "burst noise" resilience test
const BURST_NUM = 10;
const BURST_INT = 150;
const BURST_RAD = 100;

let m_burst_end = 0;

// socket connection for FAKETRACK packet submission
let m_fakesock = null;
let m_fakeport = 2525;
let m_fakeaddress = `ws://${document.domain}:${m_fakeport}`;

// flags
let m_data_object_name_changed = false;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CreateEntities(container, num = m_approot.state.num_entities) {
  for (let i = 0; i < num; i++) {
    const child = document.createElement('div');
    child.classList.add('entity');
    child.setAttribute('entity-id', i);
    container.appendChild(child);
    const columns = Math.floor(container.offsetWidth / child.offsetWidth) - 1;
    const spacer = container.offsetWidth / columns;
    const row = Math.floor(i / columns) * spacer;
    const col = Math.floor(i % columns) * spacer;
    child.style.transform = `translate3d(${col}px, ${row}px, 0)`;
  }
  return document.getElementsByClassName('entity');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Translate(block, x, y) {
  block.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// replacement candidate for is(':visible');
// https://stackoverflow.com/questions/123999
function m_inPageView(el) {
  let box = el.getBoundingClientRect();
  return box.top < window.innerHeight && box.bottom >= 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// alt: https://stackoverflow.com/questions/57474103
function m_isHidden(el) {
  let style = window.getComputedStyle(el);
  return style.display === 'none';
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called from the React FakeTrack component's handleChangeState()
 *  which decomposes the event object received when a form element changes
 *  state. The name is the property name of the form element, and the value
 *  is the new value.
 *
 *  NOTE: m_approot is using a hacked-together REACT workaround instead of
 *  the UISTATE module to manage state propagation
 */
function HandleStateChange(name, value) {
  if (name !== 'status') console.log('NAME', name, 'VALUE', value);
  // handle the m_approot state
  m_approot.setState(
    {
      [name]: value
    },
    () => {
      // handle internal changes
      switch (name) {
        case 'burst':
          DoBurstTest(value);
          break;
        case 'num_entities':
          Initialize(m_approot);
          break;
        case 'data_object_name':
          m_data_object_name_changed = true;
          break;
      }
    }
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called by the FakeTrack component once it's completely rendered,
 *  at which time this module can start adding its own objects. This code
 *  relies on m_approot (the FakeTrack view) and assumes that it is never
 *  unmounted (i.e. it's the root view for the application)
 *
 *  NOTE: m_approot is using a hacked-together REACT workaround instead of
 *  the UISTATE module to manage state propagation
/*/
function Initialize(componentInstance) {
  // save React component to grab state from and setstate
  m_approot = componentInstance;

  // setup container, entity listsm
  m_container = UI.EmptyContainer('container');
  UI.AddTouchEvents(m_container);
  UI.AddMouseEvents(m_container);
  m_entities = m_CreateEntities(m_container);

  // test m_entities for bursting
  for (let j = 0; j < BURST_NUM; j++) {
    const child = document.createElement('div');
    child.classList.add('testentity');
    child.setAttribute('entity-id', `burst${j}`);
    m_container.appendChild(child);
  }
  m_testentities = document.getElementsByClassName('testentity');

  // hide test m_entities
  // $.each(m_testentities, function (index, div) {
  for (let i = 0; i < m_testentities.length; i++) {
    const div = m_testentities[i];
    div.style.display = 'none';
    const x = BURST_RAD - Math.random() * BURST_RAD;
    const y = BURST_RAD - Math.random() * BURST_RAD;
    m_Translate(div, x, y);
  }

  // setup faketrack socket connection to server
  if (m_fakesock === null) {
    // establish faketrack m_fakesock connection to node server
    // also startup the data push interval as 1/FRAMERATE
    console.log(...PR('Connected-FakeTrackAddress', m_fakeaddress, '...'));
    m_fakesock = new WebSocket(m_fakeaddress);
    m_fakesock.onopen = () => {
      console.log(...PR('FAKETRACK CHANNEL CONNECTED!'));
      setInterval(SendFrame, INTERVAL);
    };
    m_fakesock.onclose = msg => {
      console.log(...PR('FAKETRACK SOCKET CLOSED: CODE', msg.code));
      m_fakesock = null;
    };
  }
  // save dimensions of m_container. this isn't actually a canvas element.
  // it's used to calculate normalized coordinates of entities
  m_canvaswidth = m_container.offsetWidth;
  m_canvasheight = m_container.offsetHeight;
} // Initialize()a

/// SEND PTRACK-COMPATIBLE DATA ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SendFrame() {
  // update current time
  m_current_time += INTERVAL;
  // calculate compatible timer format
  let sec = Math.floor(m_current_time / 1000);
  let nsec = (m_current_time - sec * 1000) * 1e6;

  // create empty PTRACK data object
  // (this might have to be less than 4K)
  switch (m_approot.state.data_track) {
    case 'people_tracks':
      m_frame = {
        header: {},
        people_tracks: []
      };
      break;
    case 'object_tracks':
      m_frame = {
        header: {},
        object_tracks: []
      };
      break;
    case 'pose_tracks':
      m_frame = {
        header: {},
        pose_tracks: []
      };
      break;
    case 'fake_tracks':
      m_frame = {
        header: {},
        fake_tracks: []
      };
      break;
    default:
      console.log('no match', m_approot.state.data_track);
  }

  // allocation storage for status string calculation
  m_status = '';

  // x,y ranges within m_spacewidth x m_spacedepth meters,
  // centered on 0 in the space
  for (let i = 0; i < m_entities.length; i++) {
    const div = m_entities[i];
    u_AddEntityToFrame(div); // m_frame is global, urk
  }

  // clear flag for next frame
  m_data_object_name_changed = false;

  // handle test entities that might be bursting
  if (m_burst_end) {
    if (m_current_time < m_burst_end) {
      for (let i = 0; i < m_testentities.length; i++) {
        const div = m_testentities[i];
        u_AddEntityToFrame(div);
      }
    } else HandleStateChange('burst', false);
  }

  // update status UI (lower left)
  HandleStateChange('status', m_status);

  // if m_fakesock is defined, send to server
  if (m_fakesock) {
    m_frame.header.stamp = {
      'sec': sec,
      'nsec': nsec
    };
    m_frame.header.frame_id = 'faketrack';
    m_frame.fake_id = m_approot.state.prefix;
    m_frame.header.seq = m_seq++;
    m_fakesock.send(JSON.stringify(m_frame));
  }

  // OPTIONAL: emit a fake object frame (as oppoed to people frame)
  // if checkbox dragActive in UI
  if (m_approot.state.mprop === true) {
    // hack in an object
    m_frame = {
      header: {
        seq: m_seq++,
        stamp: {
          sec,
          nsec
        },
        frame_id: 'faketrack'
      },
      //
      object_tracks: [
        {
          age: 5,
          object_name: 'red',
          x: Math.random() * 0.25 - 0.125, //Math.sin(sec),
          y: Math.random() * 0.25 - 0.125, //Math.cos(sec),
          id: 'dprop01',
          confidence: Math.random(),
          height: 1
        }
      ]
    };
    if (m_fakesock) m_fakesock.send(JSON.stringify(m_frame));
  }
}

/// SUPPORTING FEATURES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The Burst Test creates a bunch of entities on the screen as temporary
 *  noise that might be caused by bad PTRACK calibration or environment
 *  lighting. The tracker should ignore entities that exist for less than
 *  the value of BURST_INT. This test is initated if the 'burst' checkbox
 *  is set; and it is reset automatically by SendFrame()
 */
function DoBurstTest(value) {
  if (value) BurstStart();
  else BurstStop();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BurstStart() {
  let test_interval = BURST_INT;
  m_burst_end = m_current_time + test_interval;
  console.log('TEST BURST', `${test_interval}ms @`, m_current_time);

  // iterate over HTMLCollection (does not support forEach)
  for (let i = 0; i < m_testentities.length; i++) {
    const div = m_testentities[i];
    const x = BURST_RAD - Math.random() * BURST_RAD;
    const y = BURST_RAD - Math.random() * BURST_RAD;
    m_Translate(div, x, y);
    div.style.display = 'block';
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BurstStop() {
  console.log('TEST BURST COMPLETE @', `${m_current_time}ms`);
  // iterate over HTMLCollection (does not support forEach)
  for (let i = 0; i < m_testentities.length; i++) {
    const div = m_testentities[i];
    div.style.display = 'none';
  }
  m_burst_end = 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used by SendFrame()
 *  Utility function to add the passed div to m_frame and update m_status
 *  string.
 */
function u_AddEntityToFrame(div) {
  if (m_isHidden(div)) return;

  // if data_object_name has changed, we update the entity id so that
  // fake track sends a new object, otherwise the old object is retained
  // and the visual is not updated.
  if (m_data_object_name_changed) {
    div.setAttribute('entity-id', parseInt(Math.random() * 1000, 10));
  }
  let id = m_approot.state.prefix + div.getAttribute('entity-id').toString();
  // getBoundingClientRect return DOMRect
  // { x, y, width, height, top, right, bottom, left }
  const rect = div.getBoundingClientRect();
  const origin = m_container.getBoundingClientRect();
  let pos = {
    left: rect.left - origin.left,
    top: rect.top - origin.top
  };
  let offX = rect.width / 2;
  let offY = rect.height / 2;
  let speedX = m_approot.state.jitter * Math.random();
  let speedY = m_approot.state.jitter * Math.random();
  // xx & yy are normalized -1 to 1
  let xx = (pos.left + offX + speedX) / m_canvaswidth - 0.5;
  let yy = (pos.top + offY + speedY) / m_canvasheight - 0.5;
  // expanded position
  let x = xx * (m_approot.state.xRange / 2) + parseFloat(m_approot.state.xOff);
  let y = yy * (m_approot.state.yRange / 2) + parseFloat(m_approot.state.yOff);

  // Align faketrack to match the PTrack coordinate system, which may be
  // rotated and offset from the origin
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    1. CALCULATE MATRIX PARAMETERS
      scaleX = state.xscale
      rotateX = state.xrot
      transX = normalize(x)+state.width + state.offx
      transY = normalize(y)+state.depth + state.offy
      * create matrix for each operation *

    2. PROPER ORDER OF MATRIX CALCULATIONS
      let m = new THREE.Matrix4();
      m.multiplyMatrices(scale, rotatex);
      m.multiply(rotatey);
      m.multiply(rotatez);
      m.multiply(translate);

    TRANSLATED POSITION
      pos = new THREE.Vector3(x, y, pos.z);
      pos = pos.applyMatrix4(m);
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/

  /*** insert gl-matrix calculations here to transform position ****************/

  // add entity to frame.tracks to be JSONified
  let framedata = {
    id,
    x,
    y,
    z: 0,
    height: 1.4,
    isFaketrack: true // mark the entity as faketrack
    // data so we can ignore it
    // during transforms
  };

  switch (m_approot.state.data_track) {
    case 'people_tracks':
      m_frame.people_tracks.push(framedata);
      break;
    case 'object_tracks':
      // insert form-defined name of object
      framedata.object_name = m_approot.state.data_object_name;
      m_frame.object_tracks.push(framedata);
      break;
    case 'pose_tracks':
      // insert form-defined name of pose
      framedata.predicted_pose_name = m_approot.state.data_object_name;
      // Fake data
      framedata.orientation = 1;
      framedata.joints = {
        'CHEST': {
          'x': framedata.x,
          'y': framedata.y,
          'z': 0,
          'confidence': 1
        }
      };
      m_frame.pose_tracks.push(framedata);
      break;
    case 'fake_tracks':
      m_frame.fake_tracks.push(framedata);
      break;
  }
  // update status
  m_status += `[${id}]`;
  m_status += ` ${x.toFixed(2)}`;
  m_status += `, ${y.toFixed(2)}`;
  m_status += '\n';
}

/// EXPORT MODULE API /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exports
export { Initialize, HandleStateChange };
