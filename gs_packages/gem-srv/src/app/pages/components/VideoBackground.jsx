import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import 'lib/css/gem-ui.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('VideoBackground');
const DBG = false;

class VideoBackground extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Video Background',
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      mirrorX: false,
      mirrorY: false
    };
    this.startVideo = this.startVideo.bind(this);
    this.updateValue = this.updateValue.bind(this);
  }

  componentDidMount() {
    this.startVideo();
  }

  componentWillUnmount() {}

  startVideo() {
    if (navigator.mediaDevices === undefined) {
      console.error(
        'The current document is not loaded securely or the ' +
          'browser does not support the Media Devices API.'
      );
      return;
    }

    const CAMERA_FRAMES_PER_SECOND = 30;
    const DESIRED_VIDEOSTREAM_WIDTH = 800; // match pixi 1024;
    const DESIRED_VIDEOSTREAM_HEIGHT = 400; // 768;

    let cameraStream = null;

    navigator.mediaDevices.ondevicechange = event => {
      // Monitor for device changes in the event that the the user camera
      //  was not ready when the page was loaded and it is later plugged in
      // Note: This gets called twice per device change
      console.log('User media device change');

      if (!cameraStream || !cameraStream.active) {
        streamWebcam();
      }
    };

    var video = document.querySelector('#videoElement');
    var transformedVideo = document.querySelector('#transformed-video');
    var ctx = transformedVideo.getContext('2d');

    // Draw the video element onto the canvas at the desired framerate, applying
    //  transformations
    video.addEventListener('play', () => {
      console.log('Video started');

      const { scaleX, scaleY, translateX, translateY, rotate, mirrorX, mirrorY } =
        this.state;
      const loop = () => {
        console.log('loop', scaleX);
        if (!video.paused && !video.ended) {
          const videoHeight = video.videoHeight;
          const videoWidth = video.videoWidth;
          const drawHeight = transformedVideo.height;
          const drawWidth = transformedVideo.width;

          // Black fill the buffer to prevent lingering visual artifacts should
          //  the user scale the image below the canvas dimensions
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillRect(0, 0, drawWidth, drawHeight);

          // Translate to the center of the canvas, so further transforms
          //  occur about the center
          ctx.translate(drawWidth / 2, drawHeight / 2);

          // Apply other translations to the image
          ctx.translate(translateX, translateY);
          ctx.rotate((rotate * Math.PI) / 180);
          ctx.scale((mirrorX ? -1 : 1) * scaleX, (mirrorY ? -1 : 1) * scaleY);

          // Draw the frame image and compensate for the origin shift
          ctx.drawImage(video, -(videoWidth / 2), -(videoHeight / 2));

          setTimeout(loop, 1000 / CAMERA_FRAMES_PER_SECOND);
        }
      };

      loop();
    });

    // const that = this;
    // video.addEventListener('loadedmetadata', function () {
    //   console.warn(`Stream size: ${video.videoWidth}x${video.videoHeight}`);
    //   console.log(
    //     'transformedVideo',
    //     transformedVideo.width,
    //     transformedVideo.height
    //   );
    //   // Set an initial scaling to make the video fill the canvas
    //   const scaleX = transformedVideo.width / video.videoWidth;
    //   const scaleY = transformedVideo.height / video.videoHeight;
    //   // that.setState({ scaleX, scaleY });
    //   // console.warn(`Scaled to ${scaleX}:${scaleY}`);
    // });

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
  }

  updateValue(e) {
    // console.log('e.target', e.target, e.target.value);
    // this.setState(updatedObj);
    const id = e.target.id;
    const val = Number(e.target.value);
    let key;
    if (id === 'scalex-slider') key = 'scaleX';
    const setting = {};
    setting[key] = val;
    console.log('setting', setting);
    this.setState(setting);
    this.startVideo();
  }

  render() {
    const { title, scaleX } = this.state;
    const { id, width, height, scale, bgcolor, isActive, onClick, classes } =
      this.props;

    // console.log('render', width, height, scale);

    return (
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <canvas
          id="transformed-video"
          width={820 * scale.x}
          height={420 * scale.y}
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
              value={scaleX}
              step="0.1"
              onInput={this.updateValue}
            />
            <input
              id="scaley-slider"
              type="range"
              min="0.1"
              max="5"
              value="1"
              step="0.1"
              onInput={e => this.updateValue({ scaleY: e.target.value })}
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
              value="0"
              onInput={e => this.updateValue({ translateX: e.target.value })}
            />
            <input
              id="translatey-slider"
              type="range"
              min="-500"
              max="500"
              value="0"
              onInput={e => this.updateValue({ translateY: e.target.value })}
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
              value="0"
              onInput={e => this.updateValue({ rotate: e.target.value })}
            />
            &nbsp; &nbsp;
          </div>

          <div className="vidcontrol">
            <span>Mirror:</span>
            <input
              id="mirror-x"
              type="checkbox"
              value="false"
              onInput={e => this.updateValue({ mirrorX: e.target.checked })}
            />
            <input
              id="mirror-y"
              type="checkbox"
              value="false"
              onInput={e => this.updateValue({ mirrorX: e.target.checked })}
            />
          </div>
        </div>
        <video autoPlay={true} id="videoElement" style={{ display: 'none' }} />
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(VideoBackground);
