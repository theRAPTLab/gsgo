/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ScriptTokenizer from 'lib/class-gscript-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPT TOKENIZER TEST', 'TagDkRed');
const tokenizer = new ScriptTokenizer({ show: true });

/// TOKENIZER TRIALS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The tokenizer accepts lines of text, and then parses each line character-
 *  by-character to produce tokens. The result are a bunch of arrays of
 *  js primitizes that would be fed to TRANSPILER
 */
function TokenizeTest(text) {
  const lines = text.split('\n');
  console.group(...PR('TokenizeTest Lines\n'));
  lines.forEach(line => console.log(line));
  console.groupEnd();
  console.group(...PR('Scanning Lines'));
  const script = tokenizer.tokenize(lines);
  console.groupEnd();
  console.group(...PR('ScriptUnits Found'));
  script.forEach(unit => {
    console.log(unit.join(', '));
  });
  console.groupEnd();
}

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TokenizeTest(
  `
  prop x
  prop Costume.pose setTo 'looser'
  propCall y setTo 1
  {{12+3/agent.pi}}
`.trim()
);
