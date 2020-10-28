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
export interface IScopeable {
  id: number;
  refId?: number;
  meta: { type: symbol; name?: string };
  method: (name: string, ...args: any) => any;
  addProp: (name: string, gv: IScopeable) => IScopeable;
  addMethod: (name: String, callable: TMethod) => void;
  props: Map<string, IScopeable>;
  prop: (name: string) => IScopeable;
  methods: Map<string, TMethod>;
  serialize: () => any[];
  //  get value(): any; // works with typescript 3.6+
  //  set value(val:any); // works with typescript 3.6+
  _value: any;
  get: () => TValue;
  set: (key: string, value: TValue) => void;
}
/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of IScopeable */
export interface IAgent extends IScopeable {
  features: Map<string, any>;
  updateQueue: IMessage[];
  thinkQueue: IMessage[];
  execQueue: IMessage[];
  queue: (msg: IMessage) => void;
  exec_smc: (prog: TProgram, initStack?: TStackable[]) => TStackable[];
  feature: (name: string) => any;
  addFeature: (name: string) => void;
  name: () => string;
  x: () => number;
  y: () => number;
  skin: () => string;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Allowed "literal values" on the data stack */
export type TValue = string | number | boolean;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "stackable" object is one that can be pushed on the data stack. */
export type TStackable = IScopeable | TValue;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Stackmachine operations return a Promise if it is operating asynchronously
 *  though this may not be necessary. I thought it might be cool
 */
export type TOpWait = Promise<any> | void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine operation or "opcode" is a function that receives mutable
 *  agent, stack, scope, and condition flag objects. This is how agents
 *  and their props are changed by the scripting engine. The agent is
 *  the memory context, and the stack is used to pass values in/out.
 *  It returns void, but we are also allowing Promise as a return type
 *  in case we want to have asynchronous opcodes.
 */
export type TOpcode = (
  agent: IAgent, // REQUIRED memory context
  sm_state: IState // machine state
) => TOpWait;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine method can be either a stackmachine program OR a regular
 *  function. The invocation method will check what it is
 */
export type TMethod = TProgram | Function;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine program is an array of opcodes that are read from the
 *  beginning and executed one-after-the-other. Each function is invoked
 *  with the current data and scope stacks, as well as flags object that
 *  can be updated by conditional opcodes
 */
export type TProgram = TOpcode[];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine maintains state in form of a data stack, a scope stack,
 *  and a flags object. This state is passed, along with agent, to every
 *  stackmachine opcode. The opcode is free to mutate the stacks and agent
 */
export interface IState {
  stack: TStackable[]; // data stack (pass values in/out)
  scope: IScopeable[]; // scope stack (current execution context)
  flags: IComparator; // condition flags
  peek(): TStackable;
  pop(): TStackable;
  popArgs(num: number): TStackable[];
  pushArgs(...args: number[]): void;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine condition
 */
export interface IComparator {
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
export interface IFeature {
  meta: { feature: string };
  methods: Map<string, TMethod>;
  initialize(pm: any): void;
  name(): string;
  decorate(agent: IAgent): void;
  addProp(agent: IAgent, key: string, prop: IScopeable): void;
  prop(agent: IAgent, key: string): IScopeable;
  method: (agent: IAgent, key: string, ...args: any) => any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine Message
 */
export interface IMessage {
  id: number;
  channel: string;
  message: string;
  data?: any;
  programs?: TProgram[];
  inputs?: any;
}
