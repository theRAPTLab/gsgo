/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Agent from './class-agent';
import GVar from '../properties/var';
import GAgent from '../properties/var-agent';

/// INTERFACE DECLARATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface SMScopeRef {
  opExec: (name: string, stack: GVar[]) => GVar;
  method: (name: string, ...args: any) => any;
  prop: (name: string) => GVar;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface SMObject {
  method: (name: string, ...args: any) => any;
  prop: (name: string) => SMObject;
}

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SMOpStatus = Promise<any> | void;
export type SMOpExec = (
  agent: Agent,
  stack?: GVar[],
  scope?: SMScopeRef[]
) => SMOpStatus;
export type SMProgram = SMOpExec[];
