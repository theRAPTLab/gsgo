/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// BASE SIMULATION OBJECTS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "scopeable" object is one that can represent the current execution
 *  context for ops using getMethod(), getProp() or value-related assignments.
 *  The Agent, Prop, and Feature classes implement this interface.
 */
export interface IScopeable {
  id: any;
  refId?: any;
  meta: { type: symbol; name?: string };
  prop: IKeyObject;
  method: IKeyObject;
  addProp: (name: string, gv: IScopeable) => IScopeable;
  getProp: (name: string) => IScopeable;
  addMethod: (name: String, callable: TMethod) => void;
  getMethod: (name: string) => TMethod;
  serialize: () => any[];
  //  get value(): any; // works with typescript 3.6+
  //  set value(val:any); // works with typescript 3.6+
  value: any;
  name: string;
}

/// AGENT TYPE DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Agents have additional properties on top of IScopeable */
export interface IAgent extends IScopeable, IActable, IMovementMode {
  blueprint: any;
  featureMap: Map<string, IFeature>;
  execMethod: (name: string, ...args: any) => any;
  addFeature: (name: string) => void;
  hasFeature: (name: string) => boolean;
  getFeature: (name: string) => any;
  updateQueue: TMethod[];
  queueUpdateMessage: (msg: IMessage) => void;
  thinkQueue: TMethod[];
  queueThinkMessage: (msg: IMessage) => void;
  execQueue: TMethod[];
  queueExecMessage: (msg: IMessage) => void;
  evaluateArgs: (...args: any) => any;
  exec: (prog: TMethod, ctx?: object, ...args) => any;
  getFeatMethod: (fname: string, mName: string) => [IFeature, TMethod];
  callFeatMethod: (fName: string, mName: string, ...args) => any;
  getFeatProp: (fName: string, pName: string) => IScopeable;
  // shortcut properties
  skin: string;
  scale: number;
  scaleY: number;
  alpha: number;
  isInert: boolean;
  isGlowing: boolean;
  isLargeGraphic: boolean;
  statusText: string;
  statusValue: number;
  x: number;
  y: number;
  // feature helpers
  canSee: any; // used by Vision
  cursor: IAgent; // used by Movement
  distanceTo: any; // used by Movement
  touchTable: Map<any, any>; // used by feat-touches to keep track of other agents
  lastTouched: any; // used by Touches
  isTouching: any; // used by Touches
  // name, value are defined in IScopeable
}

/// FEATURE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Features are very similar to IScopeable interface in method
 */
export interface IFeature {
  meta: { feature: string };
  method: IKeyObject;
  initialize(pm: any): void;
  decorate(agent: IAgent): void;
  featAddProp(agent: IAgent, key: string, prop: IScopeable): void;
  featAddMethod(mName: string, smc_or_f: FeatureMethod): void;
  featGetMethod(mName: string): FeatureMethod;
}
export type FeatureMethod = (agent: IAgent, ...any) => any;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Weird Typescript syntax for declaring a Constructor of a IScopeable,
 *  when these are passed to a class that manages instances of other classes
 */
export interface IScopeableCtor {
  new (value?: any, ...args: any[]): IScopeable;
}
/** Declare an object with keys. If you use just object, typescript will complain
 *  every time you add an undeclared property name
 */
export interface IKeyObject {
  [key: string]: any;
}

/// SIMULATION RUNTIME ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine Message, which consists of a message and an SMCProgram.
 */
export interface IMessage {
  id?: number;
  channel?: string;
  message?: string;
  context?: {}; // context object for expressions, programs
  actions?: TMethod[];
  conseq?: TMethod;
  inputs?: any;
}

/// INTERMEDIATE SCRIPT REPRESENTATION ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Our "script" format is a serializeable format that can be converted to
 *  either compiled output (a TSMCProgram stored in a TSMCBundle) or to
 *  renderable JSX for a UI.
 */
export interface IArgToken {
  // special types
  expr?: string; // gobbleExpression()
  program?: string; // gobbleBlock()
  block?: string[]; // gobbleBlock(), gobbleMultiBlock()
  objref?: string[]; // gobbleParts()
}
export interface IToken extends IArgToken {
  token?: string; // gobbleParts() - why does this exist?
  identifier?: string; // gobbleIdentifier()
  string?: string; // gobbleStringLiteral()
  value?: number; // gobbleNumericLiteral()
  // meta
  directive?: string; // gobbleDirective()
  comment?: string; // gobbleComment()
}
export type TScriptUnit = [...IToken[]]; // variable length array of token objs
export type TArg = number | string | IArgToken;
export type TArguments = [...TArg[]];
export type TScript = TScriptUnit[]; // We use TScriptUnit[] in cod

/// COMPILER OUPUT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** These are the kind of programs  */
export interface ISMCPrograms {
  // blueprint
  define?: TSMCProgram; // def blueprint, props, features
  init?: TSMCProgram; // allocate mem/define default values for instance
  update?: TSMCProgram; // run during instance update cycle
  think?: TSMCProgram; // run during instance think phase
  exec?: TSMCProgram; // run during instance exec phase
  // global conditions
  condition?: TSMCProgram; // condition handlers to run
  // global script events
  event?: TSMCProgram; // event handlers to run
  // local condition (one per bundle)
  test?: TSMCProgram; // program returning true on stack
  conseq?: TSMCProgram; // program to run on true
  alter?: TSMCProgram; // program to run otherwise
}
/** An ISMCBundle is a dictionary of TSCMPrograms. See also dc-script-bundle for
 *  the BUNDLE_OUTS definition, which maps the bundle props to a particular
 *  runtime context (e.g. BLUEPRINT) A TSMCProgram is just TOpcode[] A
 *  TSMCGlobalProgram is just TRegcode[]
 */
export interface ISMCBundle extends ISMCPrograms {
  name?: string; // the blueprint name of the bundle, if any
  parent?: string; // the parent bundle, if any
  type?: EBundleType; // enum type (see below)
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** defines the kinds of bundles */
export enum EBundleType {
  INIT = 'init', // freshly created or empty bundle (set to another type)
  PROG = 'program', // a program type
  COND = 'condition', // test, conseq, alter program,
  BLUEPRINT = 'blueprint', // blueprint for initializing agents
  G_PROG = 'gprogram', // named program to store in global
  G_COND = 'gcondition', // named global state based on condition
  G_TEST = 'gtest' // named global test returning true or false
}

/// SCRIPT UNIT TRANSPILER ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** related keyword interface  */
export interface IKeyword {
  keyword: string;
  args: string[];
  compile(unit: TScriptUnit): TOpcode[];
  serialize(state: object): TScriptUnit;
  jsx(index: number, state: object, children?: any[]): any;
  getName(): string;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** weird Typescript constructor definition used by Transpiler
 *  see fettblog.eu/typescript-interface-constructor-pattern/
 */
export interface IKeywordCtor {
  new (keyword?: string): IKeyword;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A payload received from a Wizard UI component that has the reconstructed
 *  ScriptUnit
 */
export interface IScriptUpdate {
  index: number;
  scriptUnit: TScriptUnit;
}

/// AGENT INSTANCING //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type TInstance = {
  blueprint: string;
  id?: string;
  name?: string;
  initScript?: TScriptUnit[];
};
export type TInstanceMap = Map<string, TInstance[]>; // string is blueprint name

/// STACKMACHINE TYPE DECLARATIONS ////////////////////////////////////////////
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
  pop(num: number): TStackable[]; // return n things as array
  push(...args: any): void;
  reset(): void;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A "stackable" object is one that can be pushed on the data stack in the
 *  stack machine.
 */
export type TStackable = IScopeable | TValue;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Allowed "literal values" on the data stack */
export type TValue = string | number | boolean;
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
/** A stackmachine operation or "opcode" is a function that receives mutable
 *  agent, stack, scope, and condition flag objects. This is how agents
 *  and their props are changed by the scripting engine. The agent is
 *  the memory context, and the stack is used to pass values in/out.
 *  It returns void, but we are also allowing Promise as a return type
 *  in case we want to have asynchronous opcodes.
 */
export type TOpcode = (
  agent?: IAgent, // memory context (an agent instance)
  sm_state?: IState // machine state
) => TOpWait;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Stackmachine operations return a Promise if it is operating asynchronously
 *  though this may not be necessary. I thought it might be cool
 */
export type TOpWait = Promise<any> | void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a shim for "Registration Code", which runs globally and has a
 *  different function signature than TOpcode. Used for code that runs outside
 *  of an instanced Agent.
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
export type TSMCFunction = TOpcode;
/** Also could be an AST, which is an object with a type property */
export type TExpressionAST = { expr: object }; // expr is binary tre

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stackmachine method can be either a stackmachine program OR a regular
 *  function. The invocation method will check what it is
 */
export type TMethod = TSMCProgram | TSMCFunction | TExpressionAST;

/// INTERACTION TYPE DECLARATIONS /////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export enum ControlMode {
  static = 0,
  drag, // temporarily override control by system, e.g. during drag
  puppet, // someone (not system) is controlling it
  auto // AI
}

export interface IActable {
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isCaptive: boolean;
  setSelected: (mode: boolean) => boolean;
  setHovered: (mode: boolean) => boolean;
  setGrouped: (mode: boolean) => boolean;
  setCaptive: (mode: boolean) => boolean;
}

/// AGENT MOVEMENT MODES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IMovementMode {
  mode: () => ControlMode;
  setPreviousMode: () => ControlMode;
  setModeStatic: () => ControlMode;
  setModeDrag: () => ControlMode;
  setModePuppet: () => ControlMode;
  setModeAuto: () => ControlMode;
  isModeStatic: () => boolean;
  isModeDrag: () => boolean;
  isModePuppet: () => boolean;
  isModeAuto: () => boolean;
}
