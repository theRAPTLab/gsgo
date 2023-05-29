/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Home - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { useStylesHOC } from './helpers/page-styles';

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
          <span style={{ fontSize: '32px' }}>INDEX</span> {UR.ConnectionString()}
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <b className={classes.title}>Quick Links</b>
          <ul className={classes.list}>
            <NavItem route="login">login</NavItem>
            <NavItem route="main?project=aquatic_interactions">aquatic</NavItem>
            <NavItem route="charcontrol">character controller</NavItem>
          </ul>
        </div>
        <div id="instructions" className={classes.main}>
          <h2>GEM-STEP Version 1.0, September 2022</h2>
          <p>
            {' '}
            <b>
              For performance, open each app in its own browser window, NOT a tab.
            </b>
          </p>
          <ol>
            <li>
              <a href="/app/login">LOGIN</a> - List of current projects. You can
              also create new projects from this screen.
            </li>
            <li>
              <a href="/app/main?project=aquatic_interactions">AQUATIC</a> - This
              goes directly to the Aquatic model.
            </li>
            <li>
              <a href="/app/viewer">VIEWER</a> - This lets you view a model that
              is already running on another machine, but you cannot interact with
              it.
            </li>
            <li>
              <a href="/app/viewer2">VIEWER 2</a> - Viewer with logs
            </li>
            <li>
              <a href="/app/charcontrol">CHARACTER CONTROLLER</a> - This lets you
              control one or more characters in the currently running maain
              window.
            </li>
            <li>
              <a href="/app/charcontrol2">CHARACTER CONTROLLER 2</a> - Just the
              controller.
            </li>
            <li>
              <a href="/app/charcontrol3">CHARACTER CONTROLLER 3</a> -
              Overlapping.
            </li>
          </ol>
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
