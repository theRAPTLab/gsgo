/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import ScriptTokenizer from 'lib/class-gscript-tokenizer';
import * as TRANSPILER from 'script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TOKENIZE TEST', 'TagDkRed');
const tokenizer = new ScriptTokenizer({ show: true });

/// TOKENIZER TRIALS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The tokenizer accepts lines of text, and then parses each line character-
 *  by-character to produce tokens. The result are a bunch of arrays of
 *  js primitizes that would be fed to TRANSPILER
 */
function TokenizeTest(text) {
  const lines = text.split('\n');
  console.group(...PR('Text Lines (trimmed)'));
  lines.forEach(line => console.log(line.trim()));
  console.groupEnd();
  console.group(...PR('Tokenizing Lines into Nodes'));
  const script = tokenizer.tokenize(lines);
  console.groupEnd();
  console.group(...PR('ScriptUnits Decompiled from Nodes'));
  TRANSPILER.PrintSourceToConsole(script);
  console.groupEnd();
}

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TokenizeTest(
  `
  # BLUEPRINT Bee
  # PROGRAM DEFINE
  useFeature Costume
  useFeature Movement
  addProp foodLevel Number 50
  setProp Costume.pose 10
  featureCall Costume setCostume 'bunny.json' 1
  # PROGRAM UPDATE
  setProp skin 'bunny.json'
  featureCall Movement jitterPos -5 5
  # PROGRAM THINK
  // featureHook Costume thinkHook
  # PROGRAM EVENT
  onEvent Tick [[
    exec {{ agent.prop.foodLevel.sub(1) }}
    propCall foodLevel sub 1
    dbgOut 'foodLevel' {{ agent.prop.foodLevel.value }}
  ]]
  # PROGRAM CONDITION
  when Bee sometest [[
    // dbgOut SingleTest
  ]]
  when Bee sometest Bee [[
    // dbgOut PairTest
  ]]`.trim()
);
