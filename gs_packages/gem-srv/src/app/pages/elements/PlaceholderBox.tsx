/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Placeholder Token Edit Box

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys';
import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import SymbolDebugTable from './SymbolDebugTable';
import SymbolOptionList from './SymbolOptionList';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ScriptElementEditor', 'TagRed');

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the subcomponent receives props instead of directly accessing WizCore
 *  so it will rerender based on what it receives, rather than what it
 *  retrieves
 */
export function PlaceholderBox(parentProps) {
  const { selection } = parentProps;
  const { linePos, validation } = selection;
  const { vtoks, summary } = validation;
  WIZCORE.UpdateDBGConsole(summary);
  const vtok = vtoks[linePos - 1];
  const gData = WIZCORE.SymbolToViewData(vtok);
  const status = gData.unitText ? 'PARSE OK' : 'PARSE ERROR';
  return (
    <>
      TEST EDIT BOX - {status}
      <form style={{ marginTop: '10px', marginBottom: 0 }}>
        <SymbolDebugTable {...gData} />
      </form>
    </>
  );
}
