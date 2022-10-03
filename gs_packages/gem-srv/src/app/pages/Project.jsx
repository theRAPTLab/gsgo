/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelSelect from './components/PanelSelect';
import DialogConfirm from './components/DialogConfirm';

/// TESTS /////////////////////////////////////////////////////////////////////
// import 'test/unit-parser'; // test parser evaluation

// this is where classes.* for css are defined
import { useStylesHOC } from './helpers/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PROJECT');
const DBG = true;

/// PANEL CONFIGURATIONS //////////////////////////////////////////////////////
const PANEL_CONFIG = new Map();
PANEL_CONFIG.set('select', '20% auto 100px'); // columns

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Project extends React.Component {
  constructor() {
    super();
    this.state = {
      panelConfiguration: 'select',
      projId: undefined,
      openRedirectDialog: false
    };

    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const projId = params.get('project');

    const wasRedirected = params.get('redirect') !== null;
    this.setState({
      projId,
      openRedirectDialog: wasRedirected
    });
    document.title = `GEMSTEP PROJECT ${projId}`;
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

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { panelConfiguration, projId, openRedirectDialog } = this.state;
    const { classes } = this.props;

    const DialogMainRedirect = (
      <DialogConfirm
        open={openRedirectDialog}
        message={'A "Main" window was already open.  Select another view.'}
        yesMessage="OK"
        noMessage=""
        onClose={() => this.setState({ openRedirectDialog: false })}
      />
    );

    const DialogNoProject = (
      <DialogConfirm
        open={projId === null}
        message="No project specified."
        yesMessage="Select Project"
        noMessage=""
        onClose={() => {
          window.location = '/app/login';
        }}
      />
    );

    const parms = projId !== null ? `project=${projId}` : '';

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
          style={{ gridColumnEnd: 'span 3', display: 'flex' }}
        >
          <div style={{ flexGrow: '1' }}>
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
            <span style={{ fontSize: '32px' }}>GEMSTEP PROJECT {projId}</span>{' '}
          </div>
          <Link to={{ pathname: '/app/login' }} className={classes.navButton}>
            Back to HOME
          </Link>
        </div>
        <div
          id="console-left"
          className={classes.left} // commented out b/c adding a padding
          style={{ backgroundColor: 'transparent' }}
        >
          {panelConfiguration === 'select' && (
            <PanelSelect id="select" parms={parms} onClick={this.OnPanelClick} />
          )}
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 3' }}
        >
          {DialogMainRedirect}
          {DialogNoProject}
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Project);
