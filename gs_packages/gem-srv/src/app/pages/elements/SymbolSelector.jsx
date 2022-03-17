/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SymbolSelector - A component that accepts selection of
  { sel_linenum, sel_linepos } and draws out everything in it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { GLabelToken, GSymbolToken, StackUnit } from './WizElementLibrary';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SymbolSelector');

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SymbolSelector(props) {
  // we need the current selection
  const { selection = {} } = props;
  const { sel_linenum, sel_linepos } = selection;
  const label = `options for token ${sel_linenum}:${sel_linepos}`;
  // this is a managed TextBuffer with name "ScriptContextor"
  const allDicts = [];

  const { sel_validation } = WIZCORE.State();
  // test clause
  if (sel_linenum > 0 && sel_linepos > 0) {
    // const vdata = WIZCORE.ValidateSelectedLine();
    // console.log(vdata);
    const vIndex = sel_linepos - 1;
    const { validationTokens } = sel_validation;
    const symbolData = validationTokens[vIndex];
    // symbolData has the current symbol data to convert into viewdata
    const viewData = WIZCORE.SymbolToViewData(symbolData);
    /*/
    it would be nice to make unitText indicate it's the current value
    /*/
    const { unitText, error, ...dicts } = viewData;
    // walk over each key
    Object.keys(dicts).forEach((key, i) => {
      const rowKey = `row${sel_linenum}:${i}`;
      const { info, items } = viewData[key];
      // append each item
      const inner = [];
      items.forEach(choice => {
        const choiceKey = `${key}:${choice}`;
        inner.push(
          <GSymbolToken
            key={choiceKey}
            symbolType={key}
            unitText={unitText}
            choice={choice}
          />
        );
      });
      allDicts.push(
        <>
          <GLabelToken key={rowKey} name={key} />
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>{[...inner]}</div>
        </>
      );
    });
    if (error) {
      allDicts.push(<p>{error.info}</p>);
    }
  }
  const prompt = 'SCRIPT LINE EDITOR';

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <StackUnit
      label={prompt}
      open
      sticky
      style={{
        backgroundColor: 'rgba(0,128,255,0.05)'
      }}
    >
      {allDicts.map((row, i) => {
        const key = `${sel_linenum}${i}`;
        return (
          <div
            className="gline"
            key={key}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              gap: '1px'
            }}
          >
            {row}
          </div>
        );
      })}
    </StackUnit>
  );
}
