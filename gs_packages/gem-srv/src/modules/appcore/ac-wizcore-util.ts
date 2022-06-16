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
const MUTATE = false;

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this is a dependent store, so we do not initialize it with _inializeState()
/// the main WIZCORE will handle that for us, but we just want to hook up
/// our routing here first
const STORE = StateMgr.GetInstance('ScriptWizard');

/// SCRIPT LINE EDITING STUFF ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve the linescript */
function TestEditableTokens(lineNum: number = 0) {
  const fn = 'TestEditableTokens:';

  // two ways to get the editable scripts:
  const { script_tokens, script_page } = STORE.State();
  const lsosFromScriptTokens = TRANSPILER.ScriptToEditableTokens(script_tokens);
  const lsos = TRANSPILER.ScriptPageToEditableTokens(script_page);

  // show original
  const scriptText = TRANSPILER.ScriptToText(script_tokens);
  console.group('Original ScriptText');
  console.log(scriptText);
  console.groupEnd();

  if (MUTATE) {
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
  }
  // reconstruct!
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  console.group('Editable Tokens');
  console.log(lsos);
  console.groupEnd();
  console.group('RepackedTokens');
  console.log(TRANSPILER.EditableTokensToScript(lsos));
  console.groupEnd();
  console.group('Reconstructed ScriptText');
  console.log(TRANSPILER.ScriptToText(nscript));
  console.groupEnd();

  // if you want to update script_page, sendState!!!
  // STORE.SendState({ script_tokens: nscript });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestScriptToEditableTokens(scriptText: string = '') {
  const fn = 'DemoLineScriptEditor:';

  const script_tokens = TRANSPILER.TextToScript(scriptText);
  const lsos = TRANSPILER.ScriptToEditableTokens(script_tokens);
  const lineNum = 0;
  function pad_num(ii) {
    return String(ii).padStart(2, ' ');
  }

  function filter_brackets(str) {
    str = str.replace('[[', '');
    str = str.replace(']]', '');
    return str.trimEnd();
  }
  function dump_tokens(script) {
    let ii = 0;
    script.forEach(stm => {
      const stmText = TRANSPILER.StatementToText(stm);
      const lines = stmText.split(`\n`);
      if (lines.length > 1) lines.pop();
      lines.forEach((line, jj) => {
        line = filter_brackets(line);
        console.log(`${pad_num(ii + jj)} - ${line}`);
      });
      ii += lines.length;
    });
  }

  function dump_editables(tokens) {
    let maxLen = 0;
    const eds = lsos.map(lso => {
      let text = TRANSPILER.StatementToText(lso.lineScript);
      if (text.length > maxLen) maxLen = text.length;
      return { ...lso, text };
    });
    maxLen += 5 + 1; // extra number padding+1
    eds.forEach((lso, ii) => {
      const { marker, text } = lso;
      let out = `${pad_num(ii)} - ${text}`;
      const pad = ''.padStart(maxLen - out.length, ' ');
      if (marker) out += `${pad} - marker:[${marker}]`;
      console.log(out);
    });
  }
  // reconstruct!
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  console.log(...PR('RUNNING EDITABLE TOKEN TESTS'));
  //
  console.group('Original Tokens (textified,filtered bracks)');
  dump_tokens(script_tokens);
  console.groupEnd();
  //
  console.group('Editable Tokens');
  dump_editables(lsos);
  console.groupEnd();
  //
  console.group('RepackedTokens (textified)');
  dump_tokens(nscript);
  console.groupEnd();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** force import */
function ForceImportHack() {}

/// DEBUG DEMO ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('test_editable', num => {
  TestEditableTokens(num);
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestEditableTokens, TestScriptToEditableTokens, ForceImportHack };
