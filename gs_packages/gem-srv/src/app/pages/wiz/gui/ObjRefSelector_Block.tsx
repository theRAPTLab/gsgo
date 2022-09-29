/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ObjRefSelector_Block

  This is a slot editor for defining compound object references for
  use with 'prop', 'featProp' and 'featCall' keywords.

  It operates as a "sub" slot editor, appearing inside the main
  slot editor.

    keyword   format
    -------   ------------------------------
    prop      <bp>.<propName>
    featProp  <bp>.<featName>.<featPropName>
    featCall  <bp>.<featName>.<featMethod>

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import * as SLOTCORE from 'modules/appcore/ac-slotcore';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as HELP from 'app/help/codex';
import { StackUnit, GValidationToken, GSymbolTokenHelp } from '../SharedElements';
import { HIDDEN_SYMBOLS, ADVANCED_SYMBOLS } from './EditSymbol_Block';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const OBJREFTYPE_PROP = 'propObjRef';
const OBJREFTYPE_FEATPROP = 'featPropObjRef';
const OBJREFTYPE_FEATMETHOD = 'featMethodObjRef';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ObjRefSelector_Block(props) {
  // 'objRefPos' is the slot position of the object reference relative to
  // slots_validation
  const { selection, expectedType, objRefPos } = props;
  if (!selection)
    return <div className="gsled panel panelhelp">Nothing Selected</div>;
  const { sel_linenum } = WIZCORE.State();
  const { slots_linescript, slots_validation, sel_slotpos } = SLOTCORE.State();
  // 1. Process each validation token
  const { validationTokens } = slots_validation;
  // get the vtoken of the objRef slot
  const vtok = validationTokens[CHECK.OffsetLineNum(objRefPos, 'sub')];
  const { gsType, methodSig, unitText, error } = vtok || {}; // gracefully fail if not defined
  const { code, info } = error || {};

  // 2. deref the objref
  let bits = unitText.split('.');
  if (!Array.isArray(bits)) bits = [bits];

  // 3. Look up the keyword to figure out what kind of validation tokens to use
  const keywordTok =
    validationTokens && Array.isArray(validationTokens)
      ? validationTokens[0]
      : undefined;
  const keyword = keywordTok ? keywordTok.unitText : undefined;

  // 4. Generate validation tokens for objref
  const vtoks = []; // validation token array
  if (['prop', 'propPop', 'propPush', 'ifProp'].includes(keyword)) {
    // PROP OBJREF
    const [bpName, propName] = bits;
    // Part 1: bpName
    vtoks.push({
      selectedText: bpName,
      type: 'select blueprint',
      options: vtok.blueprints
    });
    // part 2: bpProps
    const bpDef = bpName ? vtok.blueprints[bpName] : undefined;
    const bpProps = bpDef ? bpDef.props : [];
    vtoks.push({
      selectedText: propName,
      parentLabel: bpName,
      type: 'select prop',
      options: bpProps
    }); // propName
  } else {
    // FEATURE
    const [bpName, featName, part3] = bits;
    // Part 1: bpName
    vtoks.push({
      selectedText: bpName,
      type: 'select blueprint',
      options: vtok.blueprints
    });
    // Part 2: featName
    const bpDef = bpName && vtok.blueprints ? vtok.blueprints[bpName] : undefined;
    const featList = bpDef && bpDef.features ? bpDef.features : [];
    vtoks.push({
      selectedText: featName,
      parentLabel: bpName,
      type: 'select feature',
      options: featList
    });

    if (
      ['featProp', 'featPropPop', 'featPropPush', 'ifFeatProp'].includes(keyword)
    ) {
      // FEAT PROP OBJREF
      // Part 3: featProp
      const featProp = part3;
      const featDef = featList ? featList[featName] : undefined;
      const featProps = featDef && featDef.props ? featDef.props : [];
      vtoks.push({
        selectedText: featProp,
        parentLabel: `${bpName}.${featName}`,
        type: 'select feature prop',
        options: featProps
      });
    }
    // DEPRECATED: featCall's objref is just <bpName><featName>
    //             It doesn't include the <methodName>
    //
    // } else if (keyword === 'featCall') {
    //   // FEAT METHOD OBJREF
    //   // Part 3: featMethod
    //   const featMethod = part3;
    //   const featDef = featList ? featList[featName] : undefined;
    //   const featMethods = featDef && featDef.methods ? featDef.methods : [];
    //   vtoks.push({
    //     selectedText: featMethod,
    //     parentLabel: `${bpName}.${featName}`,
    //     type: 'featMethod',
    //     options: featMethods
    //   }); // propName
  }

  const tokenList = [];
  const optionsList = [];
  vtoks.forEach((tok, position) => {
    const tokenKey = `${sel_linenum},${sel_slotpos},${position}`;
    const type = tok.type;
    const label = tok.selectedText || GUI_EMPTY_TEXT;
    const selected = tok.selectedText === label; // always selected, so don't show selected
    let viewState = code;
    if (tok.selectedText === '' || tok.selectedText === undefined) {
      viewState = 'empty'; // If slot is empty, it's empty, it's not an error
    }
    // 1. Selected ObjRef Slot (e.g. agent, feature, prop, method)
    // unitText is the parentLabel, e.g. agent.Costume.costumeName
    // need to pass for featProp
    //   (e.g. if this is featProp value, we need to look up
    //    which feature the featProp came out)
    const syntaxHelp = HELP.ForTypeInfo(type);
    const syntaxHelpTxt = syntaxHelp.info || syntaxHelp.name;
    const selectedTokenHelp = HELP.ForChoice(type, tok.selectedText, unitText);
    const selectedTokenHelpTxt = selectedTokenHelp
      ? selectedTokenHelp.input || selectedTokenHelp.info // favor instructions (input)?
      : 'token help not found';
    const isRightSide = position / vtoks.length >= 0.5;
    tokenList.push(
      <div
        key={tokenKey}
        style={{ display: 'grid', gridTemplateRows: '30px 30px 2px' }}
      >
        <GValidationToken
          key={tokenKey}
          tokenKey={tokenKey}
          position={position}
          selected={selected}
          type={type} // left column of table
          name={type} // syntax label
          label={label} // column subtitle (repeated)
          viewState={viewState} // error
          error={info} // error
          syntaxHelp={syntaxHelpTxt}
          help={selectedTokenHelpTxt}
          isSlot
          isRightSide={isRightSide}
        />
      </div>
    );

    // 2. Choices for ObjRef Slot (e.g. bpnames, features )
    const options = [];
    const advanced = [];
    const alphabetizedKeys = Object.keys(tok.options).sort();
    if (alphabetizedKeys)
      alphabetizedKeys.forEach(key => {
        const optionLabel = tok.parentLabel
          ? `${tok.parentLabel}.${key}`
          : key || '';
        const deref = tok.parentLabel ? tok.parentLabel.split('.') : [];
        const featName = deref.length > 1 ? deref[1] : deref[0];
        const optionHelp = HELP.ForChoice(type, key, featName);
        const optionHelpTxt = optionHelp
          ? optionHelp.info || optionHelp.name
          : 'option help not found';
        if (HIDDEN_SYMBOLS.includes(key.toLowerCase())) return;
        if (ADVANCED_SYMBOLS.includes(key.toLowerCase())) {
          advanced.push(
            <div key={key}>
              <GSymbolTokenHelp
                key={key}
                symbolType={key}
                unitText={label} // currently selected text
                choice={optionLabel} // value returned when selected e.g. 'bp.feat.prop'
                label={key} // human readable display
                help={optionHelpTxt}
                isAdvanced
                isEditSymbol
              />
            </div>
          );
          return;
        }
        options.push(
          <GSymbolTokenHelp
            key={key}
            symbolType={key}
            unitText={label} // currently selected text
            choice={optionLabel} // value returned when selected e.g. 'bp.feat.prop'
            label={key} // human readable display
            help={optionHelpTxt}
            isEditSymbol
          />
        );
      });

    optionsList.push(
      <div key={position} className="gsled objref-choices">
        {[...options, ...advanced]}
      </div>
    );
  });

  const tokenCount = vtoks.length;
  const prompt = `EDIT ${HELP.ForTypeInfo('objref').name.toUpperCase()}`;
  const helpInfo = HELP.ForTypeInfo('objref').info;
  return (
    <div
      style={{
        margin: '0 10px',
        padding: '10px',
        backgroundColor: 'rgba(255,255,255,0.25'
      }}
    >
      <StackUnit label={prompt} type="editor" open>
        {helpInfo}
      </StackUnit>
      <div
        id="ORS_select"
        className="gsled tokenList"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${tokenCount},1fr)`,
          gridTemplateRows: 'auto auto',
          gridAutoFlow: 'row',
          paddingBottom: '10px',
          backgroundColor: 'transparent'
        }}
      >
        {tokenList}
        {optionsList}
      </div>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ObjRefSelector_Block };
