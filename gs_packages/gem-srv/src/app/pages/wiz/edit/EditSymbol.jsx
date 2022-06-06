/* eslint-disable no-inner-declarations */
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
import * as TRANSPILER from 'script/transpiler-v2';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
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
  const { sel_linenum, sel_linepos, sel_slotpos } = selection;
  const label = `options for token ${sel_linenum}:${sel_linepos}`;
  let symbolType;

  // this is a managed TextBuffer with name "ScriptContextor"

  const allDicts = [];

  const { slots_validation } = WIZCORE.State();
  // test clause
  if (sel_linenum > 0 && sel_linepos > 0) {
    // const vdata = WIZCORE.ValidateSelectedLine();
    // console.log(vdata);

    // ORIG
    // const vIndex = sel_linepos - 1;
    // BL: Use slot position instead of lineposition (sel_linepos)
    //     so that we display the currently selected slot type?
    if (sel_slotpos < 0) return 'Click on a word above to edit it.'; // clicked ScriptView, not SelectEditorLineSlot
    const vIndex = CHECK.UnOffsetLineNum(sel_slotpos);

    const { validationTokens } = slots_validation;

    // no more validation tokens
    if (vIndex >= validationTokens.length) return 'nothing to render';

    const symbolData = validationTokens[vIndex]; // indx into line
    /* symbolData has the current symbol data to convert into viewdata
       `symbolData` looks like this: {
          features: {Costume: {…}, Physics: {…}, AgentWidgets: {…}}
          gsType: "objref"
          props: {x: {…}, y: {…}, statusText: {…}, eType: {…}, energyLevel: {…}, …}
          unitText: "energyLevel"
        }
    */
    const { unitText, error, gsType, ...dicts } = symbolData;
    /* `dicts` looks like this: {
          features: {Costume: {…}, Physics: {…}, AgentWidgets: {…}}
          props: {x: {…}, y: {…}, statusText: {…}, eType: {…}, energyLevel: {…}, …}
        }
    */
    symbolType = gsType;

    // Don't render choices if the current selection should be an input form
    if (gsType === 'number' || gsType === 'string') return '';

    // See symbol-utilities.DecodeSymbolViewData
    const viewData = WIZCORE.DecodeSymbolViewData(symbolData); // returns the list of symbolnames for a particular symbol
    /* TODO: it would be nice to make unitText indicate it's the current value */
    // VALIDATION TOKENS are stored by key in the dicts
    // e.g. Keywords, Props, Methods, etc
    /* `viewData` looks like this at this point: {
            features: {info: 'Costume, Physics, AgentWidgets', items: ['Costume', 'AgentWidgets', 'Population']}
            props: {info: 'x, y, statusText, eType, energyLevel, energyUse', items: Array(6)}
            unitText: "energyLevel"
        }
    */

    /**
     * Renders jsx for each category of symbol and each individual selectable symbol
     * in a two column grid format.
     * Used for both the top level `props` and recursive (e.g. `feature.Costume`) props
     * @param {object} sd - symbolData dicts
     * @param {object} vd - viewData
     * @param {string} parentLabel - extra label for features, e.g. "Costume"
     * @returns jsx
     */
    function renderKeys(sd, vd, parentLabel = '') {
      const categoryDicts = [];
      Object.keys(sd).forEach((symbolType, i) => {
        const rowKey = `${sel_linenum}:${i}`;
        // NEW CODE: Look up from viewData specific to the recursive context
        const { info, items } = vd[symbolType];
        // ORIG CODE: Look up from general viewData
        // const { info, items } = viewData[symbolType];
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
        // REVIEW: The <> needs a key.
        categoryDicts.push(
          <div key={rowKey} style={{ display: 'contents' }}>
            <GLabelToken
              key={rowKey}
              name={parentLabel ? `${parentLabel}\n${symbolType}` : symbolType}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>{[...inner]}</div>
          </div>
        );
      });
      return categoryDicts;
    }

    // Features need special handling.
    // By default, symbol-utilities.DecodeSymbolViewData converts features into a shallow
    // list of Features available in the blueprint, e.g. "Costume", "AgentWidgets".
    // But what we actually want are a list of the methods and props for each
    // specific feature, e.g. 'Costume.costumeName'.  So we do some extra processing
    // to recursively reach into each feature to determine the props and
    // methods.
    //
    // Walk down dicts
    // 1. if the key is 'features', recursively expand its props and methods.
    // 2. if the key is plain `props`, just expand it normally
    Object.entries(dicts).forEach(([k, v]) => {
      // console.group('symbolType', k, 'symbolDictionary', v);
      if (k === 'features') {
        // 1. feature, so recursively expand
        Object.entries(v).forEach(([featureName, featureDict]) => {
          if (gsType === 'objref') {
            // prop symbolData
            const sd = {};
            sd.props = featureDict.props;
            // prop viewData
            const vd = WIZCORE.DecodeSymbolViewData(featureDict);
            // render it
            allDicts.push(renderKeys(sd, vd, featureName));
          } else if (gsType === 'method') {
            // method symbolData
            const sd = {};
            sd.methods = featureDict.methods;
            // method viewData
            const vd = WIZCORE.DecodeSymbolViewData(featureDict);
            // render it
            allDicts.push(renderKeys(sd, vd, featureName));
          } else {
            // unspported gsType
          }
        });
      } else {
        // 2. not a feature, just render the keys
        const sd = {};
        sd[k] = v;
        allDicts.push(renderKeys(sd, viewData));
      }
      // console.groupEnd();
    });
  }

  /// RENDER //////////////////////////////////////////////////////////////////
  /// drawn as "SCRIPT LINE EDITOR"
  /// [SYMBOL TYPE] symbol symbol symbol
  const prompt = `SELECT A ${symbolType}`;
  return (
    <StackUnit label={prompt} type="symbol" open sticky>
      {allDicts.map((row, i) => {
        const key = `${sel_linenum}.${i}`;
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
