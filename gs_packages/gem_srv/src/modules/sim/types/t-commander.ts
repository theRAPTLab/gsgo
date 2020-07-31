/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STACKMACHINE TYPE DECLARATIONS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "scopeable" object is one that can represent the current execution
 *  context for ops using method(), prop() or value-related assignments.
 *  The Agent, Prop, and Feature classes implement this interface.
 */
export interface T_Scopeable {
  method: (name: string, ...args: any) => any;
  prop: (name: string) => T_Scopeable;
  serialize: () => string;
  value: any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "stackable" object is one that can be pushed on the data stack.
 */
export type T_Stackable = T_Scopeable | any;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Stackmachine operations return a Promise if it is operating asynchronously
 *  though this may not be necessary. I thought it might be cool
 */
export type T_OpWait = Promise<any> | void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine maintains state in form of a data stack, a scope stack,
 *  and a flags object. This state is passed, along with agent, to every
 *  stackmachine opcode. The opcode is free to mutate the stacks and agent
 */
export class T_State {
  stack: Array<T_Stackable>; // data stack (pass values in/out)
  scope: Array<T_Scopeable>; // scope stack (current execution context)
  flags: {
    Z: boolean; // zero flag
    GT: boolean; // greater than than
    LT: boolean; // less-than, same as !(GT&&EQ)
    EQ: boolean; // equal flag
    TRUE: boolean; // if result of op was "true" after compare
    FALSE: boolean; // inverse of TRUE operation
  };
  constructor() {
    this.stack = [];
    this.scope = [];
    this.flags = {
      Z: false,
      GT: false,
      LT: false,
      EQ: false,
      TRUE: false,
      FALSE: true
    };
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine operation or "opcode" is a function that receives mutable
 *  agent, stack, scope, and condition flag objects. This is how agents
 *  and their props are changed by the scripting engine. The agent is
 *  the memory context, and the stack is used to pass values in/out.
 *  It returns void, but we are also allowing Promise as a return type
 *  in case we want to have asynchronous opcodes.
 */
export type T_Opcode = (
  agent: T_Agent, // REQUIRED memory context
  sm_state: T_State // machine state
) => T_OpWait;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine program is an array of opcodes that are read from the
 *  beginning and executed one-after-the-other. Each function is invoked
 *  with the current data and scope stacks, as well as flags object that
 *  can be updated by conditional opcodes
 */
export type T_Program = T_Opcode[];

/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of T_Scopeable */
export interface T_Agent extends T_Scopeable {
  feature: (name: string) => any;
  name: () => string;
}
