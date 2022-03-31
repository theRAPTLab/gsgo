/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SymbolSelector - A component that accepts selection of
  { sel_linenum, sel_linepos } and draws out everything in it

  validation data contains all the symbol information for the current
  vm_pageline, which has validation tokens for each corresponding scriptunit

  prop agent.genergy setmin 0
  script unit: { identify:prop } { objref:[agent,genergy] } { identifier:setmin } { value:0 }
  valids unit: { error, unitText, gsType, ...keys of TSymbolData }, ...


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { GLabelToken, GSymbolToken, StackUnit } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SymbolSelector');

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function EditSymbol(props) {
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
    const symbolData = validationTokens[vIndex]; // indx into line
    // symbolData has the current symbol data to convert into viewdata
    const viewData = WIZCORE.DecodeSymbolViewData(symbolData); // returns the list of symbolnames for a particular symbol
    /* TODO: it would be nice to make unitText indicate it's the current value */
    const { unitText, error, ...dicts } = viewData;
    // VALIDATION TOKENS are stored by key in the dicts
    // e.g. Keywords, Props, Methods, etc
    Object.keys(dicts).forEach((symbolType, i) => {
      const rowKey = `row${sel_linenum}:${i}`;
      const { info, items } = viewData[symbolType];
      const inner = []; // this is the list of choices
      // get all the choices for this symbol type
      items.forEach(choice => {
        const choiceKey = `${symbolType}:${choice}`;
        inner.push(
          <GSymbolToken
            key={choiceKey}
            symbolType={symbolType}
            unitText={unitText}
            choice={choice}
          />
        );
      });
      // push a left-most label with symbolType with all the symbols
      // this will be displayed in a two-column grid in the render function
      // so the left will be the same height as the right
      allDicts.push(
        <>
          <GLabelToken key={rowKey} name={symbolType} />
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>{[...inner]}</div>
        </>
      );
    });
    if (error) {
      allDicts.push(<p style={{ color: 'red' }}>{error.info}</p>);
    }
  }

  /// RENDER //////////////////////////////////////////////////////////////////
  /// drawn as "SCRIPT LINE EDITOR"
  /// [SYMBOL TYPE] symbol symbol symbol
  const prompt = 'SYMBOL SELECTOR';
  return (
    <StackUnit label={prompt} type="symbol" open sticky>
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
