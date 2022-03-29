/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptContextor - Displays the overall context of a blueprint, as well
  as providing help as needed. I'm imagining it as an accordion view.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { UnpackArg } from 'modules/datacore';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import Console from '../stat/Console';
import { EditSymbol } from './EditSymbol';
import { GridStack, FlexStack, StackUnit, StackText } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ScriptContextor');

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
      note: all colors are for determining extents of functional component areas,
      and do not represent final look and feel. styling is provided by{' '}
      <a href="https://picocss.com/docs/" rel="noreferrer" target="_blank">
        pico
      </a>
    </StackText>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** determine what editor to show  */
function TokenTyper(props) {
  const { selection } = props;
  if (selection === undefined) return null;

  // TODO: this manipulation should all be moved to a WIZCORE method
  // as much as possible
  const { sel_linepos: pos, validation } = selection;
  const { validationTokens: vtoks, validationLog } = validation;
  const vtok = vtoks[pos - 1];
  const { arg, gsType, methodSig, unitText } = vtok; // we want to SWITCH ON THIS
  const { name, args: methodArgs } = methodSig || {}; // HACK FOR TESTING and not breaking other tokens
  console.log('methodSig', methodSig);

  // end TODO

  switch (gsType) {
    case 'number':
      /*
        [x] how to get the name of this argument?
        [x] how to get the parent method symbols for this argument?
        - we added methodSig to validationToken
        [ ] how to get the name of the parent?
        - stuff it into the validationToken for any methodArg beforehand

      */
      return (
        <>
          <p>
            methodSig: {name} {methodArgs.join(',')}
          </p>
          <label>enter {gsType}</label>
          <input type="number" />;
        </>
      );
    default:
      return <EditSymbol selection={selection} />;
  }
}

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
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
