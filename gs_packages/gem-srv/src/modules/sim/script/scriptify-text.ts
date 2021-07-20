/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert text to Script Units Tokens. It does not test the validity of then
  produced tokens.



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import GScriptTokenizer from 'lib/class-gscript-tokenizer2';

const scriptifier = new GScriptTokenizer();

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
// REVIEW: This is current duplicated in class-keyword
//         Should this be moved there?
export function ScriptifyText(text: string): TScriptUnit[] {
  if (text === undefined) return [];
  const sourceStrings = text.split('\n');
  const script = scriptifier.tokenize(sourceStrings);
  return script;
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const text = `
when A touches B [[
  if A.prop gt 0 [[
    // nested block
    X1 X2
    Y1 Y2 Y3
  ]]
]]
`;
UR.HookPhase('UR/APP_RUN', () => {
  const script = ScriptifyText(text);
  console.log(script);
});
