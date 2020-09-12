/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemRoutes - define top-level routes to views

  This module is imported into SystemShell.jsx to generate
  ReactRouter-compatible <Route> entries

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// COMPONENTS ////////////////////////////////////////////////////////////////
import UR from '@gemstep/ursys/client';
import Tracker from '../pages/Tracker';
import NoMatch from './NoMatch';

const PR = UR.Prompt('SystemRoutes');

/*****************************************************************************\

  MAIN ROUTE DECLARATION

  declare main view routes here
  list more specific routes first
  url format is host:3000/#dev

\*****************************************************************************/

const SystemRoutes = [
  {
    path: '/',
    exact: true,
    component: Tracker
  },
  {
    path: '*',
    restricted: false,
    component: NoMatch
  }
];

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemRoutes;
