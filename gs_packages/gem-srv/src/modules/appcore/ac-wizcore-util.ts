/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WIZCORE SCRIPT TOKEN HELPER

  The basic idea: the script-to-lines modules now has a lookup table
  for lineScripts that can be used to edit the script directory through
  the Array.splice (in-place modification) or wholesale replacement

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-v2';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';

// load state
const { StateMgr } = UR.class;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZCORE', 'TagCyan');
const MUTATE = false;

type TScriptUpdateResult = {
  script_tokens?: TScriptUnit[];
  error?: TSymbolError;
  oldLines?: string[];
  newLines?: string[];
};

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this is a dependent store, so we do not initialize it with _inializeState()
/// the main WIZCORE will handle that for us, but we just want to hook up
/// our routing here first
const STORE = StateMgr.GetInstance('ScriptWizard');

/// CHEESEBALL SCRIPT EDITING INTERFACE ///////////////////////////////////////
/// these routines do a conversion to text and back to do the script editing,
/// which is kind of sketchy but is a quick and dirty hadck to just get the
/// gui working
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper function: converts script_tokens into script_lines */
function m_GetScriptLinesFromTokens(script_tokens: TScriptUnit[]): string[] {
  const script_text = TRANSPILER.ScriptToText(script_tokens);
  const script_lines = script_text.split('\n');
  return script_lines;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** helper function: converts script_lines to script_tokens */
function m_GetScriptTokensFromLines(script_lines: string[]) {
  const script_text = script_lines.join('\n');
  const script_tokens = TRANSPILER.TextToScript(script_text);
  return script_tokens;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: replace the current line number with the provided lineScript */
function UpdateLine(
  script_tokens: TScriptUnit[],
  lineNum: number,
  lineScript: TScriptUnit
): TScriptUpdateResult {
  const fn = 'UpdateLine:';
  const script_lines = m_GetScriptLinesFromTokens(script_tokens);
  //
  const index = CHECK.OffsetLineNum(lineNum, 'sub');
  if (index < 0 || index > script_lines.length - 1) {
    return { error: { code: 'invalid', info: `${lineNum} out of range` } };
  }
  //
  const oldLine = script_lines[index];
  const newLine = TRANSPILER.StatementToText(lineScript);
  script_lines[index] = newLine;
  const updated_script = m_GetScriptTokensFromLines(script_lines);
  //
  console.log(
    `%cmodified @${lineNum}`,
    'font-weight:bold;color:magenta',
    `\nold: ${oldLine.trim()}`,
    `\nnew: ${newLine.trim()}`
  );
  //
  return {
    oldLines: [oldLine],
    newLines: [newLine],
    script_tokens: updated_script
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: delete a single line by number */
function DeleteLine(
  script_tokens: TScriptUnit[],
  lineNum: number,
  count: number = 1
) {
  const fn = 'DeleteLine:';
  const script_lines = m_GetScriptLinesFromTokens(script_tokens);
  //
  const index = CHECK.OffsetLineNum(lineNum, 'sub');
  if (index < 0 || index > script_lines.length - 1) {
    return { error: { code: 'invalid', info: `${lineNum} out of range` } };
  }
  //
  const delLines = script_lines.splice(index, count);
  const updated_script = m_GetScriptTokensFromLines(script_lines);
  //
  console.log(
    `%cdeleted @${lineNum}`,
    'font-weight:bold;color:magenta',
    delLines
  );

  //
  return {
    oldLines: delLines,
    newLines: [],
    script_tokens: updated_script
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: insert a single lineScript at lineNum */
function InsertLine(
  script_tokens: TScriptUnit[],
  lineNum: number,
  lineScript: TScriptUnit
) {
  const fn = 'InsertLine:';
  const script_lines = m_GetScriptLinesFromTokens(script_tokens);
  //
  const index = CHECK.OffsetLineNum(lineNum, 'sub');
  if (index < 0 || index > script_lines.length - 1) {
    return { error: { code: 'invalid', info: `${lineNum} out of range` } };
  }
  //
  const newLine = TRANSPILER.StatementToText(lineScript);
  script_lines.splice(index, 0, newLine);
  const updated_script = m_GetScriptTokensFromLines(script_lines);
  //
  console.log(
    `%cinserted @${lineNum}`,
    'font-weight:bold;color:magenta',
    newLine
  );
  //
  return {
    oldLines: [],
    newLines: [newLine],
    script_tokens: updated_script
  };
}
/// TEST BRUTE FORCE SCRIPT LINE EDITING STUFF ////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test the insert, delete, update methods */
function TestEditableText(scriptText) {
  const fn = 'TestEditiableText:';
  let script_tokens = TRANSPILER.TextToScript(scriptText);

  console.group('Original ScriptText');
  console.log(scriptText);
  console.groupEnd();

  console.group('Modifying ScriptText');
  let line = `prop energyLevel setTo 'InsertedLine'`;
  // here we are creating lineText, but these API methods are designed to
  // work with lineScript tokens
  let lineScript = TRANSPILER.StringToLineScript(line);
  let results;
  // insert linescript into script_tokens
  results = InsertLine(script_tokens, 4, lineScript);
  script_tokens = results.script_tokens;
  // delete linescript from script_tokens
  results = DeleteLine(script_tokens, 3);
  script_tokens = results.script_tokens;
  // // modify a line
  line = `prop energyLevel setTo 'stunning change'`;
  lineScript = TRANSPILER.StringToLineScript(line);
  results = UpdateLine(script_tokens, 5, lineScript);
  script_tokens = results.script_tokens;
  console.groupEnd();

  //
  console.group('Reconstructed ScriptText');
  const newText = TRANSPILER.ScriptToText(script_tokens);
  console.log(newText);
  console.groupEnd();
}

/// SCRIPT LINE EDITING STUFF ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This test is called From DevCodeTester */
function TestEditableTokens(scriptText: string = '') {
  const fn = 'TestScriptToEditableTokens:';

  function pad_num(ii: number) {
    return String(ii).padStart(2, ' ');
  }

  function dump_script(script: TScriptUnit[]) {
    let ii = 0;
    script.forEach(stm => {
      const stmText = TRANSPILER.StatementToText(stm);
      const lines = stmText.split(`\n`);
      lines.forEach((line, jj) => {
        console.log(`${pad_num(ii + jj)} - ${line}`);
      });
      ii += lines.length;
    });
  }

  function dump_editables(lsoEditables: VMLineScriptLine[]) {
    let maxLen = 0;
    const eds = lsoEditables.map(lso => {
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

  function mismatch_text(textA: string, textB: string) {
    let a = textA.trim();
    let b = textB.trim();
    let alen = textA.length;
    let blen = textB.length;
    if (alen < blen) {
      let temp: any = blen;
      blen = alen;
      alen = temp;
      temp = b;
      b = a;
      b = temp;
    }
    for (let i = 0; i < alen; i++) {
      if (i > blen - 1) return i;
      let cha = a[i];
      let chb = b[i];
      if (cha !== chb) return i;
    }
    return undefined;
  }

  function highlight(text: string, options: any = {}) {
    let { selection, color, title } = options;
    color = color || 'black';
    title = title || '';
    if (typeof selection !== 'number') {
      console.log(
        `%c${title}\n%c${text}`,
        'color:black;font-weight:bold',
        `color:${color}`
      );
      return;
    }
    let A = text.substring(0, selection);
    let CH = text.substring(selection, selection + 1);

    let B = selection < text.length - 1 ? text.substring(selection + 1) : '';
    let CCCH = CH.charCodeAt(0);
    if (CCCH < 32)
      CH = `<charcode:${CH.charCodeAt(0)}>${String.fromCharCode(CCCH)}`;
    console.log(
      `%c${title}\n%c${A}%c${CH}%c${B}`,
      'color:black;font-weight:bold',
      `color:${color}`,
      'background-color:rgba(255,0,0,0.5)',
      `color:${color};background-color:none`
    );
    return;
  }
  // reconstruct!
  console.log(...PR('RUNNING EDITABLE TOKEN TESTS'));
  //
  const script_tokens = TRANSPILER.TextToScript(scriptText);
  console.group(
    '%cOriginal Tokens (textified,filtered bracks)',
    'font-size:1.4em',
    script_tokens
  );
  dump_script(script_tokens);
  console.groupEnd();
  //
  const lsos = TRANSPILER.ScriptToEditableTokens(script_tokens);
  console.group('%cEditable Tokens', 'font-size:1.4em', lsos);
  dump_editables(lsos);
  console.groupEnd();
  //
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  const ntext = TRANSPILER.ScriptToText(nscript).trim();
  console.group('%cRepackedTokens (textified)', 'font-size:1.4em', nscript);
  dump_script(nscript);
  console.groupEnd();
  let mismatch = mismatch_text(ntext, scriptText);
  if (mismatch === undefined) {
    console.log(
      '%cSCRIPT MATCHES! HOORAY',
      'font-size:1.5em;color:green;background-color:rgba(80,192,40,0.25);padding:1em'
    );
  } else {
    console.log(
      `%cSCRIPT MATCH FAIL @ CHAR = ${mismatch}`,
      'font-size:1.5em;color:red;background-color:yellow;padding:1em'
    );
  }
  highlight(scriptText, {
    selection: mismatch,
    color: 'blue',
    title: 'original script'
  });

  highlight(ntext, {
    title: 'repacked script',
    selection: mismatch,
    color: 'darkorange'
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** force import */
function ForceImportHack() {}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  TestEditableTokens, // test interface
  ForceImportHack
};
// brute force text API
export {
  TestEditableText, // test interface
  InsertLine,
  DeleteLine,
  UpdateLine
};
