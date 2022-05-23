/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Experimental Symbol Tokens Refactor

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// SUPPORT CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** wrapper class for a TSymbolData object for convenient creation of a copy
 *  of symbol data
 */
class SymbolToken {
  symbols: TSymbolData;
  /** @constructor
   *  @param {TSymbolData} symbols optional set of symbols that were available
   *  @param {string} info optional tag, useful for adding context for errors
   */
  constructor(symbols?: TSymbolData, unitText?: string) {
    this.symbols = {};
    this.copyUnitText(unitText);
    this.copySymbols(symbols);
  }
  copyUnitText(unitText: string): SymbolToken {
    if (typeof unitText !== 'string') return this;
    if (unitText.length > 0) this.symbols.unitText = unitText;
    return this;
  }
  copySymbols(symbols: TSymbolData): SymbolToken {
    if (typeof symbols !== 'object') return this;
    const symbolKeys = [...Object.keys(symbols)];
    symbolKeys.forEach(key => {
      this.symbols[key] = symbols[key];
    });
    return this;
  }
  setError(err_code: TSymbolErrorCodes, err_info: string): SymbolToken {
    this.symbols.error = {
      code: err_code || 'errOops',
      info: err_info || '<unknown>'
    };
    return this;
  }
  setType(gsType: TSValidType) {
    this.symbols.gsType = gsType;
  }
  setMethodSig(mSig: TSymMethodSig) {
    this.symbols.methodSig = mSig;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return symbol data object */
  symbolData(): TSymbolData {
    return this.symbols;
  }
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** factory method to copy symbol data into a validation token */
function ValidToken(symbols?: TSymbolData, unitText?: string) {
  return new SymbolToken(symbols, unitText);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** factory method to copy symbol data into a validation token
 *  with additional error information
 */
function InvalidToken(
  err_code: TSymbolErrorCodes,
  err_info: string,
  symbols?: TSymbolData,
  unitText?: string
) {
  return new SymbolToken(symbols, unitText).setError(err_code, err_info);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SymbolToken };
export { ValidToken, InvalidToken };
