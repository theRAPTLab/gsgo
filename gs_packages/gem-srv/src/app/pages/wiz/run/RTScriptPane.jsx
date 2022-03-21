/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RuntimeScriptView - A version of the ScriptView that serves as the interface
  for inspecting property values of the currently selected instance
  of the running character types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RuntimeScriptView');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RTScriptPane(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_linenum: num, sel_linepos: pos, error } = WIZCORE.State();
  const selText = num < 0 ? 'no selection' : `selected ${num},${pos}`;
  /// RENDER //////////////////////////////////////////////////////////////////
  return <div>RuntimeScriptView</div>;
}
