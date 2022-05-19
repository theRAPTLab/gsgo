/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  React UI Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

declare global {
  /// GUI WIZARD TOKENS AND LINES /////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// NOTE: the VM prefix means 'viewmodel', as these are types that are used
  /// for view-specific data
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a line of VMToken, with additional UI-relevant data */
  type VMPageLine = {
    vmTokens: VMToken[]; // the VMTokens in this VMLine (see below)
    lineNum: number; // the line number
    level: number; // the nesting level of this line
    lineScript?: TScriptUnit; // parent statement
    globalRefs?: { bundles?: TNameSet }; // set of globals to look-up (currently just blueprints)
    domRef?: { current: any }; // React DOM reference in current
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a data packet representing a line of tokens that are a partial statement,
   *  used to render a line-by-line display. A single ScriptUnit may be turned
   *  into several nested lines!
   */
  type VMToken = {
    scriptToken: IToken; // the actual token object e.g. { string:'foo' }
    lineNum: number; // the line that this token is appearing in
    linePos: number; // the position of this token in the line
    tokenKey: string; // hash key '{lineNum},{linePos}'
    symbols?: TSymbolData; // added by keyword validator
    error?: TSymbolError; // if not present, no error
  };
}

/// EXPORT AS MODULE FOR GLOBALS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
