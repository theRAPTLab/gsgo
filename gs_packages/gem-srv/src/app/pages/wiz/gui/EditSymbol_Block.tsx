/* eslint-disable no-inner-declarations */
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
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import { GLabelToken, GSymbolToken, StackUnit } from '../SharedElements';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SymbolSelector');

export const HIDDEN_SYMBOLS = [
  // keywords
  'randompos',
  'dbgtick',
  'if',
  'call',
  '_line',
  '_directive',
  'keyworderr',
  'stackadd',
  'stacksub',
  'stackmul',
  'stackdiv',
  'usefeature', // deprecated.  use 'addFeature'
  // features
  'global',
  // costume
  'getbounds',
  'getscaledbounds',
  'test',
  'thinkhook',
  // physics
  'bodyradius',
  'bodywidth',
  'bodyheight',
  'getbodywidth',
  'getbodyheight',
  // agent
  'skin',
  // 'scale', // needed by physics
  'scaley',
  'isinhabitingtarget',
  'statusvalue',
  'statusvaluecolor',
  'statusvalueislarge'
];
export const LOCKED_SYMBOLS = [
  '#',
  '_pragma',
  'blueprint',
  'tag',
  'ischarcontrollable',
  'ispozyxcontrollable',
  'isptrackcontrollable',
  'program',
  'define',
  'condition',
  'event',
  'init',
  'update',
  'think',
  'exec'
];
export const ADVANCED_SYMBOLS = [
  // keywords
  'exprpush',
  'proppop',
  'proppush',
  'featproppop',
  'featproppush',
  'dbgout',
  'dbgstack',
  'dbgcontext',
  'dbgerror',
  // features
  'cursor',
  // agent
  'statustext',
  'zindex',
  'color',
  'orientation',
  'visible',
  'alpha',
  'isinert'
];

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function EditSymbol_Block(props) {
  // we need the current selection
  const { selection = {}, locked } = props;
  const { sel_linenum, sel_linepos, vmPageLine, sel_slotpos } = selection;
  const label = `options for token ${sel_linenum}:${sel_linepos}`;
  let symbolType;

  // Keep track of symbols being used in the original script line,
  // especially advanced or hidden symbols, so that we can show
  // them and let the user reselect them.  NOTE that after
  // saving the slot line, these will no longer appear though.
  const SYMBOLS_IN_USE = [];
  if (vmPageLine)
    vmPageLine.lineScript.forEach(tok => {
      if (tok.identifier) SYMBOLS_IN_USE.push(tok.identifier.toLowerCase());
    });

  // this is a managed TextBuffer with name "ScriptContextor"

  const allDicts = [];

  const { slots_validation } = SLOTCORE.State(); // TValidatedScriptUnit
  // test clause
  if (sel_linenum > 0 && sel_linepos > 0) {
    // const vdata = WIZCORE.ValidateSelectedLine();
    // console.log(vdata);

    // ORIG
    // const vIndex = sel_linepos - 1;
    // BL: Use slot position instead of lineposition (sel_linepos)
    //     so that we display the currently selected slot type?
    if (sel_slotpos < 0) return 'Click on a word above to edit it.'; // clicked ScriptView, not SelectEditorLineSlot
    const vIndex = CHECK.OffsetLineNum(sel_slotpos, 'sub');

    const { validationTokens } = slots_validation;

    // no more validation tokens
    if (vIndex >= validationTokens.length)
      return <StackUnit label="No options" type="symbol" open sticky />;

    const symbolData: TSymbolData = validationTokens[vIndex] || {}; // indx into line
    /* symbolData has the current symbol data to convert into viewdata
       `symbolData` looks like this: {
          features: {Costume: {…}, Physics: {…}, AgentWidgets: {…}}
          gsType: "objref"
          props: {x: {…}, y: {…}, statusText: {…}, eType: {…}, energyLevel: {…}, …}
          unitText: "energyLevel"
        }
    */
    const { unitText, symbolScope, error, gsType, ...dicts } = symbolData;
    /* `dicts` looks like this: {
          features: {Costume: {…}, Physics: {…}, AgentWidgets: {…}}
          props: {x: {…}, y: {…}, statusText: {…}, eType: {…}, energyLevel: {…}, …}
        }
    */
    symbolType = gsType;

    // Don't render choices if the current selection should be an input form
    if (
      gsType === 'number' ||
      gsType === 'string' ||
      gsType === 'boolean' ||
      gsType === 'identifier'
    )
      return '';

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
    function f_render_choices(sd, vd, parentLabel = '') {
      const categoryDicts = [];
      Object.keys(sd).forEach((stype, i) => {
        const rowKey = `${sel_linenum}:${i}`;
        // NEW CODE: Look up from viewData specific to the recursive context
        const vdata = vd[stype];
        const { info, items } = vdata;
        // ORIG CODE: Look up from general viewData
        // const { info, items } = viewData[stype];
        const choices = []; // this is the list of choices
        const expertChoices = []; // hack to show expert keywords in a different area
        // get all the choices for this symbol type
        items.forEach(choice => {
          const choiceKey = `${stype}:${choice || GUI_EMPTY_TEXT}`;
          // if EditSymbol is locked, it overrides ALL symbol choices
          const symbolIsLocked =
            locked || LOCKED_SYMBOLS.includes(choice.toLowerCase());
          const tok = (
            <GSymbolToken
              key={choiceKey}
              symbolType={stype}
              unitText={unitText}
              choice={choice || GUI_EMPTY_TEXT}
              locked={symbolIsLocked}
            />
          );
          if (
            HIDDEN_SYMBOLS.includes(choice.toLowerCase()) &&
            SYMBOLS_IN_USE.includes(choice.toLowerCase())
          ) {
            // 1. If the choice is supposed to be hidden, but
            //    is currently in use in the original script line,
            //    show it in the "expert" section so that it
            //    can be reselected
            expertChoices.push(tok);
          } else if (HIDDEN_SYMBOLS.includes(choice.toLowerCase())) {
            // 2. Hide unsupported and deprecated keywords
            return;
          } else if (ADVANCED_SYMBOLS.includes(choice.toLowerCase())) {
            // 3. Show expert keywords
            expertChoices.push(tok);
          } else {
            // 4. Regular keyword
            choices.push(tok);
          }
        });
        // push a left-most label with symbolType with all the symbols
        // this will be displayed in a two-column grid in the render function
        // so the left will be the same height as the right
        categoryDicts.push(
          <div key={rowKey} style={{ display: 'contents' }}>
            <GLabelToken
              key={rowKey}
              name={parentLabel ? `${parentLabel}\n${symbolType}` : symbolType}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[...choices]}
            </div>
          </div>
        );
        if (expertChoices.length > 0) {
          // Expert
          categoryDicts.push(
            <div key={`adv${rowKey}`} style={{ display: 'contents' }}>
              <GLabelToken
                key={`adv${rowKey}`}
                name={
                  parentLabel
                    ? `expert ${parentLabel}\n${symbolType}`
                    : `expert ${symbolType}`
                }
                secondary
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', opacity: '0.7' }}>
                {[...expertChoices]}
              </div>
            </div>
          );
        }
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
    Object.entries(dicts).forEach(
      ([dictName, v]: [keyof TSymbolData, TSymbolData]) => {
        if (Array.isArray(symbolScope) && !symbolScope.includes(dictName)) return;
        const sd = {};
        sd[dictName] = v;
        allDicts.push(f_render_choices(sd, viewData, dictName));
        // console.groupEnd();
      }
    );
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
