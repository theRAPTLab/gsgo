/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Agent from '../lib/class-agent';
import SM_Object from '../lib/class-SM_Object';

/// INTERFACE DECLARATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface SMScopeRef {
  opExec: (name: string, stack: SM_Object[]) => SM_Object;
  method: (name: string, ...args: any) => any;
  prop: (name: string) => SM_Object;
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
  stack?: SM_Object[],
  scope?: SMScopeRef[]
) => SMOpStatus;
export type SMProgram = SMOpExec[];
