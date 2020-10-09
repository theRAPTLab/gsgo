/* step/playback/display.js */
define([
  'three',
  'step/common/definitions',
  '1401/objects/sysloop',
  'step/xvisualfactory',
  'step/xwatch',
  'step/objects/data/pool',
  'step/xrenderer',
  'step/xsettings',
  'step/xvisualfx',
  'step/net/netdefs',
  'step/unisys-recorder'
], function (
  THREE,
  DEF,
  SYSLOOP,
  XVISUALFACTORY,
  WATCH,
  Pool,
  XRENDERER,
  XSETTINGS,
  VFX,
  NETDEFS,
  RECORDER
) {
  var DBGOUT = false;

  ///////////////////////////////////////////////////////////////////////////////
  /** DISPLAY LIST *************************************************************\

	Serializes and Deserializes our renderer displaylists. The displayData
	is comprised of visuals, cameras, and viewport properties.

	ON THE SOURCE WEBAPP:

	* To capture a display frame, call Capture() to get a displayData object.
	* To capture the display geometry, call GetDisplayProperties(o). You can
	pass-in o, which will be decorated with cameras and viewport props.

	ON THE CLIENT WEBAPPS:

	* To replay a frame, call Render( displayData ).
	* To set display geometry, call SetDisplayProperties( displayData )


	HELPERS

	(0) import DEF from step/common/definitions.js in source and client apps

	(1) in source app, declare this message handler:

		// DISPLAYLIST 1/2: Displaylist servers must implement GetDisplayProps
		UNISYS.RegisterMessage( DEF.SYSTEM_EVENTS.GetDisplayProps, function ( data, cb_done ) {
			var displayData = DISPLAYLIST.GetDisplayProperties();
			UNISYS.Broadcast( DEF.SYSTEM_EVENTS.DisplayUpdate, displayData );
			cb_done();
		});

		... and use this AutoCaptureHelper method ....

		// DISPLAYLIST 2/2: Start AutoCapture to Server LiveFrame
		DISPLAYLIST.AutoCaptureHelper( function ( displayData ) {
			UNISYS.Call( DEF.UNISYS_SERVER_MSGS.SaveFrameData, displayData );
		});

	(2) in client apps, use this when ready to start rendering:

		// DISPLAYLIST 1/3: Handle display geometry updates
		UNISYS.RegisterMessage( DEF.SYSTEM_EVENTS.DisplayUpdate, function ( data, cb_done ) {
			DISPLAYLIST.SetDisplayProperties( data );
			cb_done();
		});


		... and this to handle recorder events ...

		// DISPLAYLIST 2/3: Handle recorder events
		UNISYS.RegisterMessage( DEF.UNISYS_CLIENT_MSGS.RecorderState, function ( data, cb_done ) {
			switch (data.event) {
				case DEF.ENUM.RECORDER_EVENTS.OpenFile:
					DISPLAYLIST.AutoRenderHelper( 'replay' );
					break;
				case DEF.ENUM.RECORDER_EVENTS.EndFile:
					break;
				case DEF.ENUM.RECORDER_EVENTS.CloseFile:
					DISPLAYLIST.AutoRenderHelper( 'live' );
					break;
			}
			cb_done();
		});

		... and this code fragment to kick the AutoRenderHelper into action ...

		// DISPLAYLIST 3/3 Request DisplayProperty Frame then AutoRender
		UNISYS.Call( DEF.SYSTEM_EVENTS.GetDisplayProps );
		// Initiate AutoRendering with optional callback function
		var addr = UNISYS.RECORDER.IsReplaying() ? 'replay' : 'live';
		DISPLAYLIST.AutoRenderHelper( addr );

		... and use this code fragment to determine when to show live or replay ...


	MANUAL CONTROL OF CAPTURE/RENDER RATE

		NOTE: DEF is the contents of step/common/definitions.

		In your source app:
		Periodically call DisplayList.Capture() and then
		UNISYS.Call(DEF.UNISYS_SERVER_MSGS.SaveFrameData, displayData)

		In your mirroring app:
		Periodically call DisplayList.Render(displayData), having received
		the displayData from the server in some way. HOWEVER...

		...for IOS support, we can't use UNISYS.Broadcast() distribution, so we
		have a "pull-style" AJAX call that uses the saved frame data.
		Call DisplayList.RenderFromServer() periodically.


	SUBSCRIBERS

		If you want to know when the display geometry (e.g. viewport) updates,
		then use DISPLAYLIST.SetDisplayUpdateCallback(function(){})

		See the display-client.js sample mirror code.



///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARIABLES *******************************************************/

  // CAPTURE
  var AUTOCAPTURE_TIMER = 0;
  var m_default_fps = 10;
  var m_capture_fps = m_default_fps;
  var m_disable_capture = false;
  var m_zoom_factor = 1; // Special zoom factor for background
  // images and other sprites that have
  // to be scaled down to display on
  // student iPad.

  // RENDER
  var m_sprite_pool; // pool of sprite visuals to reuse
  var m_meter_pool; // pool of bee nectar meter visuals
  var m_text_pool; // pool of text visuals to reuse
  var m_marker_pool; // pool of marker sprites to reuse
  var m_rect_pool; // pool of rect mesh visuals
  var m_display_dict = {}; // active visuals in the system
  var m_render_fps = m_default_fps;
  var AUTORENDER_TIMER = 0;
  var m_render_flags = {}; // properties for rendering flags

  // DEFINES
  var EVENT = {};
  EVENT.SYS = DEF.SYSTEM_EVENTS;

  // AutoRender callback when dimensions change
  var m_subscribe_displayupdate = null;

  /** SYSLOOP DECLARATION ******************************************************/

  var MOD = SYSLOOP.New('PBDisplayList');

  /// SYSLOOP HOOKS /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MOD.SetHandler('Construct', function () {
    // preallocate visuals
    m_ConstructMirrorVisuals();
  });

  /// MAIN API CALL : RENDER ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var dbg_rendercount = 0;
  var m_last_timestamp = null;
  /*/ Plot the display data that comes in!

	The m_display_dict is a collection of currently active visuals.
	The m_display_dict is keyed by uuid, and is populated every update.
	The values in m_display_dict are "display objects".
	A display object consists of the values received in data.list,
	plus a special "visual" property which holds reference to visual.
	The visuals are Request() and Release() from a pool.

/*/ MOD.Render = function (
    displayData
  ) {
    // avoid redrawing the same frame timestamp
    // the timestamp is set only on recorded sessions
    // live data is not timestamped, and we always want to render it.
    let ts = displayData.timestamp;
    if (ts !== undefined && m_last_timestamp === ts) {
      if (DBGOUT) console.log('skipping repeated frame', displayData.timestamp);
      return;
    }
    m_last_timestamp = ts;

    // console.log('rendering '+(dbg_rendercount++)+' packetsize '+JSON.stringify(displayData).length);
    var dbgwatch = WATCH('PBDISP-RENDER').PeriodWait(1000);

    // preallocate vars (should move outside function so they are allocated
    // just once, not per call)
    var i, item, vis, ddobj;
    var uuid, uuids;

    // dereference viewport because we'll be needing it A LOT
    var VP = XRENDERER.Viewport();

    // NOTE:
    // m_display_dict is a data structure of visuals stored by uuid
    // if (dbgwatch) console.log('display data',displayData);

    var vpChanged = m_SetViewportData(displayData);
    m_SetCameraData(displayData);

    // HANDLE VISUALS
    // invalidate m_display_dict, which keeps track of what
    // data was last processed into a visual update
    uuids = Object.keys(m_display_dict);
    i = uuids.length;
    while (i--) m_display_dict[uuids[i]].uuid_alive = false;

    // update m_display_dict from displayList
    var displayList = displayData.visuals || [];
    if (!displayList.length)
      console.warn('DisplayList.Render: zero-length displayList');
    var out = displayList.length;
    for (i = 0; i < displayList.length; i++) {
      item = displayList[i];
      // update each item in the display list
      switch (item.type) {
        case 'Sprite':
          out += f_UpdateSpriteEntry(item);
          break;
        case 'Mesh':
          out += f_UpdateMeshEntry(item);
          break;
        default:
          console.log('skipping', item.type);
      }
    } // for data.list

    // now remove dead visuals
    uuids = Object.keys(m_display_dict);
    i = uuids.length;
    while (i--) {
      uuid = uuids[i];
      ddobj = m_display_dict[uuid];
      if (!ddobj) throw 'bad uuid ' + uuid;
      if (!ddobj.uuid_alive) {
        f_DeleteDisplayEntry(ddobj);
      }
    } // while uuids

    // emit combined out string for debugging
    if (DBGOUT) console.log(out);

    // do callbacks if any
    if (vpChanged && typeof m_subscribe_displayupdate === 'function')
      m_subscribe_displayupdate();
  };

  /// SUPPORT API CALL : RETRIEVE CURRENT OFFSET IN MS //////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MOD.LastTimeStampMS = function () {
    return Math.floor(m_last_timestamp / 1e6);
  };

  /// MAIN API CALL : RENDER FROM SERVER ////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This utility will grab a liveframe (can override with addr)
/*/ MOD.RenderFrameFromServer = function (
    addr
  ) {
    addr = addr || 'live';
    if (!u_IsValidAddress(addr))
      throw "RenderFrameFromServer: addr must be 'live' or 'replay', not " + addr;

    // don't render if address is "hidden"
    if (addr === 'stop') {
      console.error(
        'DisplayList: RenderFrameFromServer unexpected "stop" addr...this should never happen.'
      );
      return;
    }

    // INITIATE REQUEST FOR IP ADDRESS
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', XSETTINGS.WebAddress(addr), true);
    xmlHttp.send(null); // response in onreadystatechange

    // RESPONSE HANDLER FOR 'GET' IP ADDRESS FROM OUR WEBSERVICE
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        if (xmlHttp.responseText) {
          var displayData = JSON.parse(xmlHttp.responseText);
          MOD.Render(displayData);
        }
      } // if xmlHttp...
    }; // onreadystatechange
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ If user needs to know if display geometry changes, use this
/*/ MOD.SetDisplayUpdateCallback = function (
    cbFn
  ) {
    if (cbFn === null || cbFn === undefined) {
      m_subscribe_displayupdate = null;
      return;
    }
    if (typeof cbFn !== 'function') {
      console.error('SetDisplayUpdateCallback: ARG1 must be a valid function');
      return;
    }
    m_subscribe_displayupdate = cbFn;
  };

  /// MAIN API CALL : AUTO RENDER FROM SERVER /////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This utility will grab a liveframe and render it periodically
/*/ MOD.AutoRenderHelper = function (
    addr,
    cbFn
  ) {
    // limit fps between 1..30 frames per second
    if (!u_IsValidAddress(addr))
      throw "AutoRenderHelper: Arg1 should be 'live', 'replay', or 'stop'";
    if (addr === 'stop') {
      clearInterval(AUTORENDER_TIMER);
      AUTORENDER_TIMER = 0;
      console.log('DisplayList.AutoRenderHelper has been disabled.');
      return;
    }
    var periodms = (1 / m_render_fps) * 1000;
    if (AUTORENDER_TIMER !== 0) clearInterval(AUTORENDER_TIMER);

    AUTORENDER_TIMER = setInterval(function () {
      MOD.RenderFrameFromServer(addr);
      if (typeof cbFn === 'function') cbFn();
    }, periodms);

    console.log(
      'DisplayList.AutoRenderHelper is rendering from',
      '/' + addr,
      'at',
      m_render_fps,
      'fps'
    );
  };

  /// MAIN API CALL : SET RENDER FLAGS /////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Disable/Enable specific rendering features. Does not check for valid
	flags; this is just a utility method to set properties.
/*/ MOD.SetRenderFlag = function (
    flag,
    value
  ) {
    if (typeof flag !== 'string')
      throw new Error('Arg1 shoudl be property (string)');
    m_render_flags[flag] = value;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Convenience method to retrieve value of the render flag
/*/ MOD.RenderFlag = function (
    flag
  ) {
    if (typeof flag !== 'string')
      throw new Error('DISPLAYLIST: invalid property passed');
    return m_render_flags[flag];
  };

  /// MAIN API CALL : CAPTURE /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Capture a displayData package from the current Renderer setup!
	Should walk all renderpasses. Send any changes to renderer setup,
	camera setup. A WORK IN PROGRESS

/*/ MOD.Capture = function () {
    // RPDICT is the renderpass dictionary provided by RENDERER
    // VP is the viewport object provided by RENDERER

    // dbgwatch fires once after PeriodWait, used to emit a sample
    // displaylist data structure
    var RPDICT = XRENDERER.RenderPasses();
    var VP = XRENDERER.Viewport();
    var dbgwatch = WATCH('PBDISP-CAPTURE').PeriodWait(1000);

    // prepare to iterate over all renderpasses in RPDICT
    var rpkeys = Object.keys(RPDICT);
    if (DBGOUT && dbgwatch) console.log('RPKEYS DICT', RPDICT);

    var displayData = {}; // the data package
    var vlist = []; // collected visuals from all rpasses
    var vlist_unhandled = {}; // used to count unhandled visuals for reporting
    var dbg_meshes = []; // save unhandled meshes for reporting

    var dbg_meshcount = 1000; // HACK
    for (var i = 0; i < rpkeys.length; i++) {
      // grab renderpass and associated camera
      var key = rpkeys[i];
      var rp = RPDICT[key];
      var cam = rp.camera;
      var visuals = rp.children;

      // iterate over all children in renderpass
      // and capture data by type of child (Sprite, Mesh, etc)
      for (var j = 0; j < visuals.length; j++) {
        var vis = visuals[j];

        // ignore any invisible visuals
        if (!vis.visible) continue;

        // handle each type of visual
        switch (vis.type) {
          case 'Sprite':
            // Sprites in 1401 are our own sprites
            // with extensions for spritesheets (fracWidth,etc)
            var vlobj = {
              uuid: vis.uuid,
              rpass: key,
              type: vis.type,
              subtype: vis.subtype || 'Generic'
            };
            // if there is a simData property, also copy it.
            // this is where you can store any data by type
            // Note this needs to be cloned or subsequent operations
            // will clear affect both the original and the copy.
            if (vis.simData !== undefined) vlobj.simData = JSONClone(vis.simData);

            switch (vis.subtype) {
              case 'Text':
                vlobj.text = vis.text;
                break;
              case 'Bee':
                break;
            }
            vlist.push(f_EncodeSpriteProps(vlobj, vis));

            // Clear any particle system flags
            // We clear it here because we're not capturing every
            // single frame, and particles might get emitted between
            // captures.
            switch (vis.subtype) {
              case 'Bee':
                if (vis.simData.emitPollenCloud) {
                  vis.simData.emitPollenCloud = false;
                }
                if (vis.simData.emitTrailSprite) {
                  vis.simData.emitTrailSprite = false;
                }
                if (vis.simData.emitHeartCount > 0) {
                  vis.simData.emitHeartCount = 0;
                }
                break;
              case 'Flower':
                if (vis.simData.emitPollenCloud) {
                  vis.simData.emitPollenCloud = false;
                }
                if (vis.simData.emitPollinationCloud) {
                  vis.simData.emitPollinationCloud = false;
                }
            }
            break;
          case 'Mesh':
            // Meshes can be one of several subtypes
            // First collect generic mesh properties
            var item = {
              uuid: vis.uuid,
              rpass: key,
              type: vis.type,
              subtype: vis.subtype || 'Generic',
              position: u_TruncateVector(vis.position),
              rotation: u_TruncateFloat(vis.material.rotation),
              opacity: u_TruncateFloat(vis.material.opacity),
              scale: u_TruncateVector(vis.scale),
              visible: vis.visible
            };

            // if there is a simData property, also copy it.
            // this is where you can store any data by type
            if (vis.simData !== undefined) item.simData = vis.simData;

            // Custom mesh objects created by XVISUALFACTORY has
            // a subtype property; add our additional properties
            if (vis.name === 'marker' && --dbg_meshcount > 0) {
              item.subtype = 'Marker';
              item.radius = u_TruncateFloat(vis.radius);
              item.color = vis.material.color.getHex();
              if (vis.savedDashedLines) {
                item.dashedLines = [];
                for (var m = 0; m < vis.savedDashedLines.length; m++) {
                  item.dashedLines.push(
                    u_TruncateDashedLine(vis.savedDashedLines[m])
                  );
                }
              }
              if (vis.area && vis.area.visible) {
                item.areaColor = vis.area.material.color.getHex();
                item.areaOpacity = u_TruncateFloat(vis.area.material.opacity);
              }
              if (vis.surround && vis.surround.visible) {
                item.surrColor = vis.surround.material.color.getHex();
              }
              if (!vis.material.visible) {
                item.hideCircle = true;
              }
              if (vis.lightningCount !== undefined) {
                item.lightningCount = vis.lightningCount;
              }
              if (vis.flameCount !== undefined) {
                item.flameCount = vis.flameCount;
              }
              if (vis.arrowCount !== undefined) {
                item.arrowCount = vis.arrowCount;
              }
              if (vis.darrowCount != undefined) {
                item.darrowCount = vis.darrowCount;
              }
              if (vis.HasCostume()) {
                item.costume = vis.HasCostume();
                item.cscale = vis.costumeScale;
              }
            }
            // check for ActiveRect meshes (a custom subtype)
            switch (vis.subtype) {
              case 'Rect':
                // additional: color, transparent, imgsprite
                item.color = vis.material.color.getHex();
                item.transparent = vis.material.transparent;
                break;
              case 'Meter':
                item.meter = vis.Value();
                break;
            }
            // currently ADD ONLY OUR CUSTOM TYPES
            if (item.subtype !== 'Generic') vlist.push(item);
            // save all meshes so we can compile report
            if (dbgwatch) dbg_meshes.push(vis);
            break;
          case 'Scene':
            // skip scenes
            break;
          default:
            if (!vlist_unhandled[vis.type]) vlist_unhandled[vis.type] = 0;
            vlist_unhandled[vis.type]++;
            break;
        }
      }
    }
    displayData.visuals = vlist;

    // CAPTURE VIEWPORT PROPERTIES and add to displayData
    // note we'll have to add checks for viewport changes instead
    // of just hardcoded when this happens
    if (WATCH('GL_SETUP').PeriodWait(1000)) {
      displayData = m_GetViewportData(displayData);
    }

    // CAPTURE CAMERA PROPERTIES and add to displayData
    // note we'll have to add checks for camera changes, blah blah
    if (WATCH('CAM_SETUP').PeriodWait(1500)) {
      displayData = m_GetCameraData(displayData);
    }

    // DEBUG OUTPUT
    if (dbgwatch) {
      if (DBGOUT) console.log('**** DISPLAY DATA ****', displayData);

      // for (var mm=0;mm<dbg_meshes.length;mm++) {
      // 	console.log(dbg_meshes[mm]);
      // }
      var keys = Object.keys(vlist_unhandled);
      var out = 'BroadcastDisplayData: unhandled types = ';
      if (keys.length) {
        for (var ii = 0; ii < keys.length; ii++) {
          out += keys[ii] + '[' + vlist_unhandled[keys[ii]] + ']';
          if (ii < keys.length - 1) out += ', ';
        }
        if (dbgwatch) {
          console.log(out);
        }
      }
    } // dbgwatch

    // return displaylist of all visuals from all renderpasses
    return displayData;
  };

  /// MAIN API CALL : AUTO RENDER FROM SERVER ///////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This utility will capture displayData and send it back to the caller
/*/ MOD.AutoCaptureHelper = function (
    cbFn
  ) {
    // limit fps between 1..30 frames per second
    var periodms = (1 / m_capture_fps) * 1000;
    if (typeof cbFn !== 'function')
      throw 'AutoCaptureHelper: Arg1 must be a valid function receiving displayData object';
    if (AUTOCAPTURE_TIMER !== 0) clearInterval(AUTOCAPTURE_TIMER);
    AUTOCAPTURE_TIMER = setInterval(function () {
      if (m_disable_capture) return;
      var displayData = MOD.Capture();
      // send displayData back to caller, so it can issue the UNISYS call
      cbFn(displayData);
    }, periodms);
    console.log(
      'DisplayList.AutoCaptureHelper is capturing to /live at',
      m_capture_fps,
      'fps'
    );
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MOD.DisableCapture = () => {
    m_disable_capture = true;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MOD.EnableCapture = () => {
    m_disable_capture = false;
  };

  /// MAIN API CALL : DISPLAYDATA ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MOD.GetDisplayProperties = function (displayData) {
    displayData = displayData || {};
    displayData = m_GetViewportData(displayData);
    displayData = m_GetCameraData(displayData);
    return displayData;
  };
  MOD.SetDisplayProperties = function (displayData) {
    if (DBGOUT) console.group('DISPLAYLIST.SetDisplayProperties');
    m_SetViewportData(displayData);
    m_SetCameraData(displayData);
    if (DBGOUT) console.groupEnd();
  };

  /// API UTILITY FUNCTIONS ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Special zoom factor for background images when scaling down to smaller
	student iPad.  Used primarily in bees-student
/*/ MOD.SetZoomFactor = function (
    zoom
  ) {
    m_zoom_factor = zoom;
  };

  /// MODULE SUPPORT FUNCTIONS //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ The frame reflector on the server can either be /live or /replay
/*/ function u_IsValidAddress(
    addr
  ) {
    return addr === 'live' || addr === 'replay' || addr === 'stop';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ initialize mirror visuals display system
/*/ function m_ConstructMirrorVisuals() {
    m_sprite_pool = new Pool({
      name: 'mirrorSprites',
      size: 10,
      autoAdd: 5,
      maxSize: 2000, // Increase pool size so ipads can be left running
      newFunc: function (counter) {
        var vis = XVISUALFACTORY.MakeDefaultSprite();
        vis.Hide();
        return vis;
      },
      reqHook: function (o) {
        o.Show();
      },
      relHook: function (o) {
        o.Hide();
      }
    });
    if (DBGOUT)
      console.log('InitMirrorDisplay: created sprite pool', m_sprite_pool);
    m_meter_pool = new Pool({
      name: 'mirrorMeterSprites',
      size: 10,
      autoAdd: 5,
      newFunc: function (counter) {
        var vis = XVISUALFACTORY.MakeMeterSprite();
        vis.Hide();
        return vis;
      },
      reqHook: function (o) {
        o.Show();
      },
      relHook: function (o) {
        o.Hide();
      }
    });
    if (DBGOUT)
      console.log('InitMirrorDisplay: created sprite pool', m_meter_pool);
    m_text_pool = new Pool({
      name: 'mirrorTextSprites',
      size: 10,
      autoAdd: 5,
      newFunc: function (counter) {
        var vis = XVISUALFACTORY.MakeTextSprite();
        vis.Hide();
        return vis;
      },
      reqHook: function (o) {
        o.Show();
      },
      relHook: function (o) {
        o.Hide();
      }
    });
    if (DBGOUT) console.log('InitMirrorDisplay: created text pool', m_text_pool);
    m_marker_pool = new Pool({
      name: 'mirrorMarkers',
      size: 100,
      autoAdd: 10,
      markerRadius: 30, // this gets overriden by SetRadius() later
      newFunc: function (counter) {
        var vis = XVISUALFACTORY.MakeMarkerSprite(0.2);
        vis.Hide();
        return vis;
      },
      reqHook: function (o) {
        o.Show();
      },
      relHook: function (o) {
        o.Hide();
      }
    });
    if (DBGOUT)
      console.log('InitMirrorDisplay: created marker pool', m_marker_pool);
    m_rect_pool = new Pool({
      name: 'mirrorRects',
      size: 10,
      autoAdd: 1,
      newFunc: function (counter) {
        var vis = XVISUALFACTORY.MakeRectangle();
        vis.visible = false;
        return vis;
      },
      reqHook: function (o) {
        o.visible = true;
      },
      relHook: function (o) {
        o.visible = false;
      }
    });
    if (DBGOUT) console.log('InitMirrorDisplay: created rect pool', m_rect_pool);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ used to serialize sprite information during Capture,
	returns object for serializing
/*/ function f_EncodeSpriteProps(
    vlobj,
    vis
  ) {
    if (typeof vis.position.x !== 'number') {
      console.log('bad vis', vis);
    } else {
      let temp = Object.assign(vlobj, {
        position: u_TruncateVector(vis.position),
        rotation: u_TruncateFloat(vis.material.rotation),
        opacity: u_TruncateFloat(vis.material.opacity),
        repeat: vis.material.map.repeat,
        offset: vis.material.map.offset,
        scale: u_TruncateVector(vis.scale),
        zoom: vis.zoom,
        fracWidth: vis.fractionalWidth || 1,
        fracHeight: vis.fractionalHeight || 1
      });
      switch (vis.subtype) {
        case 'Text':
          temp.text = vis.text;
          temp.size = vis.textContext.spec.size;
          temp.style = vis.textContext.spec.style;
          temp.family = vis.textContext.spec.family;
          temp.color = vis.textContext.spec.color;
          break;
      }
      let srcfile = vis.material.map.sourceFile;
      // textsprites don't have a map source file, so skip if it's not defined
      if (srcfile) {
        // check for localhost, translate to IP address
        if (srcfile.indexOf('localhost') > 0) {
          let re = /^https?:\/\/localhost/;
          srcfile = srcfile.replace(re, 'http://' + NETDEFS.GetServerIP());
        }
        if (srcfile.indexOf('127.0.0.1') > 0) {
          let re = /^https?:\/\/127\.0\.0\.1/;
          srcfile = srcfile.replace(re, 'http://' + NETDEFS.GetServerIP());
        }
        temp.sourceFile = srcfile;
      }
      return temp;
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ item is display list item. The item.uuid is used to access the
	m_display_dict, which contains { uuid, uuid_alive, visual }
/*/ function f_UpdateMeshEntry(
    item
  ) {
    // is there an entry for this uuid?
    var ddobj = m_display_dict[item.uuid];
    // note: ddobj uses local assignment for callback closure in SetTexture

    // if an item is not yet displayed, initialize it with current properties
    // by grabbing it from a resource pool of the correct type
    if (ddobj === undefined) {
      ddobj = {
        uuid: item.uuid,
        uuid_alive: true,
        visual: null,
        type: item.type,
        subtype: item.subtype,
        rpass: item.rpass
      };
      // request a mesh from a mesh pool based on type
      switch (item.subtype) {
        case 'Generic':
          // not handled for now
          break;
        case 'Marker':
          // THIS IS INITIALIZE ONLY, so REALTIME CHANGES
          // are handled below!!!
          m_marker_pool.markerRadius = item.radius;
          ddobj.visual = m_marker_pool.Request();
          // setRadius here; need to write setRadius for MarkerSprite
          ddobj.visual.SetRadius(item.radius);
          // finally show the damn marker
          ddobj.visual.Show();
          ddobj.visual.HideDashedLines();
          break;
        case 'Rect':
          // THIS IS INITIALIZE ONLY, so REALTIME CHANGES
          // are handled below!!!
          ddobj.visual = m_rect_pool.Request();
          ddobj.visual.visible = true;
          break;
        case 'Meter':
          ddobj.visual = m_meter_pool.Request();
          break;
        default:
          throw (
            'UpdateMeshEntry: vlist_unhandled subtype ' +
            item.type +
            ':' +
            item.subtype
          );
      }
      // add new display data object to m_display_dict
      m_display_dict[item.uuid] = ddobj;
      // add new mesh visual to appropriate renderpass
      f_SceneAddDisplayVisual(ddobj);
    }

    // APPLY REALTIME PROPERTY UPDATES HERE
    // update mesh properties from the item

    var vis;

    // mark alive (again)
    ddobj.uuid_alive = true;
    // dereference
    vis = ddobj.visual;
    // copy position
    vis.position.x = +item.position
      .x; /* HACK - need to translate original coords to new coords in world */
    vis.position.y = +item.position.y; /* HACK */
    vis.position.z = +item.position.z;
    vis.scale.x = item.scale.x;
    vis.scale.y = item.scale.y;
    vis.zoom = item.zoom;
    // copy attributes
    vis.visible = item.visible;
    // opacity should be copied case-by-case
    vis.rotation = item.rotation;

    // handle subtypes of meshes
    switch (item.subtype) {
      case 'Marker':
        // HACK this should pull points out of a Pool
        if (item.color) {
          vis.material.color.set(item.color);
        }
        if (item.dashedLines) {
          // always hide lines first, since they're redrawn every frame
          // this returns the dashes to the pool so they can be reused
          vis.HideDashedLines();

          for (var i = 0; i < item.dashedLines.length; i++) {
            var dash = item.dashedLines[i];
            var p1 = new THREE.Vector3(dash.x1, dash.y1, dash.z1);
            var p2 = new THREE.Vector3(dash.x2, dash.y2, dash.z2);
            vis.DrawDashedLine({ position: p1 }, { position: p2 }, dash.settings);
          }
        } else {
          vis.HideDashedLines();
        }
        // also grab the subvisuals as well
        if (item.areaOpacity) {
          vis.SetAreaEffectOpacity(item.areaOpacity);
          vis.area.material.transparent = true;
        } else {
          vis.area.material.transparent = false;
        }
        if (item.areaColor) {
          vis.SetAreaEffectColor(item.areaColor);
          vis.ShowAreaEffect();
        } else {
          vis.HideAreaEffect();
        }
        if (item.surrColor) {
          vis.SetSurroundColor(item.surrColor);
          vis.ShowSurround();
        } else {
          vis.HideSurround();
        }
        if (item.hideCircle) {
          vis.HideCircle();
        } else {
          vis.ShowCircle();
        }
        if (item.costume) {
          if (vis.HasCostume() !== item.costume)
            vis.SetCostume(item.costume, item.cscale);
        } else {
          vis.HideCostume();
        }

        // RUNTIME DISPLAY OVERRIDES
        //
        // While the rest of the displayList items mirror their source
        // visual parameters, particle flags (e.g. speed arrows) and
        // particle filter (e.g. show only liquid particles) override
        // the source parameters during replay so that teachers and
        // students can notice different aspects of the particle behavior.
        //
        var markerOpacity = item.opacity;
        var fadedOpacity = 0.1; // HACK -- This value should come from settings

        // handle flags
        let filter = MOD.RenderFlag('particleFilter');
        let levelFilter = MOD.RenderFlag('particleLevelFilter');
        var dataValue;
        if (item.simData && filter && filter !== 'mirror') {
          let data = item.simData;
          switch (filter) {
            case 'distance':
              vis.ShowDoubleArrows(data.distance);
              vis.ShowLightning(0);
              vis.ShowArrows(0);
              dataValue = data.distance;
              break;
            case 'energy':
              vis.ShowDoubleArrows(0);
              vis.ShowArrows(0);
              vis.ShowLightning(data.energy);
              dataValue = data.energy;
              break;
            case 'speed':
              vis.ShowArrows(data.speed);
              vis.ShowDoubleArrows(0);
              vis.ShowLightning(0);
              dataValue = data.speed;
              break;
            case 'none':
              vis.ShowArrows(0);
              vis.ShowDoubleArrows(0);
              vis.ShowLightning(0);
              break;
            default:
              throw new Error('DISPLAYLIST: Unknown particleFilter ' + filter);
          }
          // if local override, then don't fade
          markerOpacity = 0.75;
        } else {
          if (item.lightningCount !== undefined)
            vis.ShowLightning(item.lightningCount);
          if (item.flameCount !== undefined) vis.ShowFlames(item.flameCount);
          if (item.arrowCount !== undefined) vis.ShowArrows(item.arrowCount);
          if (item.darrowCount !== undefined)
            vis.ShowDoubleArrows(item.darrowCount);
        }
        // ignore level filters!  if mirroring => use source opacity, if not mirroring => show solid
        // if (levelFilter!==undefined) {
        // 	if ((levelFilter==='low' && dataValue>1) ||
        // 	    (levelFilter==='med' && ((dataValue==1) || (dataValue==3))) ||
        // 	    (levelFilter==='high' && dataValue<3)) {
        // 		markerOpacity = fadedOpacity;
        // 	}
        // }
        // handle filter by bondtype
        let bondTypeFilter = MOD.RenderFlag('particleBondTypeFilter');
        if (bondTypeFilter) {
          if (item.simData && item.simData.bondType !== bondTypeFilter) {
            markerOpacity = fadedOpacity;
          }
        }
        if (
          item.simData.type !== 'wand' &&
          (filter || levelFilter || bondTypeFilter)
        ) {
          vis.SetOpacity(markerOpacity);
        }
        break;

      case 'Rect':
        if (item.color) {
          vis.material.color.set(item.color);
        }
        if (item.transparent) {
          vis.material.transparent = item.transparent;
          vis.material.opacity = item.opacity;
        }
        vis.material.needsUpdate = true;
        break;

      case 'Meter':
        ddobj.visual.SetValue(item.meter);
        break;
      default:
        // unhandled types
        break;
    } // end switch

    return 'mesh ';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ item is display list item. The item.uuid is used to access the
	m_display_dict, which contains { uuid, uuid_alive, visual }
/*/ function f_UpdateSpriteEntry(
    item
  ) {
    // is there an entry for this uuid?
    var ddobj = m_display_dict[item.uuid];
    // note: ddobj uses local assignment for callback closure in SetTexture
    if (ddobj === undefined) {
      // add new display data object to m_display_dict
      ddobj = {
        uuid: item.uuid,
        uuid_alive: true,
        visual: null,
        type: item.type,
        subtype: item.subtype,
        rpass: item.rpass
      };
      // request a sprite from a sprite pool based on type
      switch (item.subtype) {
        case 'Text':
          // THIS IS INITIALIZE ONLY, so REALTIME CHANGES
          // are handled below!!!
          ddobj.visual = m_text_pool.Request();
          // Assume that text specs don't change
          var spec = ddobj.visual.textContext.spec;
          spec.size = item.size;
          spec.style = item.style;
          spec.family = item.family;
          spec.color = item.color;
          break;
        case 'Generic':
        default:
          ddobj.visual = m_sprite_pool.Request();
          break;
      }
      m_display_dict[item.uuid] = ddobj;
      if (DBGOUT)
        console.log(
          'UpdateSpriteEntry: request sprite for:',
          u_ShortUUID(ddobj.uuid),
          'uuids',
          Object.keys(m_display_dict).length
        );
      // add to correct renderpass
      f_SceneAddDisplayVisual(ddobj);
      // initialize the new visual if sourceFile is defined
      if (item.sourceFile) {
        ddobj.visual.SetTexture(item.sourceFile, function (texture) {
          var src1 = u_Filename(ddobj.visual.material.map.sourceFile);
          var src2 = u_Filename(texture.sourceFile);
          var w = texture.image.width;
          var h = texture.image.height;
          if (DBGOUT)
            console.log(
              u_ShortUUID(ddobj.uuid),
              'loaded',
              src1,
              '->',
              src2,
              'wh=',
              w + ',' + h,
              'fwh=',
              item.fracWidth + ',' + item.fracHeight
            );
          w *= item.fracWidth;
          h *= item.fracHeight;
          ddobj.visual.SetScaleXYZ(w, h, 1);
          // note this is an asynch callback, so we call f_CopySpriteProps()
          // after the callback
          f_CopySpriteProps(item, ddobj);
        });
      }
    } else {
      // this is NOT a callback, so call right away
      f_CopySpriteProps(item, ddobj);
    }

    // APPLY REALTIME PROPERTY UPDATES HERE
    // update sprite properties from the item

    var vis;

    // dereference
    vis = ddobj.visual;
    // CODE REVIEW
    // Are these necessary here?
    // Is this a remnant of the approach from f_UpdateMeshEntry?
    // Or is this necessary to force OpenPTrack strings to numbers?
    // Make sure OpenPTrack data is not affected before removing!
    vis.position.x = +item.position.x; // force string to number
    vis.position.y = +item.position.y;
    vis.position.z = +item.position.z;

    // Handle subtypes
    switch (item.subtype) {
      case 'Bee':
        if (item.simData) {
          if (item.simData.emitPollenCloud) {
            VFX.EmitPollenCloud(
              vis.position.x,
              vis.position.y,
              0,
              DEF.ENUM.RENDERPASSES.Mirror
            );
          }
          if (item.simData.emitTrailSprite) {
            VFX.EmitTrailSprite(
              vis.position.x,
              vis.position.y,
              0,
              item.simData.pollenColor,
              DEF.ENUM.RENDERPASSES.Mirror
            );
          }
          if (item.simData.emitHeartCount > 0) {
            VFX.EmitHearts(
              item.simData.emitHeartCount,
              vis.position.x,
              vis.position.y,
              0,
              DEF.ENUM.RENDERPASSES.Mirror
            );
          }
        }
        break;
      case 'Flower':
        if (item.simData) {
          if (item.simData.emitPollenCloud) {
            VFX.EmitPollenCloud(
              vis.position.x,
              vis.position.y,
              0,
              DEF.ENUM.RENDERPASSES.Mirror
            );
          }
          if (item.simData.emitPollinationCloud) {
            VFX.EmitPollinationCloud(
              vis.position.x,
              vis.position.y,
              0,
              DEF.ENUM.RENDERPASSES.Mirror
            );
          }
        }
        break;
      case 'Text':
        ddobj.visual.SetText(item.text);
        // uncomment this to allow text specs to change with every frame.
        // var spec    = ddobj.visual.textContext.spec;
        // spec.size   = item.size;
        // spec.style  = item.style;
        // spec.family = item.family;
        // spec.color  = item.color;
        break;
      case 'Background':
      default:
        // unhandled types
        break;
    }

    return 'sprite' + item.sourceFile + ' ';
  } // f_UpdateSprite

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ update the visual by copying properties from item to ddo

/*/ function f_CopySpriteProps(
    item,
    ddobj
  ) {
    var vis, vismat, vismap;
    // mark alive (again)
    ddobj.uuid_alive = true;
    // dereference
    vis = ddobj.visual;
    vismat = vis.material;
    vismap = vismat.map;
    // copy position
    vis.position.x = +item.position.x;
    vis.position.y = +item.position.y;
    vis.position.z = +item.position.z;
    vis.scale.x = item.scale.x;
    vis.scale.y = item.scale.y;
    vis.zoom = item.zoom;
    /*/ Apply the zoom property
			The other property values are set automatically by ThreeJS,
			but `zoom` is our own custom property for scaling sprites,
			so it must be called explicitly to set (See sprite.js).

			Not all sprites are InqSprites, so we need to check
			if SetZoom method exists.

			If the zoom hasn't been set, we use the m_zoom_factor setting
			that is defined when DISPLAYLIST is first set up.
			See bees2-student/game-run.onDisplayUpdate() method for example
			of the call.

			This is generally used for scaling the background image down to fit the
			smalller student iPads.

			CODE REVIEW:
			If we call SetZoom for non-background sprites, e.g. the beesprite
			sun, and nectary sprites, the mirrored sprite ends up very large
			even though zoom is 1, and scale is 1, and it has been previously
			set.  We're not sure why.  Maybe InqSprite.SetScaleXYZ is setting
			zoom relative to the current scale?  So every time you call zoom
		/*/
    if (item.subtype === 'Background' && vis.SetZoom) {
      let itemzoom = item.zoom || m_zoom_factor;
      vis.SetZoom(itemzoom);
      // console.log(item.sourceFile,'zoom',item.zoom);
    }

    // copy material and map props
    vismat.opacity = item.opacity;
    vismat.rotation = item.rotation;
    vismap.repeat.x = item.repeat.x;
    vismap.repeat.y = item.repeat.y;
    vismap.offset.x = item.offset.x;
    vismap.offset.y = item.offset.y;
  } // f_CopySpriteProps

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ call this when a sprite is no longer being updated
/*/ function f_DeleteDisplayEntry(
    ddobj
  ) {
    switch (ddobj.type) {
      case 'Sprite':
        if (DBGOUT)
          console.log(
            'DeleteDisplayEntry: remove sprite for',
            u_ShortUUID(ddobj.uuid)
          );
        if (ddobj.subtype == 'Text') m_text_pool.Release(ddobj.visual);
        if (ddobj.subtype == 'Generic') m_sprite_pool.Release(ddobj.visual);
        break;
      case 'Mesh':
        if (DBGOUT)
          console.log(
            'DeleteDisplayEntry: remove mesh for',
            u_ShortUUID(ddobj.uuid)
          );
        if (ddobj.subtype == 'Marker') m_marker_pool.Release(ddobj.visual);
        if (ddobj.subtype == 'Rect') m_rect_pool.Release(ddobj.visual);
        break;
      default:
        throw 'DeleteDisplayEntry: unknown ddobj.type: ' + ddobj.type;
    }
    f_SceneRemoveDisplayVisual(ddobj);
    delete m_display_dict[ddobj.uuid];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ call this when adding a ddobj visual to scene on creation
/*/ function f_SceneAddDisplayVisual(
    ddobj
  ) {
    switch (ddobj.rpass) {
      case 'RP_BG':
        XRENDERER.AddMirrorBG(ddobj.visual);
        break;
      case 'RP_WORLD':
        XRENDERER.AddMirrorWORLD(ddobj.visual);
        break;
      case 'RP_WORLD2':
        XRENDERER.AddMirrorWORLD2(ddobj.visual);
        break;
      case 'RP_UI':
        XRENDERER.AddMirrorUI(ddobj.visual);
        break;
      case 'RP_OVER':
        XRENDERER.AddMirrorOVER(ddobj.visual);
        break;
      case 'RP_SUPER':
        XRENDERER.AddMirrorSUPER(ddobj.visual);
        break;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ call this when removing a ddobj visual when it's gone out of spec
/*/ function f_SceneRemoveDisplayVisual(
    ddobj
  ) {
    switch (ddobj.rpass) {
      case 'RP_BG':
        XRENDERER.RemoveMirrorBG(ddobj.visual);
        break;
      case 'RP_WORLD':
        XRENDERER.RemoveMirrorWORLD(ddobj.visual);
        break;
      case 'RP_WORLD2':
        XRENDERER.RemoveMirrorWORLD2(ddobj.visual);
        break;
      case 'RP_UI':
        XRENDERER.RemoveMirrorUI(ddobj.visual);
        break;
      case 'RP_OVER':
        XRENDERER.RemoveMirrorOVER(ddobj.visual);
        break;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Get Viewport displayData
/*/ function m_GetViewportData(displayData) {
    displayData = displayData || {};
    var VP = XRENDERER.Viewport();
    var gl = VP.WebGL();
    displayData.viewport = {
      'renderWidth': gl.domElement.width,
      'renderHeight': gl.domElement.height,
      'worldUnits': VP.worldUnits
    };
    return displayData;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Set Viewport displayData
/*/ function m_SetViewportData(displayData) {
    var VP = XRENDERER.Viewport();
    // HANDLE RENDERER CHANGES
    if (displayData.viewport) {
      if (DBGOUT) console.info('GOT DISPLAY VIEWPORT', displayData.viewport);

      var rw = displayData.viewport.renderWidth;
      var rh = displayData.viewport.renderHeight;
      VP.SetDimensions(rw, rh);
      // renderer is resized, but sprites are also stretched
      // also, the big sprite in the middle is very small still compared to the size
      // it's supposed to be
      var wu = displayData.viewport.worldUnits;
      VP.SizeWorldToViewport(wu);
      // no visual change, since this just updates some variables without touching
      // any of the rendered object properties
      VP.UpdateWorldCameras();
      // after updating projection matrices, all the sprites get huge
      // the big sprite in the middle is maybe the right size!
      VP.UpdateViewportCameras();
      // background camera is fixed, so the background is no longer scaled

      // return true if values were set
      return true;
    }
    // return false if no viewport properties changed
    return false;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Get DisplayData
/*/ function m_GetCameraData(displayData) {
    displayData = displayData || {};
    var VP = XRENDERER.Viewport();
    displayData.cameras = {
      '2D': {
        // VP.cam2D
        position: VP.cam2D.position,
        bottom: VP.cam2D.bottom,
        left: VP.cam2D.left,
        right: VP.cam2D.right,
        top: VP.cam2D.top,
        near: VP.cam2D.near,
        far: VP.cam2D.far
      },
      '3D': {
        // VP.cam3D
        position: VP.cam3D.position,
        fov: VP.cam3D.fov,
        aspect: VP.cam3D.aspect,
        near: VP.cam3D.near,
        far: VP.cam3D.far,
        up: VP.cam3D.up,
        quat: VP.cam3D.quaternion
      },
      'BG': {
        // VP.camBG
        position: VP.camBG.position,
        bottom: VP.camBG.bottom,
        left: VP.camBG.left,
        right: VP.camBG.right,
        top: VP.camBG.top,
        near: VP.camBG.near,
        far: VP.camBG.far
      },
      'SCREEN': {
        // VP.camSCREEN
        position: VP.camSCREEN.position,
        bottom: VP.camSCREEN.bottom,
        left: VP.camSCREEN.left,
        right: VP.camSCREEN.right,
        top: VP.camSCREEN.top,
        near: VP.camSCREEN.near,
        far: VP.camSCREEN.far
      },
      'DMODE': '2D'
    };
    if (VP.cam3D === VP.camWORLD) displayData.cameras.DMODE = '3D';
    return displayData;
  }
  function m_SetCameraData(displayData) {
    var cam, cam_props;
    var VP = XRENDERER.Viewport();
    // HANDLE CAMERA CHANGES - DEPENDENT ON VIEWPORT DIMENSIONS
    if (displayData.cameras) {
      if (DBGOUT) console.info('GOT DISPLAY CAMERAS', displayData.cameras);
      // check 2D world camera
      cam_props = displayData.cameras['2D'];
      if (cam_props) {
        cam = VP.WorldCam2D();
        u_Copy2DCameraProps(cam_props, cam);
      }
      // check 3D world camera
      cam_props = displayData.cameras['3D'];
      if (cam_props) {
        cam = VP.WorldCam3D();
        cam.position.set(
          cam_props.position.x,
          cam_props.position.y,
          cam_props.position.z
        );
        cam.up.set(cam_props.up.x, cam_props.up.y, cam_props.up.z);
        cam.quaternion.set(
          cam_props._w,
          cam_props._x,
          cam_props._y,
          cam_props._z
        );
        cam.fov = cam_props.fov;
        cam.aspect = cam_props.aspect;
        cam.near = cam_props.near;
        cam.far = cam_props.far;
      }
      // check BG camera
      cam_props = displayData.cameras.BG;
      if (cam_props) {
        cam = VP.BackgroundCam();
        u_Copy2DCameraProps(cam_props, cam);
      }
      // check SCREEN camera
      cam_props = displayData.cameras.SCREEN;
      if (cam_props) {
        cam = VP.ScreenCam();
        u_Copy2DCameraProps(cam_props, cam);
      }
      // now, update cameras
      VP.UpdateWorldCameras();
      VP.UpdateViewportCameras();

      // return true if any properties may have been set
      return true;
    }
    // return falsae if the camera data structure wasn't there
    return false;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ copy common properties for 2D cameras
/*/ function u_Copy2DCameraProps(
    props,
    cam2D
  ) {
    cam2D.position.set(props.position.x, props.position.y, props.position.z);
    cam2D.bottom = props.bottom;
    cam2D.left = props.left;
    cam2D.right = props.right;
    cam2D.top = props.top;
    cam2D.near = props.near;
    cam2D.far = props.far;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function u_Filename(name) {
    var arr = name.split('/');
    return arr[arr.length - 1];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function u_ShortUUID(uuid) {
    var arr = uuid.split('-');
    return arr[0];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Truncate to reduce file size.
	Some values can be undefined, so we make sure it's a float before truncating
/*/ function u_TruncateFloat(
    float
  ) {
    if (typeof float === 'number') return float.toPrecision(3);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function u_TruncateVector(vectorish) {
    return {
      x: vectorish.x.toPrecision(3),
      y: vectorish.y.toPrecision(3),
      z: vectorish.z.toPrecision(3)
    };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function u_TruncateDashedLine(dl) {
    if (dl) {
      if (typeof dl.x1 === 'number') {
        dl.x1 = dl.x1.toPrecision(3);
        dl.y1 = dl.y1.toPrecision(3);
        dl.z1 = dl.z1.toPrecision(3);
        dl.x2 = dl.x2.toPrecision(3);
        dl.y2 = dl.y2.toPrecision(3);
        dl.z2 = dl.z2.toPrecision(3);
      }
      if (dl.settings && dl.settings.dashPattern) {
        for (let i = 0; i < dl.settings.dashPattern.length; i++) {
          let dash = dl.settings.dashPattern[i];
          if (typeof dash.from === 'number') {
            dash.from = dash.from.toPrecision(3);
            dash.to = dash.to.toPrecision(3);
          }
          if (typeof dash.width === 'number') {
            dash.width = dash.width.toPrecision(3);
          }
        }
      }
    }
    return dl;
  }

  /*/	Clone Object
	We use this to make a clone of simData objects,
	otherwise we end up passing the same object around to every newly
	created trace.
	http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/5344074#5344074
/*/ function JSONClone(
    obj
  ) {
    return JSON.parse(JSON.stringify(obj));
  }

  ///////////////////////////////////////////////////////////////////////////////
  /** SNEAKY CONSOLE INTERFACE *************************************************\

	FOR JAVASCRIPT CLI DEBUGGING. DO NOT CALL FROM ACTUAL CODE.

\*****************************************************************************/

  window.TSetRenderFlag = function (flag, value) {
    MOD.SetRenderFlag(flag, value);
    return 'DISPLAYLIST.TSetRenderFlag:' + flag + ' set to ' + value;
  };
  window.TRenderFlags = function () {
    console.log('DISPLAYLIST.TRenderFlags returning m_render_flags object');
    return m_render_flags;
  };

  ///////////////////////////////////////////////////////////////////////////////
  /** RETURN MODULE ************************************************************/
  return MOD;
});
