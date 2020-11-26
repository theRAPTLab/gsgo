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
  value: any;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IScopeableCtor {
  new (value?: any, ...args: any[]): IScopeable;
}

/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of IScopeable */
export interface IAgent extends IScopeable {
  features: Map<string, any>;
  updateQueue: TMethod[];
  thinkQueue: TMethod[];
  execQueue: TMethod[];
  queueUpdateAction: (action: TMethod) => void;
  queueThinkAction: (action: TMethod) => void;
  queueExecAction: (action: TMethod) => void;
  evaluateArgs: (...args: any) => any;
  exec: (prog: TMethod, ...args) => any;
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
/** a shim for "Registration Code", which runs globally and has a
 *  different function signature than TOpcode
 */
export type TRegcode = (
  agent?: IAgent // OPTIONAL memory context
) => void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine program is an array of opcodes that are read from the
 *  beginning and executed one-after-the-other. Each function is invoked
 *  with the current data and scope stacks, as well as flags object that
 *  can be updated by conditional opcodes
 */
export type TSMCProgram = TOpcode[];
export type TSMCGlobalProgram = TRegcode[];
/** Also could be an AST, which is an object with a type property */
export type TExpressionAST = { type: string };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine method can be either a stackmachine program OR a regular
 *  function. The invocation method will check what it is
 */
export type TMethod = TSMCProgram | Function | TExpressionAST;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** exported by the 'compile' method */
export interface ISMCBundle {
  name?: string; // the determined name of the blueprint
  define?: TSMCProgram; // def template, props, features
  defaults?: TSMCProgram; // set default values
  update?: TSMCProgram; // other runtime init
  // conditions
  conditions?: TRegcode[]; // this might be
  test?: TSMCProgram; // program returning true on stack
  conseq?: TSMCProgram; // program to run on true
  alter?: TSMCProgram; // program to run otherwise
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine maintains state in form of a data stack, a scope stack,
 *  and a flags object. This state is passed, along with agent, to every
 *  stackmachine opcode. The opcode is free to mutate the stacks and agent
 */
export interface IState {
  stack: TStackable[]; // data stack (pass values in/out)
  ctx: {}; // a context object (dependent on caller)
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
  programs?: TSMCProgram[];
  inputs?: any;
}

/// SCRIPT UNIT / SCRIPT DECLARATIONS /////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a source line starts with keyword followed by variable number of args.
 *  an empty TScriptUnit is allowed also.
 */
export type TScriptUnit = [string?, ...any[]];
export type TScript = TScriptUnit[]; // not generally used\
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UI update type sent by UI tp RegenSRCLine */
export interface IScriptUpdate {
  index: number;
  scriptUnit: TScriptUnit;
}
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
  compile(unit: TScriptUnit): TOpcode[];
  serialize(state: object): TScriptUnit;
  jsx(index: number, state: object, children?: any[]): any;
  generateKey(): any;
  getName(): string;
  topValue(thing: any): any;
}
