/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit Keyword Token Box

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import SymbolDebugTable from './SymbolDebugTable';
import SymbolOptionList from './SymbolOptionList';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function KeywordBox(parentProps) {
  const { selection } = parentProps;
  const { sel_linepos, validation } = selection;
  const { validationTokens: vtoks, validationLog } = validation;
  const vtok = vtoks[sel_linepos - 1];
  const gData = WIZCORE.DecodeSymbolViewData(vtok);

  const { keywords, unitText } = gData;
  const status = unitText ? 'PARSE OK' : 'PARSE ERROR';

  return (
    <>
      TEST KEYWORD BOX - {status}
      <form style={{ marginTop: '10px', marginBottom: 0 }}>
        <SymbolDebugTable {...gData} />
        <SymbolOptionList label="keywords" items={keywords.items} />
      </form>
    </>
  );
}
