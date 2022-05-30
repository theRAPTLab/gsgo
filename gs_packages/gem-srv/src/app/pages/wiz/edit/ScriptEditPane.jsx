/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptContextor - Displays the overall context of a blueprint, as well
  as providing help as needed. I'm imagining it as an accordion view.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { TokenToString, DecodeTokenPrimitive } from 'script/transpiler-v2';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import Console from '../stat/Console';
import { EditSymbol } from './EditSymbol';
import { SelectEditor } from './SelectEditor';
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
  const keywords = WIZCORE.GetSymbolNames('keywords');
  const features = WIZCORE.GetSymbolNames('features');
  const properties = WIZCORE.GetSymbolNames('props');
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

/// GUI EDITOR DEFINITION /////////////////////////////////////////////////////
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
      {/* <DevStuffToAdd /> */}
      {/* put some kind of chooser here */}
      <SelectEditor selection={selection} />
      {/* then back to business */}
      <Console
        title="DEV: AVAILABLE SYMBOL INFO"
        name={dbg_console}
        rows={5}
        open
      />
      {/* <DevNotes /> */}
      {/* <DevNotice /> */}
    </FlexStack>
  );
}
