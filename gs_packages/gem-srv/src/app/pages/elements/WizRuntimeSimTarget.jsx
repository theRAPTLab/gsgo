/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RuntimeSimTarget - Instrument to observe instances matching a particular
  Blueprint aka character type

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RuntimeSimTarget');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RuntimeSimTarget(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_line_num: num, sel_line_pos: pos, error } = WIZCORE.State();
  const selText = num < 0 ? 'no selection' : `selected ${num},${pos}`;
  /// RENDER //////////////////////////////////////////////////////////////////
  return <div>RuntimeSimTarget</div>;
}
