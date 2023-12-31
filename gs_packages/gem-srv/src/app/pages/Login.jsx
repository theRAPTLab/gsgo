/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Login - User login and model selection

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelLogin from './components/PanelLogin';
import PanelSelectSimulation from './components/PanelSelectSimulation';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'test/unit-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('LOGIN');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('login', '100% 0 0'); // columns
PANEL_CONFIG.set('selectSimulation', '100% 0 0'); // columns
PANEL_CONFIG.set('sim', '15% auto 100px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'selectSimulation' // default should be 'login'
    };

    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.OnModelSelectClick = this.OnModelSelectClick.bind(this);
  }

  componentDidMount() {
    document.title = 'GEMSTEP LOGIN';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });
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

  OnModelSelectClick(parms) {
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    window.location = `/app/project?${parms}`;
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
          gridTemplateColumns: PANEL_CONFIG.get(panelConfiguration)
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          <img
            src="/static/logo_GEMSTEP_vector.svg"
            width="40px"
            style={{
              paddingTop: '5px',
              paddingRight: '5px',
              paddingLeft: '5px',
              verticalAlign: 'top'
            }}
          />
          <span style={{ fontSize: '32px' }}> GEM-STEP PROJECTS</span>
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
              onClick={this.OnModelSelectClick}
            />
          )}
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
