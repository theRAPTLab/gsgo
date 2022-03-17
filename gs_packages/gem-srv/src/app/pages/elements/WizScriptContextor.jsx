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
import { sButtonConsole, buttonStyle } from './wizard-style';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ScriptContextor');

/// COMPONENT PLAYGROUND //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SelectionList(props) {
  const { label, selected } = props;
  const { sel_linenum: line, sel_linepos: pos } = selected;
  /*** here we do things ***/

  // can get get the current GToken?
  const { sel_validation } = WIZCORE.State();
  /** now we output stuff ***/
  if (line < 0) return <p>no selection</p>;
  return (
    <div style={{ fontFamily: 'monospace' }}>
      <p>{label}</p>
      <p>
        [token {line}:{pos}]
      </p>
    </div>
  );
}

function GLabel(props) {
  const { name, color = 'white', bg = 'black' } = props;
  return (
    <div
      className="gwiz gtoken"
      style={{
        backgroundColor: bg,
        color: color,
        fontWeight: 'bold',
        minWidth: '100px'
      }}
    >
      {name}
    </div>
  );
}

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <SymbolSelector selected={selected} />
      <Console title="AVAILABLE SYMBOL INFO" name={dbg_console} rows={5} />
      <details
        open
        style={{
          whiteSpace: 'normal',
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '10px 0 5px 10px'
        }}
      >
        <summary>NOTES</summary>
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
      </details>
      <div style={{ whiteSpace: 'normal' }}>
        note: all colors are for determining extents of functional component
        areas, and do not represent final look and feel. styling is provided by{' '}
        <a href="https://picocss.com/docs/">pico</a>
      </div>
    </div>
  );
}
