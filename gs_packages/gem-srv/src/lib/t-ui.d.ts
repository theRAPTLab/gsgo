/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  React UI Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TScriptUnit, IToken, TSymbolData, TSymbolError } from './t-script';

/// PROJECT LIST OBJECTS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IbpidListItem {
  id: any;
  label: string;
}

export interface IinspectorListItem {}

/// GUI WIZARD TOKENS AND LINES ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: the VM prefix means 'viewmodel', as these are types that are used
/// for view-specific data
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a line of VMToken, with additional UI-relevant data */
export type VMPageLine = {
  vmTokens: VMToken[]; // the VMTokens in this VMLine (see below)
  lineNum: number; // the line number
  level: number; // the nesting level of this line
  lineScript?: TScriptUnit; // parent statement
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a data packet representing a line of tokens that are a partial statement,
 *  used to render a line-by-line display. A single ScriptUnit may be turned
 *  into several nested lines!
 */
export type VMToken = {
  scriptToken: IToken; // the actual token object e.g. { string:'foo' }
  lineNum: number; // the line that this token is appearing in
  linePos: number; // the position of this token in the line
  tokenKey: string; // hash key '{lineNum},{linePos}'
  symbols?: TSymbolData; // added by keyword validator
  error?: TSymbolError; // if not present, no error
};
