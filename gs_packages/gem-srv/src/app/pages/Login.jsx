/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelLogin from './components/PanelLogin';
import PanelSelectSimulation from './components/PanelSelectSimulation';
import PanelSelect from './components/PanelSelect';
import PanelSimViewer from './components/PanelSimViewer';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('LOGIN');
const DBG = true;

/// HARCODED SOURCE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Is this necessary?  Causing async "Uncaught (in promise) undefined" error
// UR.SystemHook(
//   'UR/LOAD_ASSETS',
//   () =>
//     new Promise((resolve, reject) => {
//       if (DBG) console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
//       (async () => {
//         let map = await GLOBAL.LoadAssets('static/assets.json');
//         if (DBG) console.log(...PR('ASSETS LOADED'));
//         // Compiler.jsx starts sim, but we shouldn't need to?
//         // SIM.StartSimulation();
//         // if (DBG) console.log(...PR('SIMULATION STARTED'));
//       })();
//       resolve();
//     })
// );

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const panelConfig = new Map();
panelConfig.set('login', '100% 0 0'); // columns
panelConfig.set('selectSimulation', '100% 0 0'); // columns
panelConfig.set('select', '20% auto 100px'); // columns
panelConfig.set('sim', '15% auto 100px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'login'
    };

    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {
    document.title = 'GEMSTEP LOGIN';
    // start URSYS
    UR.SystemConfig({ autoRun: true });
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  OnPanelClick(id) {
    console.log('click', id); // e, e.target, e.target.value);
    this.setState({
      panelConfiguration: id
    });
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { panelConfiguration } = this.state;
    const { classes } = this.props;
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: panelConfig.get(panelConfiguration)
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <span style={{ fontSize: '32px' }}>GEMSTEP LOGIN</span> UGLY DEVELOPER
          MODE
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          {panelConfiguration === 'login' && (
            <PanelLogin id="login" onClick={this.OnPanelClick} />
          )}
          {panelConfiguration === 'selectSimulation' && (
            <PanelSelectSimulation
              id="selectSimulation"
              onClick={this.OnPanelClick}
            />
          )}
          {panelConfiguration === 'select' && (
            <PanelSelect id="select" onClick={this.OnPanelClick} />
          )}
        </div>
        <div id="root-renderer" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
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
export default withStyles(useStylesHOC)(Login);
