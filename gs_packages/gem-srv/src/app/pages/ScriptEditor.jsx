/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as SIM from 'modules/sim/api-sim'; // needed to register keywords for Prism
import * as GLOBAL from 'modules/datacore/dc-globals';
import * as DATACORE from 'modules/datacore';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../util/prism_extended';
import { CodeJar } from '../../util/codejar';
import '../../util/prism_extended.css';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSimViewer from './components/PanelSimViewer';
import PanelSelectAgent from './components/PanelSelectAgent';
import PanelScript from './components/PanelScript';
import PanelInspector from './components/PanelInspector';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'modules/tests/test-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './page-xui-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPTEDITOR');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const panelConfig = new Map();
panelConfig.set('select', '50% auto 0px'); // columns
panelConfig.set('script', '50% auto 0px'); // columns
panelConfig.set('sim', '25% auto 0px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ScriptEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'select'
    };

    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {
    document.title = 'GEMSTEP SCRIPT EDITOR';
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
          <span style={{ fontSize: '32px' }}>SCRIPT EDITOR</span> UGLY DEVELOPER
          MODE
          <span
            style={{ textAlign: 'right', display: 'inline-block', width: '100%' }}
          >
            <a href="/app">HOME</a>
          </span>
        </div>
        <div id="console-left" className={classes.left}>
          {panelConfiguration === 'select' && (
            <PanelSelectAgent id="select" onClick={this.OnPanelClick} />
          )}
          {panelConfiguration === 'script' && (
            <PanelScript id="script" onClick={this.OnPanelClick} />
          )}
          <div className={classes.instructions}>
            <p>Script text changes are automatically compiled and run?</p>
            <p>
              Instance is automatically created and controllable via faketrack in
              the Sim view. Also auto-selected as the first inspector.
            </p>
          </div>
        </div>
        <div id="console-main" className={classes.main}>
          <PanelSimViewer id="sim" onClick={this.OnPanelClick} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <PanelInspector isActive />
            <PanelInspector />
            <PanelInspector />
          </div>
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
export default withStyles(useStylesHOC)(ScriptEditor);
