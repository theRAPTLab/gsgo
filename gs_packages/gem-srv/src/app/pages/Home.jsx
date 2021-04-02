/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Home - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { useStylesHOC } from './elements/page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('HOME');

/// UI HELPERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convenience utility to use nice JSX in sidebar navigation */
const NavItem = props => {
  const { route, children } = props;
  const disabled = route.charAt(0) === '-';
  const qq = route.indexOf('?');
  let linkName;
  if (qq > 0) linkName = `${route.toUpperCase().substring(0, qq)}`;
  else linkName = `${route.toUpperCase()}`;
  const style = {
    fontSize: '150%',
    fontWeight: 'bold',
    display: 'block',
    color: 'gray'
  };
  const NavLink = () =>
    disabled ? (
      <span style={style}>{linkName}</span>
    ) : (
      <a href={`/app/${route}`}>{linkName}</a>
    );

  return (
    <li>
      <NavLink />
      {children}
    </li>
  );
};

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Home extends React.Component {
  componentDidMount() {
    document.title = 'GEMSTEP';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true });
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>INDEX</span> {UR.ConnectionString()}
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <b className={classes.title}>Demo Routes</b>
          <ul className={classes.list}>
            <NavItem route="login?model=aquatic">login</NavItem>
            <NavItem route="model?model=aquatic">model</NavItem>
            <NavItem route="missioncontrol?model=aquatic">
              mission control
            </NavItem>
            <NavItem route="scripteditor?model=aquatic">script editor</NavItem>
            <NavItem route="viewer?model=aquatic">viewer</NavItem>
          </ul>
          <b className={classes.title}>Dev Testing Routes</b>
          <ul className={classes.list}>
            <NavItem route="compiler">script compiler tests</NavItem>
            <NavItem route="tracker">display all entities in system</NavItem>
            <NavItem route="faketrack">testbed for annotation input</NavItem>
          </ul>
        </div>
        <div id="instructions" className={classes.main}>
          <h2>April Demo WIP</h2>
          <p>
            {' '}
            <b>
              For performance, open each app in its own browser window, NOT a tab.
            </b>
          </p>
          <ol>
            <li>
              <a href="/app/missioncontrol">MISSION CONTROL</a> - Prototype of the
              presentation laptop app. It runs the simulator module and receives
              scripts from other devices. <b>Run this first</b> and click{' '}
              <b>START</b> button on right after some scripts have been sent to
              it. The title shows the address of the server that everyone else
              should connect to.
            </li>
            <li>
              <a href="/app/scripteditor">SCRIPT EDITOR</a> - Prototype providing
              a pre-defined selection of agents that can have their scripts
              edited. This can be on different machines. Use <b>SAVE TO SERVER</b>{' '}
              to send to MISSION CONTROL.
            </li>
            <li>
              <a href="/app/viewer">VIEWER</a> - Prototype app showing the
              simulation view from MISSION CONTROL, which would be the basis of an
              annotation app.
            </li>
            <li>
              <a href="/app/faketrack">FAKETRACK</a> - Ported from earlier
              versions of STEP. This currently does not affect the simulation.
            </li>
          </ol>
        </div>
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

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HandleMessage('NET:GEM_HOMEAPP', data => {
  console.log('NET:GEM_HOMEAPP got data', JSON.stringify(data));
  data.reply = 'hi yourself';
  return data;
});

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Home);
