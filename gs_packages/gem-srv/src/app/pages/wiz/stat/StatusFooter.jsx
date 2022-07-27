/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardStatusFooter Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { UnpackToken } from 'script/tools/script-tokenizer';
import { sError } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('StatusFooter');
const LOG = console.log;

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns placeholder text line editor to do script processing of a line
 *  for testing purposes
 */
export function StatusFooter(/* props */) {
  /// DEFINE STATE ////////////////////////////////////////////////////////////
  const { sel_linenum: num, sel_linepos: pos, error } = WIZCORE.State();
  let selInfo;
  if (num < 0) {
    selInfo = 'no selection';
  } else {
    const { scriptToken, slots_validation: validation } =
      WIZCORE.SelectedTokenInfo();
    let [type, value] = UnpackToken(scriptToken);
    const { validationTokens: vtoks, validationLog } = validation;
    const vtok = vtoks[pos - 1];
    let [unitText, symbolType, ...symbolArgs] = WIZCORE.UnpackSymbolType(vtok);
    // console.log(`'${unitText}' is ${symbolType}:${symbolArgs.join(',')}`);
    selInfo = `selected ${num},${pos} tok={${type}:${value}} sym={${symbolType}:${symbolArgs.join(
      ','
    )}}`;
  }
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
      <tt style={{ color: 'gray' }}>SELECTED TOK</tt> {selInfo}
      <div style={sError}>{error}</div>
    </div>
  );
}
