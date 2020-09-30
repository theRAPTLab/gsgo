/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FakeTrack - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { useStylesHOC } from './page-styles';
import { Init, HookResize } from '../modules/sim/display/renderer';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
/// import '../modules/sim/runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FakeTrack', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class FakeTrack extends React.Component {
  componentDidMount() {
    // start URSYS
    UR.SystemConfig({ autoRun: true }); // initialize renderer
    const renderRoot = document.getElementById('root-renderer');
    Init(renderRoot);
    HookResize(window);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>FAKETRACK/TEST</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          console-left
        </div>
        <div id="root-renderer" className={classes.main} />
        <div id="console-right" className={clsx(classes.cell, classes.right)}>
          console-right
        </div>
        <div id="console-bottom" className={clsx(classes.cell, classes.bottom)}>
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(FakeTrack);
