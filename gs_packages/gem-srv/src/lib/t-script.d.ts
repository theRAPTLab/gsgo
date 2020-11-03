import { TOpcode } from 'lib/t-smc';

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
  compile(parms: any[]): IAgentTemplate;
  serialize(state: object): ScriptUnit;
  render(index: number, state: object, children?: any[]): any;
  generateKey(): any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** exported by the 'compile' method */
export interface IAgentTemplate {
  define?: TOpcode[];
  defaults?: TOpcode[];
  conditions?: TOpcode[];
  init?: TOpcode[];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UI update type sent by UI tp RegenSRCLine */
export type ScriptUpdate = {
  index: number;
  scriptUnit: ScriptUnit;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a source line starts with keyword followed by variable number of args */
export type ScriptUnit = [string, ...any[]];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sent by UI change handler after source is regeneraed through RegenSRCLine()
 */
export type Script = ScriptUnit[];
