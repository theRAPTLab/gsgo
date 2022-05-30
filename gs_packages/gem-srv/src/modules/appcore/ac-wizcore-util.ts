/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WIZCORE SCRIPT TOKEN HELPER

  The basic idea: the script-to-lines modules now has a lookup table
  for lineScripts that can be used to edit the script directory through
  the Array.splice (in-place modification) or wholesale replacement

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-v2';

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZCORE', 'TagCyan');

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this is a dependent store, so we do not initialize it with _inializeState()
/// the main WIZCORE will handle that for us, but we just want to hook up
/// our routing here first
const STORE = StateMgr.GetInstance('ScriptWizard');

/// SCRIPT LINE EDITING STUFF ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve the linescript */
function DemoLineScriptEditor(lineNum: number = 0) {
  const fn = 'GetLineScript:';

  // two ways to get the editable scripts:
  const { script_tokens, script_page } = STORE.State();
  const lsosFromScriptTokens = TRANSPILER.ScriptToEditableTokens(script_tokens);
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);

  // demo modify the script_page tokens
  lsos.forEach(lso => {
    // replace all energyLevel with BANANACAKE
    lso.lineScript.forEach(tok => {
      if (tok.identifier && tok.identifier === 'energyLevel')
        tok.identifier = 'BANANACAKE';
    });
  });
  // insert three identifiers at the start of provided lineNum (default 0)
  lsos[lineNum].lineScript.splice(
    0,
    0,
    { identifier: 'moooooooo' },
    { identifier: 'cow' },
    { identifier: 'mooooooo' }
  );
  // insert a line before lineNum
  lsos.splice(lineNum, 0, {
    lineScript: [{ comment: 'AAAAAAAAAAAAAAAAAA' }]
  });
  // replace line 10
  lsos.splice(10, 1, {
    lineScript: [{ comment: 'NOOOOOOOOOO' }]
  });

  // reconstruct!
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  const text = TRANSPILER.ScriptToText(nscript);
  console.group('Editable Tokens');
  console.log(lsos);
  console.groupEnd();
  console.group('RepackedTokens');
  console.log(nscript);
  console.groupEnd();
  console.group('Reconstructed ScriptText');
  console.log(text);
  console.groupEnd();

  // if you want to update script_page, sendState!!!
  // STORE.SendState({ script_tokens: nscript });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** force import */
function ForceImportHack() {}

/// DEBUG DEMO ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('test_lineedit', num => {
  DemoLineScriptEditor(num);
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { DemoLineScriptEditor, ForceImportHack };
