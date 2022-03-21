/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RuntimeInspector - Instrument to observe the inner workings of a
  script variables for a selected SimTarget

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RuntimeInspector');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RuntimeInspector(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_linenum: num, sel_linepos: pos, error } = WIZCORE.State();
  const selText = num < 0 ? 'no selection' : `selected ${num},${pos}`;
  /// RENDER //////////////////////////////////////////////////////////////////
  return <div>RuntimeInspector</div>;
}
