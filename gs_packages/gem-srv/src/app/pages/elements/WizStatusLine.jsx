/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardStatusLine Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { sError } from './wizard-style';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('StatusLine');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns placeholder text line editor to do script processing of a line
 *  for testing purposes
 */
export function StatusLine(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_line_num: num, sel_line_pos: pos, error } = WIZCORE.State();
  const selText = num < 0 ? 'no selection' : `selected ${num},${pos}`;
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <div
      style={{
        width: '100%',
        display: 'inline-grid',
        gridTemplateColumns: '150px 1fr',
        columnGap: '10px',
        paddingBottom: '10px'
      }}
    >
      <tt style={{ color: 'gray' }}>SELECTED TOK</tt> {selText}
      <div style={sError}>{error}</div>
    </div>
  );
}
