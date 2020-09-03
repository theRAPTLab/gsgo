/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tracker - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as PIXI from 'pixi.js';

import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    display: 'grid',
    width: '100vw',
    height: '100vh',
    gridTemplateColumns: 'repeat(12,1fr)',
    gridTemplateRows: '50px 1fr 100px',
    gridGap: theme.spacing(1)
  }
});

/// CONSTANTS /////////////////////////////////////////////////////////////////
function m_scaleToWindow(canvas, backgroundColor) {
  let scaleX;
  let scaleY;
  let scale;
  let center;

  //1. Scale the canvas to the correct size
  //Figure out the scale amount on each axis
  scaleX = window.innerWidth / canvas.offsetWidth;
  scaleY = window.innerHeight / canvas.offsetHeight;

  //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
  scale = Math.min(scaleX, scaleY);
  canvas.style.transformOrigin = '0 0';
  canvas.style.transform = `scale(${scale})`;

  //2. Center the canvas.
  //Decide whether to center the canvas vertically or horizontally.
  //Wide canvases should be centered vertically, and
  //square or tall canvases should be centered horizontally
  if (canvas.offsetWidth > canvas.offsetHeight) {
    if (canvas.offsetWidth * scale < window.innerWidth) {
      center = 'horizontally';
    } else {
      center = 'vertically';
    }
  } else if (canvas.offsetHeight * scale < window.innerHeight) {
    center = 'vertically';
  } else {
    center = 'horizontally';
  }

  //Center horizontally (for square or tall canvases)
  let margin;
  if (center === 'horizontally') {
    margin = (window.innerWidth - canvas.offsetWidth * scale) / 2;
    canvas.style.marginTop = '0px';
    canvas.style.marginBottom = '0px';
    canvas.style.marginLeft = `${margin}px`;
    canvas.style.marginRight = `${margin}px`;
  }

  //Center vertically (for wide canvases)
  if (center === 'vertically') {
    margin = (window.innerHeight - canvas.offsetHeight * scale) / 2;
    canvas.style.marginTop = `${margin}px`;
    canvas.style.marginBottom = `${margin}px`;
    canvas.style.marginLeft = '0px';
    canvas.style.marginRight = '0px';
  }

  //3. Remove any padding from the canvas  and body and set the canvas
  //display style to "block"
  canvas.style.paddingLeft = '0px';
  canvas.style.paddingRight = '0px';
  canvas.style.paddingTop = '0px';
  canvas.style.paddingBottom = '0px';
  canvas.style.display = 'block';

  //4. Set the color of the HTML body background
  document.body.style.backgroundColor = backgroundColor;

  //Fix some quirkiness in scaling for Safari
  let ua = navigator.userAgent.toLowerCase();
  if (ua.indexOf('safari') !== -1) {
    if (ua.indexOf('chrome') > -1) {
      // Chrome
    } else {
      // Safari
      //canvas.style.maxHeight = "100%";
      //canvas.style.minHeight = "100%";
    }
  }

  //5. Return the `scale` value. This is important, because you'll nee this value
  //for correct hit testing between the pointer and sprites
  return scale;
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Tracker extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    console.log('constructed Tracker');
  }

  componentDidMount() {
    console.log('componentDidMount Tracker');
    let type = 'WebGL';
    if (!PIXI.utils.isWebGLSupported()) {
      type = 'canvas';
    }
    PIXI.utils.sayHello(type);
    document.body.style.margin = '0px';
    //
    this.app = new PIXI.Application({ width: 512, height: 512 });
    this.app.renderer.autoResize = true;
    this.app.renderer.view.style.position = 'absolute';
    this.app.renderer.view.style.display = 'block';
    this.div_pixi = document.getElementById('root-pixi');
    this.div_pixi.innerHTML = '';
    this.div_pixi.appendChild(this.app.view);
    this.app.renderer.resize(
      this.div_pixi.offsetWidth,
      this.div_pixi.offsetHeight
    );

    window.addEventListener('resize', () => {
      this.app.renderer.resize(
        this.div_pixi.offsetWidth,
        this.div_pixi.offsetHeight
      );
    });
  }

  componentWillUnmount() {
    console.log('componentWillUnmount Tracker');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div
          style={{
            gridColumnEnd: 'span 12',
            backgroundColor: 'lightcyan',
            padding: '10px'
          }}
        >
          header
        </div>
        <div style={{ gridColumnEnd: 'span 2', backgroundColor: 'lavender' }}>
          left
        </div>
        <div
          id="root-pixi"
          style={{
            gridColumnEnd: 'span 8',
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          mid
        </div>
        <div style={{ gridColumnEnd: 'span 2', backgroundColor: 'lavender' }}>
          right
        </div>
        <div style={{ gridColumnEnd: 'span 12', backgroundColor: 'thistle' }}>
          footer
        </div>
      </div>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for URSYS MODULES and COMPONENTS
Tracker.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStyles)(Tracker);
