/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Validation/Symbol Data tokens contain information about the "correctness"
  of a corresponding scriptToken in a TScriptUnit statement.

  EXAMPLE TRANSFORMATION

  text:   prop Fish.energyLevel setTo 10
  unit:   [{ identifier:prop }, { objref:['Fish','energyLevel'] },
          { method:'setTo' }, { number:10 }]
  vsds:   [{ keywordSymbols }, { bundleSymbols }, { methodSymbols },
          { methodArgSymbols }]

  In addition to symbols, a VSDToken will also contain the `error` property
  if there was a failure to reconcile the token with the expected symbol
  dictionary. For convenience, the `unitText` and `gsType` properties are
  always returned as well.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { UnpackArg } from 'modules/datacore/dc-sim-data-utils';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// TSYMBOLDATA UTILITY CLASSES ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a wrapper class for symbol data. These are constructed
 *  by the SymbolInterpreter class and returned in a validation token array.
 *  It essentially combines all the 'loose' symbol keys of a SymbolData object
 *  into a 'symbols' property so it can be more easily used by consumers
 */
class VSDToken implements TSymbolData {
  //
  constructor(symbols?: TSymbolData, opt?: TSymbolMeta) {
    // if we want to remember the original scriptText word
    const { unitText, symbolScope, gsArg, err_code, err_info } = opt || {};
    const [gsName, gsType] = UnpackArg(gsArg);
    // console.log('unpacking', unitText, `${gsName}:${gsType}`);
    if (unitText !== undefined) (this as any).unitText = unitText; // unitText can be empty string
    if (Array.isArray(symbolScope)) (this as any).symbolScope = symbolScope;
    if (gsType) (this as any).gsType = gsType;
    if (gsName) (this as any).gsName = gsName;
    if (err_code || err_info) {
      (this as any).error = {
        code: err_code,
        info: err_info
      };
    }
    // add symbol data
    if (symbols) {
      const symbolKeys = [...Object.keys(symbols)];
      symbolKeys.forEach(key => {
        this[key] = symbols[key];
      });
    }
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default VSDToken;
