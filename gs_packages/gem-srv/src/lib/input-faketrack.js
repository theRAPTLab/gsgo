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

	WARNING: This module was created a long time ago and uses fishy Javascript
	practices! We're starting to fix this in iSTEP because we need to add
	gesture and prop supm_fakeport.

	- Dave 5/29/2017

	Touch Support note:
	http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
	it's magic!

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// React user interface (the "view")
let m_FAKEVIEW = null;

// dimensions
let m_canvaswidth;
let m_canvasheight;
// let m_spacewidth = 5; // logical units of world
// let m_spacedepth = 5;

// HTML element dereferencing
let m_container; // parent div
let m_entities; // collection of moveable markers
let m_testentities; // collection of moveable markers

// current FAKETRACK frame
let m_frame = {
  header: {},
  tracks: []
};
// sequence number
let m_seq = 0;

// HTML status string
let m_status = '';

// constants for packet update rate
const FRAMERATE = 15;
const INTERVAL = (1 / FRAMERATE) * 1000;
let m_current_time = 0;

// constants for "burst noise" resilience test
const BURST_SIZE = 10;
const BURST_INT = 150;
let m_burst_end = 0;

// socket connection for FAKETRACK packet submission
let m_fakesock = null;
let m_fakeport = 2525;
let m_fakeaddress = `ws://${document.domain}:${m_fakeport}`;

// webservice (autoid) are located here
let m_websrvport = 3000;
let m_websrvaddress = `http://${document.domain}:${m_websrvport}`;

// flags
let m_data_object_name_changed = false;

//////////////////////////////////////////////////////////////////////////////
/** API METHODS *************************************************************/

/*/	This is called from the React FakeTrack component's handleChangeState()
	which decomposes the event object received when a form element changes
	state. The name is the property name of the form element, and the value
	is the new value.

	NOTE: m_FAKEVIEW is using a hacked-together REACT workaround instead of
	the UISTATE module to manage state propagation
/*/

function HandleStateChange(name, value) {
  if (name !== 'status') console.log('NAME', name, 'VALUE', value);
  // handle the m_FAKEVIEW state
  m_FAKEVIEW.setState(
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
          Initialize(m_FAKEVIEW);
          break;
        case 'data_object_name':
          m_data_object_name_changed = true;
          break;
      }
    }
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	This is called by the FakeTrack component once it's completely rendered,
	at which time this module can start adding its own objects. This code
	relies on m_FAKEVIEW (the FakeTrack view)

	NOTE: m_FAKEVIEW is using a hacked-together REACT workaround instead of
	the UISTATE module to manage state propagation
/*/
function Initialize(componentInstance) {
  // save React component to grab state from and setstate
  m_FAKEVIEW = componentInstance;

  // grab pre-defined dom elements:
  // a m_container with a number of m_entities in it
  m_container = document.getElementById('container');
  // OLD PLAE CODE
  // m_container.empty();
  // NEW GEMSTEP CODE
  while (m_container.firstChild) {
    //The list is LIVE so it will re-index each call
    m_container.removeChild(m_container.firstChild);
  }

  // add m_container touch events
  let touchContainer = document.getElementById('container');
  touchContainer.addEventListener('touchstart', m_TouchHandler, true);
  touchContainer.addEventListener('touchmove', m_TouchHandler, true);
  touchContainer.addEventListener('touchend', m_TouchHandler, true);
  touchContainer.addEventListener('touchcancel', m_TouchHandler, true);

  // add m_entities to system
  // let pre = m_FAKEVIEW.state.prefix;
  let num = m_FAKEVIEW.state.num_entities;

  for (let i = 0; i < num; i++) {
    const child = document.createElement('div');
    child.classList.add('entity');
    child.classList.add('draggable');
    child.setAttribute('entity-id', i);
    m_container.appendChild(child);
    const columns = Math.floor(m_container.offsetWidth / child.offsetWidth) - 1;
    const spacer = m_container.offsetWidth / columns;
    const row = Math.floor(i / columns) * spacer;
    const col = Math.floor(i % columns) * spacer;
    child.style.transform = `translate3d(${col}px, ${row}px, 0)`;
  }

  // add m_entities
  // OLD PLAE CODE
  // m_entities = $('.entity');
  // NEW GEMSTEP CODE
  m_entities = document.getElementsByClassName('entity');

  // test m_entities for bursting
  for (let j = 0; j < BURST_SIZE; j++) {
    const child = document.createElement('div');
    child.classList.add('entity');
    child.classList.add('testentity');
    child.classList.add('draggable');
    child.setAttribute('entity-id', `burst${j}`);
    m_container.appendChild(child);
  }
  // OLD PLAE CODE
  // m_testentities = $('.testentity');
  // NEW GEMSTEP CODE
  m_testentities = document.getElementsByClassName('testentity');

  // store the beginning of a click-drag
  // used to calculate deltas to apply to object group
  // OLD PLAE CODE
  // m_entities.draggable(o_DragHandler).click(o_ClickHandler);
  // NEW GEMSTEP CODE
  const o_clickHandler = e => {
    const id = e.target.getAttribute('entity-id');
    if (id) console.log(`clicked entity-id ${id}`);
  };

  let ox1 = m_container.offsetLeft;
  let oy1 = m_container.offsetTop;
  let ox2 = ox1 + m_container.offsetWidth;
  let oy2 = oy1 + m_container.offsetHeight;
  let cx;
  let cy;
  let dragActive = false;
  let dragElement;

  const o_dragStart = e => {
    const { target } = e;
    // target is clicked element, currentTarget is owner of listener: m_container
    // if the target isn't m_container, meaning an element was clicked...
    if (target !== m_container) {
      dragElement = target;
      dragActive = true;
      cx = dragElement.offsetWidth / 2;
      cy = dragElement.offsetHeight / 2;
      ox1 = m_container.offsetLeft;
      oy1 = m_container.offsetTop;
      ox2 = ox1 + m_container.offsetWidth;
      oy2 = oy1 + m_container.offsetHeight;
    }
  };

  const o_drag = e => {
    if (!dragActive) return;
    const mx = e.clientX;
    const my = e.clientY;
    if (mx < ox1 || mx > ox2 || my < oy1 || my > oy2) return;
    // console.log(`oob ${x},${y} outside rect ${ox1},${oy1} - ${ox2},${oy2}`);
    e.preventDefault();
    let x = mx - ox1 - cx; // relative to m_container
    let y = my - oy1 - cy;
    dragElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const o_dragend = () => {
    dragElement = null;
    dragActive = false;
  };

  m_container.addEventListener('mousedown', o_dragStart);
  m_container.addEventListener('mousemove', o_drag);
  m_container.addEventListener('mouseup', o_dragend);
  m_container.addEventListener('click', o_clickHandler);

  // space out the m_entities in the m_container, since they start out
  // all bunched on top of each other due to position:absolute
  let top = 0;
  let left = 0;
  // $.each(m_entities, function (index, div) {
  for (let i = 0; i < m_entities.length; i++) {
    const div = m_entities[i];
    // OLD PLAE CODE
    // let element = $(div);
    // element.css('left', left);
    // element.css('top', top);
    // NEW GEMSTEP CODE
    div.style.left = left;
    div.style.top = top;
    left += 40;
    if (left > m_canvaswidth - 40) {
      top += 40;
      left = 0;
    }
  }

  // hide test m_entities
  // $.each(m_testentities, function (index, div) {
  for (let i = 0; i < m_testentities.length; i++) {
    const div = m_testentities[i];

    // OLD PLAE CODE
    // let element = $(div);
    // element.css('display', 'none');
    // element.css('left', Math.random() * 2);
    // element.css('top', Math.random() * 2);
    // NEW GEMSTEP CODE
    div.style.display = 'none';
    div.style.left = Math.random() * 2;
    div.style.top = Math.random() * 2;
  }

  // setup faketrack socket connection to server
  if (m_fakesock === null) {
    // establish faketrack m_fakesock connection to node server
    // also startup the data push interval as 1/FRAMERATE
    console.log('Connected-FakeTrackAddress', m_fakeaddress, '...');
    m_fakesock = new WebSocket(m_fakeaddress);
    m_fakesock.onopen = () => {
      console.log('FAKETRACK CHANNEL CONNECTED!');
      setInterval(SendFrame, INTERVAL);
    };
    m_fakesock.onclose = msg => {
      console.log('FAKETRACK SOCKET CLOSED: CODE', msg.code);
      m_fakesock = null;
    };
    // get IP autoid from our /faketrack/autoid webservice
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        HandleStateChange('prefix', xmlHttp.responseText);
      }
    };
    // initate ip request
    xmlHttp.open('GET', `${m_websrvaddress}/faketrack/autoid`, true);
    xmlHttp.send(null);
  }

  // save dimensions of m_container. this isn't actually a canvas element.
  // it's used to calculate normalized coordinates of entities
  m_canvaswidth = m_container.width;
  m_canvasheight = m_container.height;
} // Initialize()a

//////////////////////////////////////////////////////////////////////////////
/** SEND PTRACK-COMPATIBLE DATA *********************************************/

/*/	SendFrame is called every 1/FRAMERATE seconds
/*/ function SendFrame() {
  // update current time
  m_current_time += INTERVAL;
  // calculate compatible timer format
  let sec = Math.floor(m_current_time / 1000);
  let nsec = (m_current_time - sec * 1000) * 1e6;

  // create empty PTRACK data object
  // (this might have to be less than 4K)
  switch (m_FAKEVIEW.state.data_track) {
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
  }

  // allocation storage for status string calculation
  m_status = '';

  // x,y ranges within m_spacewidth x m_spacedepth meters,
  // centered on 0 in the space
  m_entities.forEach(u_AddEntityToFrame);

  // clear flag for next frame
  m_data_object_name_changed = false;

  // handle test entities that might be bursting
  if (m_burst_end) {
    if (m_current_time < m_burst_end) m_testentities.each(u_AddEntityToFrame);
    else HandleStateChange('burst', false);
  }

  // update status UI
  HandleStateChange('status', m_status);

  // if m_fakesock is defined, send to server
  if (m_fakesock) {
    m_frame.header.stamp = {
      'sec': sec,
      'nsec': nsec
    };
    m_frame.header.frame_id = 'faketrack';
    m_frame.fake_id = m_FAKEVIEW.state.prefix;
    m_frame.header.seq = m_seq++;
    m_fakesock.send(JSON.stringify(m_frame));
  }

  // OPTIONAL: emit a fake object frame (as oppoed to people frame)
  // if checkbox dragActive in UI
  if (m_FAKEVIEW.state.mprop === true) {
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

//////////////////////////////////////////////////////////////////////////////
/** SUPPORTING FEATURES *****************************************************/

/*/	The Burst Test creates a bunch of entities on the screen as temporary
	noise that might be caused by bad PTRACK calibration or environment
	lighting. The tracker should ignore entities that exist for less than
	the value of BURST_INT. This test is initated if the 'burst' checkbox
	is set; and it is reset automatically by SendFrame()
/*/ function DoBurstTest(
  value
) {
  switch (value) {
    case true:
      BurstStart();
      break;
    case false:
      BurstStop();
      break;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BurstStart() {
  let test_interval = BURST_INT;
  m_burst_end = m_current_time + test_interval;
  console.log('TEST BURST', `${test_interval}ms @`, m_current_time);
  // $.each(m_testentities, function (index, div) {
  m_testentities.forEach(div => {
    // OLD PLAE CODE
    // let element = $(div);
    // element.css('left', m_canvaswidth / 2 + Math.random() * 120);
    // element.css('top', m_canvasheight / 2 + Math.random() * 120);
    // element.css('display', 'block');
    // NEW GEMSTEP CODE
    div.css('left', m_canvaswidth / 2 + Math.random() * 120);
    div.css('top', m_canvasheight / 2 + Math.random() * 120);
    div.css('display', 'block');
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BurstStop() {
  console.log('TEST BURST COMPLETE @', `${m_current_time}ms`);
  // $.each(m_testentities, function (index, div) {
  m_testentities.forEach(div => {
    // OLD PLAE CODE
    // let element = $(div);
    // element.css('display', 'none');
    // NEW GEMSTEP CODE
    div.css('display', 'none');
  });
  m_burst_end = 0;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	ADD TOUCHSUPPORT
	http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
/*/
function m_TouchHandler(event) {
  let touch = event.changedTouches[0];

  let simulatedEvent = document.createEvent('MouseEvent');
  simulatedEvent.initMouseEvent(
    {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup'
    }[event.type],
    true,
    true,
    window,
    1,
    touch.screenX,
    touch.screenY,
    touch.clientX,
    touch.clientY,
    false,
    false,
    false,
    false,
    0,
    null
  );

  touch.target.dispatchEvent(simulatedEvent);
  event.preventDefault();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Utility function to add the passed div to m_frame and update m_status
	string. Used by SendFrame()
/*/
function u_AddEntityToFrame(index, div) {
  // OLD PLAE CODE
  // let element = $(div);
  // if (!element.is(':visible')) return;

  // NEW GEMSTEP CODE
  // replacement candidate for is(':visible');
  // https://stackoverflow.com/questions/123999
  function isInView(el) {
    let box = el.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom >= 0;
  }
  // alt: https://stackoverflow.com/questions/57474103
  // function isVisible(el) {
  //   let style = window.getComputedStyle(el);
  //   return style.display === 'none';
  // }
  if (isInView(div)) return;

  // if data_object_name has changed, we update the entity id so that
  // fake track sends a new object, otherwise the old object is retained
  // and the visual is not updated.
  if (m_data_object_name_changed) {
    div.setAttribute('entity-id', parseInt(Math.random() * 1000, 10));
  }
  let id = m_FAKEVIEW.state.prefix + div.getAttribute('entity-id').toString();
  // OLD PLAE CODE
  // let pos = element.position();
  // let offX = element.outerWidth() / 2;
  // let offY = element.outerHeight() / 2;
  let pos = {
    left: div.offsetLeft,
    top: div.offsetHeight
  };
  let offX = div.offsetWidth / 2;
  let offY = div.offsetHeight / 2;
  let speedX = m_FAKEVIEW.state.jitter * Math.random();
  let speedY = m_FAKEVIEW.state.jitter * Math.random();
  // xx & yy are normalized -1 to 1
  let xx = (pos.left + offX + speedX) / m_canvaswidth - 0.5;
  let yy = (pos.top + offY + speedY) / m_canvasheight - 0.5;
  let x = xx * (m_FAKEVIEW.state.width / 2) + parseFloat(m_FAKEVIEW.state.offx);
  let y = yy * (m_FAKEVIEW.state.depth / 2) + parseFloat(m_FAKEVIEW.state.offy);

  // This is used to reverse the basic transforms from input.js
  // from m_UpdateLocationTransform

  // expand to aspect ratio of canvas
  // let scaleX = m_FAKEVIEW.state.xscale;
  // let scaleY = -m_FAKEVIEW.state.yscale; // html coordinates are 0 at top
  // let scale = new THREE.Matrix4().makeScale(scaleX, scaleY, 1);

  // // apply rotation transforms
  // let convertRadians = Math.PI / 180;
  // let rotatex = new THREE.Matrix4().makeRotationX(
  //   m_FAKEVIEW.state.xrot * convertRadians
  // );
  // let rotatey = new THREE.Matrix4().makeRotationY(
  //   m_FAKEVIEW.state.yrot * convertRadians
  // );
  // let rotatez = new THREE.Matrix4().makeRotationZ(
  //   m_FAKEVIEW.state.zrot * convertRadians
  // );

  // // translation
  // let x = xx * (m_FAKEVIEW.state.width / 2) + parseFloat(m_FAKEVIEW.state.offx);
  // let y = yy * (m_FAKEVIEW.state.depth / 2) + parseFloat(m_FAKEVIEW.state.offy);
  // let translate = new THREE.Matrix4().makeTranslation(x, y, 0);

  // let m = new THREE.Matrix4();
  // m.multiplyMatrices(scale, rotatex);
  // m.multiply(rotatey);
  // m.multiply(rotatez);
  // m.multiply(translate);

  // // create working vector to convert to game space
  // pos = new THREE.Vector3(x, y, pos.z);
  // pos = pos.applyMatrix4(m);

  // add entity to frame.tracks to be JSONified
  let framedata = {
    id,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    height: 1.4,
    isFaketrack: true // mark the entity as faketrack
    // data so we can ignore it
    // during transforms
  };
  switch (m_FAKEVIEW.state.data_track) {
    case 'people_tracks':
      m_frame.people_tracks.push(framedata);
      break;
    case 'object_tracks':
      // insert form-defined name of object
      framedata.object_name = m_FAKEVIEW.state.data_object_name;
      m_frame.object_tracks.push(framedata);
      break;
    case 'pose_tracks':
      // insert form-defined name of pose
      framedata.predicted_pose_name = m_FAKEVIEW.state.data_object_name;
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
