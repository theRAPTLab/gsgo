/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptContextor - Displays the overall context of a blueprint, as well
  as providing help as needed. I'm imagining it as an accordion view.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import Console from './Console';
import { SymbolSelector } from './SymbolSelector';
import { GridStack, FlexStack, StackUnit } from './WizElementLibrary';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ScriptContextor');

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ScriptContextor(props) {
  // we need the current selection
  const { selected } = props;
  const { sel_linenum, sel_linepos } = selected;
  const label = `options for token ${sel_linenum}:${sel_linepos}`;
  // this is a managed TextBuffer with name "ScriptContextor"
  const allDicts = [];

  const { dbg_console } = WIZCORE.State();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FlexStack id="ScriptContextor">
      <SymbolSelector selected={selected} />
      <Console title="AVAILABLE SYMBOL INFO" name={dbg_console} rows={5} />
      <StackUnit
        label="NOTES"
        open
        style={{
          whiteSpace: 'normal',
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '10px 10px 5px 10px'
        }}
      >
        <b>queue: prototype script building</b> - (1){' '}
        <strike>write value back to update script</strike> (2) add value editor
        (3) add string editor (4) add objref editor (5) generalize.
        <br />
        <br />
        <div style={{ lineHeight: '1em', fontSize: '10px' }}>
          EDGE CASES TO RESOLVE
          <br />
          <br />
          <ul style={{ lineHeight: '1em', fontSize: '10px' }}>
            <li>addProp: changing existing name should rename everything</li>
            <li>scriptText: bad script ref does not generate symbols</li>
          </ul>
        </div>
      </StackUnit>
      <div style={{ whiteSpace: 'normal' }}>
        note: all colors are for determining extents of functional component
        areas, and do not represent final look and feel. styling is provided by{' '}
        <a href="https://picocss.com/docs/">pico</a>
      </div>
    </FlexStack>
  );
}
