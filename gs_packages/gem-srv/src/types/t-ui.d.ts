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
    marker?: VMLineScriptType; // set if this line starts or ends a block
    lineScript?: TScriptUnit; // editable line script
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
    tokenKey: VMTokenKey; // hash key '{lineNum},{linePos}'
    symbols?: TSymbolData; // added by keyword validator
    error?: TSymbolError; // if not present, no error
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a flattened representation of a script:TScriptUnit[], which is a "page
   *  of numbered lines */
  type VMPage = VMPageLine[];
  /** string key designating a particular token in the VMPage */
  type VMTokenKey = `${number},${number}`;
  type VMTokenMap = Map<VMTokenKey, IToken>;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used by VMLineScriptSource in recreating. flattened linescript block data  */
  type VMLineScriptLine = {
    lineScript: TScriptUnit; // master source of lineScript in VMPageLine
    marker?: VMLineScriptType;
  };
  type VMLineScripts = VMLineScriptLine[];
  type VMLineScriptType = 'start' | 'end' | 'end-start';
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returned by Validation Token Processor */
  type VMSlot = {
    gsType: TGSArg;
    viewState: `${'valid'} | ${'empty'} | ${'invalid'}| ${'unexpected'} | ${'vague'}`;
    unitText: string;
    dataSelectKey: number;
  };
}

/// EXPORT AS MODULE FOR GLOBALS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
