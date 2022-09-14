/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WebCam

  This adds a background div behind the simulation render with a
  video stream from a camera attached to the server.

  Currently only tested on Chrome.
  You'll need to allow permissions to access the camera.
  You should be able to select the camera source using
  Chrome's "Privacy and security" > "Site settings" > "Camera".


  Activating
  ----------
  The "WebCam" checkbox on Main (navbar) will turn the camera on
  and off.


  Calibration
  -----------
  When the camera is on, you can use the sliders to change:
  * Scale
  * Translation (x/y offset)
  * Rotation
  * Mirroring (horizontal/vertical)
  The settings are saved immediately to the project file
  and will be loaded the next time you load the project.
  (This includes the webcam on/off status).

  Because each project can specify its own simulation world size
  (aka "boundaries"), the webcam settings are specific to each
  project.  This means that you will need to load and adjust the
  camera for each game.  Advanced users can just copy and paste
  the relevant metadata values from one project to another if the
  projects are the same size.  If the projects are not the same
  size, the mappings may be off.


  How It Works
  ------------
  Basically this works by adding a <video> component that
  streams video from the webcam, then transforms and copies
  images from that video onto a canvas 30 frames per second.

  PanelSimulation places the video canvas behind the simulation.
  This is necessary so that the agent instances remain
  selectable by the mouse.


  Project Design Considerations
  -----------------------------
  The layering of the video UNDERNEATH the simulation layer
  means that the simulation layer needs to be transparent.
  This has some serious implications for project design:
  * If a project is using a solid color background, we
    render that background with a 50% alpha so that
    the video is visible underneath.
  * This will be a problem for projects (like decmoposition)
    that use a solid background image.  The video will
    be hidden on these projects.  The workaround is
    set alpha to 0.5 on background agents.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useEffect, useState } from 'react';
import UR from '@gemstep/ursys/client';
import * as ACMetadata from 'modules/appcore/ac-metadata';
import 'lib/css/gem-ui.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

const CAMERA_FRAMES_PER_SECOND = 30;
const DESIRED_VIDEOSTREAM_WIDTH = 1024;
const DESIRED_VIDEOSTREAM_HEIGHT = 768;

let AUTOTIMER;

let video;
let transformedVideo;
let ctx;
let cameraStream;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default function WebCam(props) {
  const [metadata, setMetadata] = useState();

  if (navigator.mediaDevices === undefined) {
    console.error(
      'The current document is not loaded securely or the ' +
        'browser does not support the Media Devices API.'
    );
    return;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function LoadMetaData() {
    setMetadata(ACMetadata.GetMetadata());
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// run once on component did mount
  useEffect(() => {
    UR.HandleMessage('WEBCAM_UPDATE', LoadMetaData); // Called by Main when 'WebCam' checkbox changes

    // returned function is called on component unmount
    return () => {
      UR.UnhandleMessage('WEBCAM_UPDATE', LoadMetaData); // Called by Main when 'WebCam' checkbox changes
    };
  }, []); // [] ensures useEffect runs just once

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// metadata update --  adjust size after metadata is loaded
  useEffect(() => {
    if (!metadata) {
      if (DBG) console.log('...waiting for metadata load');
      return;
    }

    if (!metadata.showWebCam) return;

    cameraStream = null;

    navigator.mediaDevices.ondevicechange = event => {
      // Monitor for device changes in the event that the the user camera
      // was not ready when the page was loaded and it is later plugged in
      // Note: This gets called twice per device change
      if (DBG) console.log('User media device change');
      if (!cameraStream || !cameraStream.active) {
        streamWebcam();
      }
    };

    video = document.querySelector('#videoElement');
    transformedVideo = document.querySelector('#transformed-video');
    ctx = transformedVideo.getContext('2d');

    // Draw the video element onto the canvas at the desired framerate, applying
    // transformations
    video.addEventListener('play', () => {
      if (DBG) console.log('Video started');
      // Placeholder.  Loop used to be defined and started here.
      // But is now in main function so it's clearer that it runs
      // continuously.
    });

    // 'loadedmetadata' is a video stream event
    video.addEventListener('loadedmetadata', function () {
      if (DBG)
        console.log(
          `loadedmetadata: Stream size: ${video.videoWidth}x${video.videoHeight} transformedVideo ${transformedVideo.width}x${transformedVideo.height}`
        );
      // Placeholder. This used to set the initial scale to fill
      // the canvas.  But ac-metadata values now override these.
      //
      // Set an initial scaling to make the video fill the canvas
      // scaleX = transformedVideo.width / video.videoWidth;
      // scaleY = transformedVideo.height / video.videoHeight;
    });

    // Governs the selection of a media devices, the API will attempt to
    //  satisfy the given constraints
    const constraints = {
      video: {
        width: DESIRED_VIDEOSTREAM_WIDTH,
        height: DESIRED_VIDEOSTREAM_HEIGHT
      }
    };

    let streamStarting = false;
    const streamWebcam = () => {
      // Prevent multiple calls from asking for user permission multiple times
      if (streamStarting) return;
      streamStarting = true;

      // Search for attached user media devices (cameras, microphones, speakers)
      //  that meet the constraints passed in, in this case, just a video device
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(stream => {
            cameraStream = stream;
            // .. with a stream in hand, it can be bound to certain HTML elements
            //  such as <video> that are valid sinks for the stream
            video.srcObject = cameraStream;
          })
          .catch(error => {
            // Unfortunately, the errors generated by Chrome and Firefox are
            //  different :\
            // See: https://blog.addpipe.com/common-getusermedia-errors/
            switch (error.name) {
              case 'NotFoundError':
              case 'DevicesNotFoundError':
              case 'OverconstrainedError':
              case 'ConstraintNotSatisfiedError':
                console.error('An appropriate web camera could not be found.');
                break;
              case 'NotReadableError':
              case 'TrackStartError':
              case 'AbortError':
                console.error('The web camera is already in use.');
                break;
              case 'NotAllowedError':
              case 'PermissionDeniedError':
                console.error(
                  'The user denied permission to access the web ' + 'camera.'
                );
                break;
              default:
                console.error(
                  `An unexpected error occured: ` +
                    `${error.name}:${error.message}`
                );
            }
          })
          .finally(() => (streamStarting = false));
      }
    };

    streamWebcam();
  }, [metadata]); // useEffect

  // RENDER PREP ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const m = metadata || {};

  if (!m.showWebCam) return null;

  if (video && !video.paused && !video.ended) {
    const videoHeight = video.videoHeight;
    const videoWidth = video.videoWidth;
    const drawHeight = transformedVideo.height;
    const drawWidth = transformedVideo.width;

    // LOOP!!!!  Copy video frames from <video> to <canvas> at 30fps
    setInterval(() => {
      // Black fill the buffer to prevent lingering visual artifacts should
      // the user scale the image below the canvas dimensions
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillRect(0, 0, drawWidth, drawHeight);

      // Translate to the center of the canvas, so further transforms
      // occur about the center
      ctx.translate(drawWidth / 2, drawHeight / 2);

      // Apply other translations to the image
      ctx.translate(m.translateX, m.translateY);
      ctx.rotate((m.rotate * Math.PI) / 180);
      ctx.scale((m.mirrorX ? -1 : 1) * m.scaleX, (m.mirrorY ? -1 : 1) * m.scaleY);

      // Draw the frame image and compensate for the origin shift
      ctx.drawImage(video, -(videoWidth / 2), -(videoHeight / 2));
    }, 1000 / CAMERA_FRAMES_PER_SECOND);
  }
  // END LOOP ///////////////////////////////////////////////////////////////////

  /// FORM HANDLING /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Queue writes to project file
  function WriteMetaData() {
    if (AUTOTIMER) clearInterval(AUTOTIMER);
    AUTOTIMER = setInterval(() => {
      void (async () => {
        UR.CallMessage('METADATA_UPDATE', { metadata }).then(() => {
          clearInterval(AUTOTIMER);
          AUTOTIMER = 0;
        });
      })();
    }, 1000);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const UpdateForm = e => {
    setMetadata(md => {
      const id = e.target.id;
      let key;
      let value = e.target.value;
      if (id === 'scalex-slider') key = 'scaleX';
      if (id === 'scaley-slider') key = 'scaleY';
      if (id === 'translatex-slider') key = 'translateX';
      if (id === 'translatey-slider') key = 'translateY';
      if (id === 'rotate-slider') key = 'rotate';
      if (id === 'mirror-x') {
        key = 'mirrorX';
        value = e.target.checked;
      }
      if (id === 'mirror-y') {
        key = 'mirrorY';
        value = e.target.checked;
      }
      md[key] = value;
      WriteMetaData(md);
      return md;
    });
  };

  // RENDER ///////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      <canvas
        id="transformed-video"
        width={props.width}
        height={props.height}
        style={{
          zIndex: 1,
          opacity: 0.5
        }}
      />
      <div className="vidcontrollers">
        <div className="vidcontrol">
          <span>Scale:</span>
          <input
            id="scalex-slider"
            type="range"
            min="0.1"
            max="5"
            step="0.05"
            value={m.scaleX}
            onChange={UpdateForm}
          />
          <input
            id="scaley-slider"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={m.scaleY}
            onChange={UpdateForm}
          />
          &nbsp; &nbsp;
        </div>

        <div className="vidcontrol">
          <span>Translate:</span>
          <input
            id="translatex-slider"
            type="range"
            min="-500"
            max="500"
            value={m.translateX}
            onChange={UpdateForm}
          />
          <input
            id="translatey-slider"
            type="range"
            min="-500"
            max="500"
            value={m.translateY}
            onChange={UpdateForm}
          />
          &nbsp; &nbsp;
        </div>

        <div className="vidcontrol">
          <span>Rotate:</span>
          <input
            id="rotate-slider"
            type="range"
            min="0"
            max="360"
            value={m.rotate}
            onChange={UpdateForm}
          />
          &nbsp; &nbsp;
        </div>

        <div className="vidcontrol">
          <span>Mirror:</span>
          <input
            id="mirror-x"
            type="checkbox"
            value={m.mirrorX}
            onChange={UpdateForm}
          />
          <input
            id="mirror-y"
            type="checkbox"
            value={m.mirrorY}
            onChange={UpdateForm}
          />
        </div>
      </div>
      <video autoPlay={true} id="videoElement" style={{ display: 'none' }} />
    </div>
  );
}
