/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Home - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('HOME', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');
const BG_COLOR = '#F0F0F0';
const BG_TITLE = '#404040';

/// STYLES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = theme => ({
  root: {
    display: 'grid',
    width: '100vw',
    height: '100vh',
    gridTemplateColumns: '240px auto 120px',
    //  gridTemplateColumns: 'repeat(12,1fr)',
    gridTemplateRows: '50px 1fr 100px',
    gridGap: theme.spacing(1)
  },
  cell: {
    padding: '5px',
    whiteSpace: 'prep',
    fontFamily: 'monospace'
  }
});

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Home extends React.Component {
  componentDidMount() {
    // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
  }

  componentWillUnmount() {
    console.log('componentWillUnmount Home');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div
          id="console-top"
          className={classes.cell}
          style={{
            gridColumnEnd: 'span 3',
            color: 'white',
            backgroundColor: BG_TITLE
          }}
        >
          <span style={{ fontSize: '32px' }}>INDEX</span>
        </div>
        <div
          id="console-left"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 1', backgroundColor: BG_COLOR }}
        >
          <h3>available routes</h3>
          <ul>
            <li>
              <a href="/app/tracker">Tracker</a>
            </li>
            <li>
              <a href="/app/generator">Generator</a>
            </li>
          </ul>
        </div>
        <div
          id="root-renderer"
          style={{
            gridColumnEnd: 'span 1',
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
        >
          main area
        </div>
        <div
          id="console-right"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 1', backgroundColor: BG_COLOR }}
        >
          console-right
        </div>
        <div
          id="console-bottom"
          className={classes.cell}
          style={{ gridColumnEnd: 'span 3', backgroundColor: BG_COLOR }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStyles)(Home);
