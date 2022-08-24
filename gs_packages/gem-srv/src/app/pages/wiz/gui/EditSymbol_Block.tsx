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
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as SYMUTIL from 'script/tools/symbol-utilities';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as HELP from 'app/help/codex';
import {
  GLabelToken,
  GSymbolToken,
  GSymbolTokenHelp,
  StackUnit,
  StackText
} from '../SharedElements';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ES_BLOCK', 'TagDebug');

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
  // physics
  'intersectsWith',
  'intersectsWithBounds',
  'intersectsCenterWithBounds',
  'intersectsCenterWithAgentBounds',
  // agent
  'skin',
  // 'scale', // needed by physics
  'scaley',
  'isinhabitingtarget',
  'statusvalue',
  'statusvaluecolor',
  'statusvalueislarge',
  // methods
  'eq'
].map(w => w.toLowerCase());
export const LOCKED_SYMBOLS = [
  '#',
  '_directive',
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
].map(w => w.toLowerCase());
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
  // costume
  'currentFrame',
  'colorHue',
  'colorSaturation',
  'colorValue',
  'colorScaleIndex',
  'colorScaleHue',
  'colorScaleSaturation',
  'colorScaleValue',
  'colorScaleType',
  'colorScaleSteps',
  'setAnimatedCostume',
  'getColorHSV',
  'colorHSVWithinRange',
  'initHSVColorScale',
  'getHSVColorScaleColor',
  // movement
  'bounceAngle',
  'setRandomPositionX',
  'setRandomPositionY',
  'seekNearest',
  'seekNearestVisibleCone',
  'seekNearestVisibleColor',
  'wanderUntilInside',
  // physics
  'bodyradius',
  'bodywidth',
  'bodyheight',
  'bodyshape',
  // population
  'monitoredAgent',
  'monitoredAgentProp',
  'monitoredAgentPropFeature',
  'spawnMutationProp',
  'spawnMutationPropFeature',
  'spawnMutationMaxAdd',
  'spawnMutationMaxSubtract',
  'targetPopulationSize',
  'deleteAfterSpawning',
  'createAgent',
  'spawnChild',
  'removeAgent',
  'getRandomActiveAgent',
  'releaseAllAgents',
  'releaseInertAgents',
  'hideInertAgents',
  'removeInertAgents',
  'agentsReproduce',
  'oneAgentReproduce',
  'populateBySpawning',
  'agentsForEachActive',
  'agentsForEach',
  'countAgentsByPropType',
  'setAgentsByFeatPropTypeKeys',
  'countExistingAgentsByFeatPropType',
  // vision
  'vision',
  // agent
  'agent',
  'x',
  'y',
  'statustext',
  'zindex',
  'color',
  'orientation',
  'visible',
  'alpha',
  'isinert'
].map(w => w.toLowerCase());
export const IGNORED_TYPES = ['{noncode}'].map(w => w.toLowerCase());

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function EditSymbol_Block(props) {
  // we need the current selection
  const { selection = {}, locked } = props;
  const { sel_linenum, sel_linepos, vmPageLine, sel_slotpos } = selection;
  const label = `options for token ${sel_linenum}:${sel_linepos}`;
  let symbolType = '';
  let slotTypeHelpText = '';

  // Keep track of symbols being used in the original script line,
  // especially advanced or hidden symbols, so that we can show
  // them and let the user reselect them.  NOTE that after
  // saving the slot line, these will no longer appear though.
  const SYMBOLS_IN_USE = [];
  if (vmPageLine)
    vmPageLine.lineScript.forEach(tok => {
      if (tok.identifier) SYMBOLS_IN_USE.push(tok.identifier.toLowerCase());
    });

  const allDicts = [];

  const { slots_validation } = SLOTCORE.State(); // TValidatedScriptUnit
  // test clause
  if (sel_linenum > 0 && sel_linepos > 0) {
    // const vdata = WIZCORE.ValidateSelectedLine();
    // console.log(vdata);

    // ORIG
    // const selectedSlot = sel_linepos - 1;
    // BL: Use slot position instead of lineposition (sel_linepos)
    //     so that we display the currently selected slot type?
    if (sel_slotpos < 0) return <p>Click on a word above to edit it.</p>; // clicked ScriptView, not SelectEditorLineSlot
    const selectedSlot = CHECK.OffsetLineNum(sel_slotpos, 'sub');

    const validationTokens = slots_validation
      ? slots_validation.validationTokens
      : [];

    // no more validation tokens
    if (selectedSlot >= validationTokens.length)
      return <StackUnit label="No options" type="symbol" open sticky />;

    // HELP
    // featCall HACK
    // peek at keyword.  If it's a featCall, we need to
    // pull out the feature name to pass on to f_render_choices
    let featName;
    const kw_tok = validationTokens[0];
    if (kw_tok.unitText === 'featCall') {
      const objref_tok = validationTokens[1].unitText.split('.');
      // featName will be passed to HELP.ForChoice as the parentLabel
      // This is how we tell HELP to look up a featMethod instead of regular prop method
      featName = objref_tok.length > 1 ? objref_tok[1] : objref_tok[0];
    }
    if (kw_tok.unitText === 'when') {
      // A 'test' method will call up conditions tests
      featName = 'test';
    }

    const symbolData: TSymbolData = validationTokens[selectedSlot] || {};
    // filter out all the metadata from the symbolData, consolidating
    // the actual dictionaries of symbol types in `symbolDicts`
    const {
      unitText, // text representation of current scriptToken
      symbolScope, // name of symbol dict that this unitText matches with
      error, // true if there was an error, contains 'code' and 'info'
      gsType, // the GEMSCRIPT type expected for this slot
      gsName, // the GEMSCRIPT short name of this parameter
      ui_action, // after-action trigger (not used)
      ...symbolDicts
    } = symbolData;
    /* `symbolDicts` looks like this: {
          features: {Costume: {…}, Physics: {…}, AgentWidgets: {…}}
          props: {x: {…}, y: {…}, statusText: {…}, eType: {…}, energyLevel: {…}, …}
        }
    */

    // HELP
    symbolType = HELP.ForTypeInfo(gsType).name;
    slotTypeHelpText = HELP.ForTypeInfo(gsType).info;

    // Don't render choices if the current selection should be an input form
    if (
      gsType === 'number' ||
      gsType === 'string' ||
      gsType === 'boolean' ||
      gsType === 'identifier' ||
      gsType === 'block' ||
      gsType === '{...}'
    ) {
      return undefined;
    }

    /// EMBEDDED FUNCTION /////////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /** Renders jsx for each category of symbol and each individual selectable
     *  symbol in a two column grid format. Used for both the top level `props`
     *  and recursive (e.g. `feature.Costume`) props */
    function f_render_choices(
      sd: TSymbolData,
      vd: TSymbolViewData,
      categoryLabel = ''
    ): JSX.Element[] {
      // declarations
      const categoryDicts = []; // the list of symbol dictionaries to stack

      // iterate over all the keys in the symbolData, which will be things like
      // props, blueprints, anything definable in TSymbolData
      Object.keys(sd).forEach((stype: TGSType, i) => {
        const rowKey = `${sel_linenum}:${i}`;
        const vdata = vd[stype]; // { items, info }
        if (vdata === undefined) {
          // troubleshooting: check symbol-utilities DecodeSymbolViewData()
          // 1. sdata is being extracted from symbolData at top
          // 2. if (sdata) is creating items, list in sv_data
          console.error(
            ...PR(`tried to load '${stype}' from viewdata:\n`, vdata)
          );
          return [];
        }

        // prepare to sort through
        const choices = []; // this is the list of choices
        const expertChoices = []; // hack to show expert keywords in a different area
        const items = vdata.items;

        // get all the choices for this symbol type
        items.forEach(choice => {
          const choiceKey = `${stype}:${choice || GUI_EMPTY_TEXT}`;
          // if EditSymbol is locked, it overrides ALL symbol choices
          const symbolIsLocked =
            locked || LOCKED_SYMBOLS.includes(choice.toLowerCase());
          const help = HELP.ForChoice(stype, choice, featName);
          const helpTxt = help
            ? help.info || help.input || help.name
            : 'notok found';
          // 1. If the choice is supposed to be hidden, but
          //    is currently in use in the original script line,
          //    show it in the "expert" section so that it
          //    can be reselected
          let isAdvanced = false;
          if (
            (HIDDEN_SYMBOLS.includes(choice.toLowerCase()) &&
              SYMBOLS_IN_USE.includes(choice.toLowerCase())) ||
            ADVANCED_SYMBOLS.includes(choice.toLowerCase())
          ) {
            isAdvanced = true;
          }
          const tok = (
            <GSymbolTokenHelp
              key={choiceKey}
              symbolType={stype}
              unitText={unitText}
              choice={choice || GUI_EMPTY_TEXT}
              help={helpTxt}
              locked={symbolIsLocked}
              isAdvanced={isAdvanced}
            />
          );
          //   2. Show expert keywords
          if (isAdvanced) {
            expertChoices.push(tok);
          } else if (HIDDEN_SYMBOLS.includes(choice.toLowerCase())) {
            // 3. Hide unsupported and deprecated keywords
            return;
          } else {
            // 4. Regular keyword
            choices.push(tok);
          }
        }); // end items.forEach

        // choices and expertChoices are now populated with items from the
        // current symbols, so push them as two sections onto categoryDicts
        categoryDicts.push(
          <div key={rowKey} style={{ display: 'contents' }}>
            <GLabelToken
              key={rowKey}
              name={categoryLabel ? `${categoryLabel}` : symbolType}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[...choices]}
            </div>
          </div>
        );
        // if there are expertChoices push those too
        if (expertChoices.length > 0) {
          categoryDicts.push(
            <div key={`adv${rowKey}`} style={{ display: 'contents' }}>
              <GLabelToken
                key={`adv${rowKey}`}
                name={
                  categoryLabel
                    ? `expert ${categoryLabel}`
                    : `expert ${symbolType}`
                }
                secondary
              />
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {[...expertChoices]}
              </div>
            </div>
          );
        }
      }); // loop Object.keys(sd).forEach to get next symbol table dictionary

      // categoryDicts contains a stack of all the choices with all the symbolData
      // dictionary contents
      return categoryDicts;
    }

    // returns the list of symbolnames for a particular symbol
    const viewData: TSymbolViewData = SYMUTIL.DecodeSymbolViewData(symbolData);
    /* TODO: it would be nice to make unitText indicate it's the current value */
    // VALIDATION TOKENS are stored by key in the symbolDicts
    // Walk down all symbol dictionaries found in validation token symbols
    Object.entries(symbolDicts).forEach(entry => {
      const [dictName, dict] = entry as [keyof TSymbolData, TSymbolData];
      if (Array.isArray(symbolScope) && !symbolScope.includes(dictName)) return;
      allDicts.push(f_render_choices({ [dictName]: dict }, viewData, dictName));
    });
  }

  /// RENDER //////////////////////////////////////////////////////////////////
  /// drawn as "SCRIPT LINE EDITOR"
  /// [SYMBOL TYPE] symbol symbol symbol
  const prompt = symbolType
    ? `SELECT A ${symbolType.toUpperCase()}`
    : 'SELECT A KEYWORD';
  return (
    <div
      id="ES_symbols"
      style={{
        margin: '0 10px',
        padding: '10px 0',
        backgroundColor: 'rgba(255,255,255,0.25'
      }}
    >
      <StackUnit
        label={prompt}
        type="editor"
        open
        style={{ padding: '0 20px 20px 20px' }}
      >
        {slotTypeHelpText}
      </StackUnit>
      <StackText
        type="symbol"
        open
        sticky
        style={{ padding: '0 20px 20px 20px' }}
      >
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
      </StackText>
    </div>
  );
}
