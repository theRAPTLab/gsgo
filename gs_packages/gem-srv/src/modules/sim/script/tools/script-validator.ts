/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT VALIDATOR

  Given a tokenized script, return an array of validation tokens that
  contain (1) valid options for each statement in the script by token position
  and (2) whether provided reference is one of the valid options.

  The validation data uses SymbolData that is inside a blueprint bundle. Each
  keyword is reponsible for providing validation through a method called
  `validate()`; there is a default validator that handles the basic script
  tokenization format: [KEYWORD OBJREF METHOD ARGS ...]


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TScriptUnit, TSymbolRefs } from 'lib/t-script.d';
import * as DCENGINE from 'modules/datacore/dc-script-engine';
import * as TOKENIZER from './class-gscript-tokenizer-v2';
import { VSymError } from './symbol-helpers';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given statement, return the associated validation data structure
 *  consisting of an array of ValidationTokens and a validationLog with
 *  debug information for each token in the array.
 */
function ValidateStatement(statement: TScriptUnit, refs: TSymbolRefs) {
  const { bundle, globals } = refs || {};

  const [type, value] = TOKENIZER.UnpackToken(statement[0]);
  if (type !== 'identifier') {
    return new VSymError('errExist', `err keyword token: [${type},${value}]'`);
  }
  const kw = value;
  if (kw === '') return {}; // blank lines emit no symbol info
  const kwProcessor = DCENGINE.GetKeyword(kw);
  if (kwProcessor === undefined) {
    const keywords = DCENGINE.GetAllKeywords();
    return {
      validationTokens: [
        new VSymError('errExist', `invalid keyword '${kw}'`, { keywords })
      ]
    };
  }
  // DO THE RIGHT THING II: return the Validation Tokens
  kwProcessor.validateInit({ bundle, globals });
  return kwProcessor.validate(statement);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ValidateBlueprint(statement: TScriptUnit, refs: TSymbolRefs) {}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ValidateStatement, ValidateBlueprint };
