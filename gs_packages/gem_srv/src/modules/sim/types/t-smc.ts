/* eslint-disable max-classes-per-file */
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
  addProp: (name: string, gv: T_Scopeable) => T_Scopeable;
  addMethod: (name: String, callable: T_Method) => void;
  props: Map<string, T_Scopeable>;
  prop: (name: string) => T_Scopeable;
  methods: Map<string, T_Method>;
  serialize: () => any[];
  _value: any;
  get: () => T_Value;
  set: (key: string, value: T_Value) => void;
}
/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of T_Scopeable */
export interface T_Agent extends T_Scopeable {
  features: Map<string, any>;
  events: T_Message[];
  exec_smc: (prog: T_Program, initStack?: T_Stackable[]) => T_Stackable[];
  feature: (name: string) => any;
  addFeature: (name: string) => T_Agent;
  name: () => string;
  x: () => number;
  y: () => number;
  skin: () => string;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Allowed "literal values" on the data stack */
export type T_Value = string | number | boolean;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "stackable" object is one that can be pushed on the data stack. */
export type T_Stackable = T_Scopeable | T_Value;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Stackmachine operations return a Promise if it is operating asynchronously
 *  though this may not be necessary. I thought it might be cool
 */
export type T_OpWait = Promise<any> | void;
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
/** A stackmachine method can be either a stackmachine program OR a regular
 *  function. The invocation method will check what it is
 */
export type T_Method = T_Program | Function;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine program is an array of opcodes that are read from the
 *  beginning and executed one-after-the-other. Each function is invoked
 *  with the current data and scope stacks, as well as flags object that
 *  can be updated by conditional opcodes
 */
export type T_Program = T_Opcode[];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine maintains state in form of a data stack, a scope stack,
 *  and a flags object. This state is passed, along with agent, to every
 *  stackmachine opcode. The opcode is free to mutate the stacks and agent
 */
export interface T_State {
  stack: T_Stackable[]; // data stack (pass values in/out)
  scope: T_Scopeable[]; // scope stack (current execution context)
  flags: T_Condition; // condition flags
  peek(): T_Stackable;
  pop(): T_Stackable;
  popArgs(num: number): T_Stackable[];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine condition
 */
export interface T_Condition {
  VAZ: boolean; // true when zerocheck runs
  VAC: boolean; // true when condition runs
  VAS: boolean; // true for string comparisons
  _Z: boolean; // zero flag
  _LT: boolean; // less-than, same as !(GT&&EQ)
  _EQ: boolean; // equal flag
  reset(): void;
  status(): string;
  compareNumbers(a: number, b: number);
  LT(): boolean;
  LTE(): boolean;
  GTE(): boolean;
  GT(): boolean;
  EQ(): boolean;
  NEQ(): boolean;
  compareStrings(s1: string, s2: string): void;
  STR_EQ(): boolean;
  STR_NEQ(): boolean;
  checkZero(value: number): void;
  Z(): boolean;
  NZ(): boolean;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine message
 */
export interface T_Message {
  id: number;
  channel: string;
  message: string;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine feature
 */
export interface T_Feature {
  meta: { feature: string };
  methods: Map<string, T_Method>;
  initialize(pm: any): void;
  name(): string;
  decorate(agent: T_Agent): void;
  addProp(agent: T_Agent, key: string, prop: T_Scopeable): void;
  method: (agent: T_Agent, key: string, ...args: any) => any;
}
