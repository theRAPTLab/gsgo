import { TOpcode, TProgram } from 'lib/t-smc';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** constructor interface
 *  see fettblog.eu/typescript-interface-constructor-pattern/
 */
export interface IKeywordCtor {
  new (keyword?: string): IKeyword;
}
/** related keyword interface  */
export interface IKeyword {
  keyword: string;
  args: string[];
  compile(parms: any[]): ISMCBundle;
  serialize(state: object): ScriptUnit;
  render(index: number, state: object, children?: any[]): any;
  generateKey(): any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** exported by the 'compile' method */
export interface ISMCBundle {
  name?: string; // the determined name of the blueprint
  define?: TProgram; // def template, props, features
  defaults?: TProgram; // set default values
  conditions?: TProgram; // register conditions
  update?: TProgram; // other runtime init
  // conditions
  test?: TProgram; // program returning true on stack
  consequent?: TProgram; // program to run on true
  alternate?: TProgram; // program to run otherwise
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UI update type sent by UI tp RegenSRCLine */
export type TScriptUpdate = {
  index: number;
  scriptUnit: ScriptUnit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a source line starts with keyword followed by variable number of args.
 *  an empty ScriptUnit is allowed also.
 */
export type ScriptUnit = [string?, ...any[]];
export type TSource = ScriptUnit[]; // not generally used
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
