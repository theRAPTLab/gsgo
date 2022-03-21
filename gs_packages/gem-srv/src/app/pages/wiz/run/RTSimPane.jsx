/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RuntimeSimView - Simulation View in a Window, with some integration with the
  RuntimeDebugger, ScriptInspector, RuntimeSimTarget

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RuntimeSimView');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RTSimPane(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_linenum: num, sel_linepos: pos, error } = WIZCORE.State();
  const selText = num < 0 ? 'no selection' : `selected ${num},${pos}`;
  /// RENDER //////////////////////////////////////////////////////////////////
  return <div>RuntimeSimView</div>;
}
