/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptContextor - Displays the overall context of a blueprint, as well
  as providing help as needed. I'm imagining it as an accordion view.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { UnpackArg } from 'modules/datacore';
import {
  TokenToString,
  UnpackToken,
  DecodeTokenPrimitive
} from 'script/transpiler-v2';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import Console from '../stat/Console';
import { EditSymbol } from './EditSymbol';
import {
  GridStack,
  FlexStack,
  StackUnit,
  GToken,
  StackText
} from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ScriptContextor');
const KEY_BITS = -1 + 2 ** 16;
let KEY_COUNTER = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generates a sequential key index for React lists that increments and wraps
 *  back to 0 after 16 bits exceeded. The output is a 4-digit hex string.
 *  This assumes that no more than 65536 elements are rendered at a time,
 *  which is pretty safe bet :-) We have to do this because our script_page
 *  elements do not have unique ids.
 */
function u_Key(prefix = '') {
  const hex = KEY_COUNTER.toString(16).padStart(4, '0');
  if (++KEY_COUNTER > KEY_BITS) KEY_COUNTER = 0;
  return `${prefix}${hex}`;
}

/// NOTES AND STUFF ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DevStuffToAdd(props) {
  const features = WIZCORE.GetBundleSymbolNames('features');
  const properties = WIZCORE.GetBundleSymbolNames('props');
  const keywords = WIZCORE.GetBundleSymbolNames('keywords');
  return (
    <StackUnit label="DEV: BLUEPRINT REF GOES HERE">
      <StackUnit label="BUILDING PIECES">
        This is the palette of things you can build or access. Maybe also help.
        <FlexStack>
          <StackUnit label="available keywords" wrap>
            {keywords.join(', ')}
          </StackUnit>
          <StackUnit label="available features" wrap>
            {features.join(', ')}
          </StackUnit>
          <StackUnit label="available properties" wrap>
            {properties.join(', ')}
          </StackUnit>
          <StackUnit label="device tags" wrap>
            things like TAG isCharControllable
          </StackUnit>
        </FlexStack>
      </StackUnit>
      <StackUnit label="EDIT CONDITIONS">
        <StackText>WHEN clause?</StackText>
      </StackUnit>
      <StackUnit label="EDIT EVENTS">
        <StackText>ON systemEvent list</StackText>
      </StackUnit>
    </StackUnit>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DevNotes(props) {
  return (
    <StackUnit
      label="DEV: NOTES"
      open
      style={{
        whiteSpace: 'normal',
        backgroundColor: 'rgba(0,0,0,0.05)'
      }}
    >
      <b>queue: prototype script building</b> - (1){' '}
      <strike>write value back to update script</strike> (2) add value editor (3)
      add string editor (4) add objref editor (5) generalize.
      <br />
      <br />
      <div style={{ lineHeight: '1em', fontSize: '10px' }}>
        EDGE CASES TO RESOLVE
        <br />
        <br />
        <ul style={{ lineHeight: '1em', fontSize: '10px' }}>
          <li>addProp: changing existing name should rename everything</li>
          <li>scriptText: bad script ref does not generate symbols</li>
          <li>tokenEdit: click a feature throws error</li>
        </ul>
      </div>
    </StackUnit>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DevNotice(props) {
  return (
    <StackText>
      note: all colors are for determining extents of functional editornent areas,
      and do not represent final look and feel. styling is provided by{' '}
      <a href="https://picocss.com/docs/" rel="noreferrer" target="_blank">
        pico
      </a>
    </StackText>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HACK: print the line of script tokens for current line */
function ScriptLine(props) {
  const lineBuffer = [];
  const { selection } = props;
  const { vmPageLine } = selection || {};
  const { vmTokens } = vmPageLine || {};
  const hasTokens = vmTokens.length > 0;
  const selTokId = WIZCORE.SelectedTokenId();
  const selLineNum = WIZCORE.SelectedLineNum();
  // iterate over vmTokens if it exists
  if (hasTokens) {
    vmTokens.forEach((tokInfo, idx) => {
      const { scriptToken, tokenKey } = tokInfo;
      const dtok = DecodeTokenPrimitive(scriptToken);
      const label = typeof dtok !== 'object' ? dtok : TokenToString(scriptToken);
      const selected = tokenKey === selTokId;
      lineBuffer.push(
        <GToken
          key={u_Key()}
          position={idx}
          selected={selected}
          label={label}
          tokenKey={tokenKey}
          token={scriptToken}
        />
      );
    });
  }
  return lineBuffer;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** determine what editor to show  */
function TokenTyper(props) {
  const { selection } = props;
  if (selection === undefined) return null;

  // TODO: this manipulation should all be moved to a WIZCORE method
  // as much as possible
  const { sel_linepos: pos, validation, scriptToken } = selection;
  const { validationTokens: vtoks, validationLog } = validation;
  const vtok = vtoks[pos - 1];
  const { arg, gsType, methodSig, unitText } = vtok; // we want to SWITCH ON THIS
  const { name, args: methodArgs, info } = methodSig || {}; // HACK FOR TESTING and not breaking other tokens
  // end TODO
  const processNumberInput = e => {
    e.preventDefault();
    scriptToken.value = Number(e.target.value);
  };
  const processStringInput = e => {
    e.preventDefault();
    scriptToken.string = String(e.target.value);
  };
  const handleNumberKeypress = e => {
    if (e.key === 'Enter') {
      processNumberInput(e);
      WIZCORE.ScriptChanged();
      e.target.select();
    }
  };
  const handleStringKeypress = e => {
    if (e.key === 'Enter') {
      processStringInput(e);
      WIZCORE.ScriptChanged();
      e.target.select();
    }
  };
  let editor;
  switch (gsType) {
    case 'number':
      editor = (
        <>
          <ScriptLine selection={selection} />
          <p>
            <b>arguments for {name}</b> {methodArgs.join(',')}
            <br />
            <b>helpful</b> {info}
          </p>
          <label>enter {gsType}</label>
          <input
            defaultValue={Number(unitText)}
            type="number"
            onChange={processNumberInput}
            onKeyPress={handleNumberKeypress}
          />
          ;
        </>
      );
      break;
    case 'string':
      editor = (
        <>
          <ScriptLine selection={selection} />
          <p>
            <b>arguments for {name}</b> {methodArgs.join(',')}
            <br />
            <b>helpful</b> {info}
          </p>
          <label>enter {gsType}</label>
          <input
            defaultValue={unitText}
            type="text"
            onChange={processStringInput}
            onKeyPress={handleStringKeypress}
          />
          ;
        </>
      );
      break;
    default:
      editor = (
        <>
          <ScriptLine selection={selection} />
          <EditSymbol selection={selection} />
        </>
      );
  }
  return editor;
}

/// editorNENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ScriptEditPane(props) {
  // we need the current selection if there is one
  let selection = WIZCORE.SelectedTokenInfo();
  if (selection !== undefined) {
    const { sel_linepos: pos, validation } = selection;
    const { validationTokens: vtoks, validationLog } = validation;
    WIZCORE.UpdateDBGConsole(validationLog);
    const vtok = vtoks[pos - 1];
  }
  const { dbg_console } = WIZCORE.State();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FlexStack id="ScriptContextor">
      <DevStuffToAdd />
      {/* put some kind of chooser here */}
      <TokenTyper selection={selection} />
      {/* then back to business */}
      <Console title="DEV: AVAILABLE SYMBOL INFO" name={dbg_console} rows={5} />
      <DevNotes />
      <DevNotice />
    </FlexStack>
  );
}
