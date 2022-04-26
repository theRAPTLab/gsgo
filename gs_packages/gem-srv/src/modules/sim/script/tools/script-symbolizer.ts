/* eslint-disable @typescript-eslint/dot-notation */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT SYMBOLIZER

  Given a tokenized script, return a TSymbolData object of all symbols
  found within it. It is the responsibility of individual keyword modules
  to implement a `symbolize()` method that returns the data structure; to
  date, only useFeature and addProp need to return symbols that are specific
  to a given script.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TScriptUnit, TSymbolData } from 'lib/t-script.d';
import * as DCENGINE from 'modules/datacore/dc-script-engine';
import * as DCBUNDLER from 'modules/datacore/dc-script-bundle';
import * as TOKENIZER from './class-gscript-tokenizer-v2';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Extracts the symbol data as a separate pass so we don't have to rewrite
 *  the entire compiler and existing keyword code. Note that this does not
 *  recurse into statement blocks, because the only keywords in a statement that
 *  add symbol data are `addProp` and `when` which are always level 0 (not
 *  nested)
 */
function SymbolizeStatement(statement: TScriptUnit, line: number): TSymbolData {
  const [type, value] = TOKENIZER.UnpackToken(statement[0]);
  if (type !== 'identifier')
    return {
      error: { code: 'errParse', info: `err keyword token: [${type},${value}]'` }
    };
  const kw = value;
  if (kw === '') return {}; // blank lines emit no symbol info
  const kwProcessor = DCENGINE.GetKeyword(kw);
  if (!kwProcessor) {
    console.warn(`keyword processor ${kw} bad`);
    return {
      error: { code: 'errExist', info: `missing kwProcessor for: '${kw}'` }
    };
  }
  // ***NOTE***
  // May return empty object, but that just means there are no symbols produced.
  // keywords don't return symbols unless they are adding props or features.
  const symbols = kwProcessor.symbolize(statement, line); // these are new objects
  return symbols;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a blueprint, return the symbolized bundle. This is also stored
 *  in DCBUNDLES
 */
function SymbolizeBlueprint(script: TScriptUnit[]): TSymbolData {
  // placeholder stub
  return {};
}
// add symbol data

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SymbolizeBlueprint };
