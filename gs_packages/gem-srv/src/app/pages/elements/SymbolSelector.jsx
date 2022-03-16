/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SymbolSelector - A component that accepts selection of
  { sel_linenum, sel_linepos } and draws out everything in it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SymbolSelector');

/// COMPONENT PLAYGROUND //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLabel(props) {
  const { name } = props;
  return (
    <div
      className="gwiz gtoken"
      style={{
        backgroundColor: '#003b76e0',
        color: 'white',
        fontWeight: 'bold',
        minWidth: '100px'
      }}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        console.log(e.target.name);
      }}
    >
      {name}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GChoiceToken(props) {
  const { symbolType, choice, unitText } = props;
  const cnames = ['gwiz', 'gtoken', 'clickable'];
  if (choice === unitText) cnames.push('chosen');

  const token = `${symbolType}-${choice}`;
  return (
    <div className={cnames.join(' ')} data-choice={token}>
      {choice}
    </div>
  );
}

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SymbolSelector(props) {
  // we need the current selection
  const { selected } = props;
  const { sel_linenum, sel_linepos } = selected;
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
          <GChoiceToken
            key={choiceKey}
            symbolType={key}
            unitText={unitText}
            choice={choice}
          />
        );
      });
      allDicts.push(
        <>
          <GLabel key={rowKey} name={key} />
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>{[...inner]}</div>
        </>
      );
    });
  }
  const prompt =
    allDicts.length > 0
      ? `SELECTED TOKEN ${sel_linenum},${sel_linepos - 1}`
      : 'SELECT TOKEN TO EDIT (prop keyword only)';
  // render
  return (
    <details
      open
      style={{
        backgroundColor: 'rgba(0,128,255,0.05)',
        padding: '10px 0 5px 10px'
      }}
    >
      <summary>{prompt}</summary>
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
    </details>
  );
}
