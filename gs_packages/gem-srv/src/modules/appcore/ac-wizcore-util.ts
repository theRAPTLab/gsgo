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
const PR = UR.PrefixUtil('WIZ-UTIL', 'TagBlue');

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this is a dependent store, so we do not initialize it with _inializeState()
/// the main WIZCORE will handle that for us, but we just want to hook up
/// our routing here first
const STORE = StateMgr.GetInstance('ScriptWizard');

/// SCRIPT LINE EDITING STUFF ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MUTATE = false;
const LNUM = 4;
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
  if (MUTATE) {
    console.group('%cAPPLY MUTATIONS', 'font-size:1.4em');
    // demo modify the script_page tokens
    lsos.forEach(lso => {
      // replace all energyLevel with BANANACAKE
      console.log('replacing all instances of energyType with bananaType');
      lso.lineScript.forEach(tok => {
        if (tok.identifier && tok.identifier === 'energyType')
          tok.identifier = 'bananaType';
      });
    });
    console.log(`inserting identifiers moooo0, cow, moooo in line ${LNUM}`);
    // insert three identifiers at the start of provided lineNum (default 0)
    lsos[LNUM].lineScript.splice(
      0,
      0,
      { identifier: 'moooooooo' },
      { identifier: 'cow' },
      { identifier: 'mooooooo' }
    );
    console.log(`inserting new comment 'aaaa' at ${LNUM}`);
    // insert a line before lineNum
    lsos.splice(LNUM, 0, {
      lineScript: [{ comment: 'inserted aaaa' }]
    });
    console.log(`replacing line ${LNUM + 5} with comment 'nooo'`);
    // replace line 10
    lsos.splice(10, 1, {
      lineScript: [{ comment: 'overwrote with nooo' }]
    });
    console.groupEnd();
  }
  //
  console.group('%cRepackedTokens (textified)', 'font-size:1.4em');
  console.groupCollapsed('reconstruction log');
  const nscript = TRANSPILER.EditableTokensToScript(lsos);
  console.groupEnd();
  const ntext = TRANSPILER.ScriptToText(nscript).trim();
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

/// DEPENDENCY LOADER /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** dummy export to allow module to load and initialize */
function LoadDependencies(PROMPTER = str => PR(str)) {
  console.log(...PROMPTER('loaded wizcore-util'));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadDependencies,
  TestEditableTokens // test interface
};
