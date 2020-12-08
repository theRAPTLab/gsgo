/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Home - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import UR from '@gemstep/ursys/client';
import { useStylesHOC } from './page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('HOME', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');

/// UI HELPERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convenience utility to use nice JSX in sidebar navigation */
const NavItem = props => {
  const { route, children } = props;
  const disabled = route.charAt(0) === '-';
  const linkName = `${route.toUpperCase()}`;
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
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <div id="console-top" className={clsx(classes.cell, classes.top)}>
          <span style={{ fontSize: '32px' }}>INDEX</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <b className={classes.title}>Available Routes</b>
          <ul className={classes.list}>
            <NavItem route="generator">generate npc entities</NavItem>
            <NavItem route="tracker">display all entities in system</NavItem>
            <NavItem route="compiler">script compiler tests</NavItem>
            <NavItem route="login">login</NavItem>
            <NavItem route="missioncontrol">mission control</NavItem>
            <NavItem route="scripteditor">script editor</NavItem>
            <NavItem route="xgui">standalone xgui port</NavItem>
            <NavItem route="-faketrack">testbed for annotation input</NavItem>
          </ul>
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
export default withStyles(useStylesHOC)(Home);
