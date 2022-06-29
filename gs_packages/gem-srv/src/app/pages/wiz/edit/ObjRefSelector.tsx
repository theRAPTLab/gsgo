/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ObjRefSelector

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
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import { GValidationToken, GSymbolToken } from '../SharedElements';
import { HIDDEN_SYMBOLS, ADVANCED_SYMBOLS } from './EditSymbol';
import { GUI_EMPTY_TEXT } from 'modules/../types/t-script.d'; // workaround to import constant

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const OBJREFTYPE_PROP = 'propObjRef';
const OBJREFTYPE_FEATPROP = 'featPropObjRef';
const OBJREFTYPE_FEATMETHOD = 'featMethodObjRef';

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ObjRefSelector(props) {
  // 'objRefPos' is the slot position of the object reference relative to
  // slots_validation
  const { selection, expectedType, objRefPos } = props;
  if (!selection)
    return <div className="gsled panel panelhelp">Nothing Selected</div>;
  const { slots_linescript, slots_validation, sel_slotpos, sel_linenum } =
    WIZCORE.State();

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
  let objRefType;
  const keywordTok =
    validationTokens && Array.isArray(validationTokens)
      ? validationTokens[0]
      : undefined;
  const keyword = keywordTok ? keywordTok.unitText : undefined;

  // 4. Generate validation tokens for objref
  const vtoks = []; // validation token array
  if (keyword === 'prop') {
    // PROP OBJREF
    const [bpName, propName] = bits;
    // Part 1: bpName
    vtoks.push({
      selectedText: bpName,
      type: 'blueprint',
      options: vtok.blueprints
    });
    // part 2: bpProps
    const bpDef = bpName ? vtok.blueprints[bpName] : undefined;
    const bpProps = bpDef ? bpDef.props : [];
    vtoks.push({
      selectedText: propName,
      parentLabel: bpName,
      type: 'propName',
      options: bpProps
    }); // propName
  } else {
    // FEATURE
    const [bpName, featName, part3] = bits;
    // Part 1: bpName
    vtoks.push({
      selectedText: bpName,
      type: 'blueprint',
      options: vtok.blueprints
    });
    // Part 2: featName
    const bpDef = bpName ? vtok.blueprints[bpName] : undefined;
    const featList = bpDef && bpDef.features ? bpDef.features : [];
    vtoks.push({
      selectedText: featName,
      parentLabel: bpName,
      type: 'featName',
      options: featList
    });

    if (keyword === 'featProp') {
      // FEAT PROP OBJREF
      // Part 3: featProp
      const featProp = part3;
      const featDef = featList ? featList[featName] : undefined;
      const featProps = featDef && featDef.props ? featDef.props : [];
      vtoks.push({
        selectedText: featProp,
        parentLabel: `${bpName}.${featName}`,
        type: 'featProp',
        options: featProps
      }); // propName
    } else if (keyword === 'featCall') {
      // FEAT METHOD OBJREF
      // Part 3: featMethod
      const featMethod = part3;
      const featDef = featList ? featList[featName] : undefined;
      const featMethods = featDef && featDef.methods ? featDef.methods : [];
      vtoks.push({
        selectedText: featMethod,
        parentLabel: `${bpName}.${featName}`,
        type: 'featMethod',
        options: featMethods
      }); // propName
    }
  }

  const tokenList = [];
  const optionsList = [];
  vtoks.forEach((tok, position) => {
    const tokenKey = `${sel_linenum},${sel_slotpos},${position}`;
    const type = tok.type;
    const label = tok.selectedText || GUI_EMPTY_TEXT;
    const selected = tok.selectedText === label; // always selected, so don't show selected

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
          type={type}
          label={label}
          viewState={code} // error
          error={info} // error
          isSlot
        />
      </div>
    );

    const options = [];
    const advanced = [];
    Object.keys(tok.options).forEach(k => {
      const optionLabel = tok.parentLabel ? `${tok.parentLabel}.${k}` : k || '';
      if (HIDDEN_SYMBOLS.includes(k.toLowerCase())) return;
      if (ADVANCED_SYMBOLS.includes(k.toLowerCase())) {
        advanced.push(
          <div style={{ opacity: 0.3 }} key={k}>
            <GSymbolToken
              key={k}
              symbolType={k}
              unitText={label} // currently selected text
              choice={optionLabel} // value returned when selected e.g. 'bp.feat.prop'
              label={k} // human readable display
            />
          </div>
        );
        return;
      }
      options.push(
        <GSymbolToken
          key={k}
          symbolType={k}
          unitText={label} // currently selected text
          choice={optionLabel} // value returned when selected e.g. 'bp.feat.prop'
          label={k} // human readable display
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
  return (
    <div style={{ padding: '0 20px' }}>
      <div
        className="gsled tokenList"
        style={{
          gridTemplateColumns: `repeat(${tokenCount},1fr)`,
          gridTemplateRows: 'auto auto',
          gridAutoFlow: 'row',
          paddingBottom: '10px'
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
export { ObjRefSelector };
