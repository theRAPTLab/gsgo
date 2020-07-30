/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STACKMACHINE TYPE DECLARATIONS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface SM_Object {
  method: (name: string, ...args: any) => any;
  prop: (name: string) => SM_Object;
  value: any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SM_OpStatus = Promise<any> | void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SM_OpExec = (
  agent: Agent,
  stack?: Array<SM_Object>,
  scope?: Array<SM_Object>
) => SM_OpStatus;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SM_Program = SM_OpExec[];

/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface Agent extends SM_Object {
  feature: (name: string) => any;
  name: () => string;
}
