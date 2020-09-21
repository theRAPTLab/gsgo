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
export interface I_Scopeable {
  id: number;
  meta: { type: symbol; name?: string };
  method: (name: string, ...args: any) => any;
  addProp: (name: string, gv: I_Scopeable) => I_Scopeable;
  addMethod: (name: String, callable: T_Method) => void;
  props: Map<string, I_Scopeable>;
  prop: (name: string) => I_Scopeable;
  methods: Map<string, T_Method>;
  serialize: () => any[];
  //  get value(): any; // works with typescript 3.6+
  //  set value(val:any); // works with typescript 3.6+
  _value: any;
  get: () => T_Value;
  set: (key: string, value: T_Value) => void;
}
/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of I_Scopeable */
export interface I_Agent extends I_Scopeable {
  features: Map<string, any>;
  updateQueue: I_Message[];
  thinkQueue: I_Message[];
  execQueue: I_Message[];
  queue: (msg: I_Message) => void;
  exec_smc: (prog: T_Program, initStack?: T_Stackable[]) => T_Stackable[];
  feature: (name: string) => any;
  addFeature: (name: string) => void;
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
export type T_Stackable = I_Scopeable | T_Value;
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
  agent: I_Agent, // REQUIRED memory context
  sm_state: I_State // machine state
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
export interface I_State {
  stack: T_Stackable[]; // data stack (pass values in/out)
  scope: I_Scopeable[]; // scope stack (current execution context)
  flags: I_Comparator; // condition flags
  peek(): T_Stackable;
  pop(): T_Stackable;
  popArgs(num: number): T_Stackable[];
  pushArgs(...args: number[]): void;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine condition
 */
export interface I_Comparator {
  VAZ: boolean; // true when zerocheck runs
  VAC: boolean; // true when condition runs
  VAS: boolean; // true for string comparisons
  _Z: boolean; // zero flag
  _LT: boolean; // less-than, same as !(GT&&EQ)
  _EQ: boolean; // equal flag
  reset(): void;
  setZ(s?: boolean): void;
  setLT(s?: boolean): void;
  setGT(s?: boolean): void;
  setEQ(s?: boolean): void;
  status(): object;
  compareNumbers(a: number, b: number): void;
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
/** A stackmachine feature
 */
export interface I_Feature {
  meta: { feature: string };
  methods: Map<string, T_Method>;
  initialize(pm: any): void;
  name(): string;
  decorate(agent: I_Agent): void;
  addProp(agent: I_Agent, key: string, prop: I_Scopeable): void;
  prop(agent: I_Agent, key: string): I_Scopeable;
  method: (agent: I_Agent, key: string, ...args: any) => any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine Message
 */
export interface I_Message {
  id: number;
  channel: string;
  message: string;
  data?: any;
  programs?: T_Program[];
  inputs?: any;
}
