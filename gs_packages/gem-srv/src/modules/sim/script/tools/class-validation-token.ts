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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** allowed options for enhanced validation token creation */
type VSDOpts = {
  gsType: TGSType;
  symbolScope?: Array<keyof TSymbolData>; // which symbol dicts apply to gui display
  unitText?: string;
  err_code?: TValidationErrorCodes;
  err_info?: string;
};

/// TSYMBOLDATA UTILITY CLASSES ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a wrapper class for symbol data that is associated with a specific
 *  script token in a script statement (TScriptUnit). These are constructed
 *  by the SymbolInterpreter class and returned in a validation token array */
class VSDToken implements TSymbolData {
  // implement a subset of TSymbolData fields
  /** @constructor
   *  @param {TSymbolData} symbols optional set of symbols that were available
   *  @param {string} info optional tag, useful for adding context for errors
   */
  constructor(symbols?: TSymbolData, opt?: VSDOpts) {
    // if we want to remember the original scriptText word
    const { unitText, symbolScope, gsType, err_code, err_info } = opt || {};
    if (unitText) (this as any).unitText = unitText;
    if (Array.isArray(symbolScope)) (this as any).symbolScope = symbolScope;
    if (gsType) (this as any).gsType = gsType;
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
