/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

  look for CODE REVIEW: tags here to see what needs to be cleaned up
  for a second revision of the script engine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

declare global {
  /// BASE SIMULATION OBJECTS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A "scopeable" object is one that can represent the current execution
   *  context for ops using getMethod(), getProp() or value-related assignments.
   *  The Agent, Prop, and Feature classes implement this interface.
   */
  interface IScopeable {
    id: any;
    refId?: any;
    meta: { type: symbol; name?: string };
    prop: IKeyObject;
    method: IKeyObject;
    addProp: (name: string, gv: IScopeable) => IScopeable;
    getProp: (name: string) => IScopeable;
    addMethod: (name: String, callable: TMethod) => void;
    getMethod: (name: string) => TMethod;
    serialize?: () => any[];
    symbolize?: () => TSymbolData;
    //  get value(): any; // works with typescript 3.6+
    //  set value(val:any); // works with typescript 3.6+
    value: any;
    name: string;
  }

  /// AGENT TYPE DECLARATIONS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Agents have additional properties on top of IScopeable */
  interface IAgent extends IScopeable, IActable, IMovementMode {
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

    // these are the ONLY built-in agent properties
    skin: string; // logical 'appearance' descriptor
    x: number; // x location in simulator world
    y: number; // y location in simulator world

    // CODE REVIEW: @Ben hacking in these values into base agent, which is a
    // *SIMULATION-ONLY OBJECT*, make it difficult to keep the simulation module
    // independent from the world renderer. They are also a jumble of
    // instrumentation, display modifiers, and interactive concepts. There are
    // system concepts already defined in the "INTERACTION TYPE DECLARATIONS"
    // below. The general idea is that logical properties are converted into the
    // observable versions in the IVisual interface (see t-visual.d.ts) For
    // example: a 'selected' logical property might turn on SEVERAL visual
    // properties like "outline", "tint", and so on. This approach helps prevent
    // issues with effects overiding each other with fragile display hacks

    // shortcut properties
    scale: number;
    scaleY: number;
    alpha: number;
    isInert: boolean;
    isGlowing: boolean;
    isLargeGraphic: boolean;
    statusText: string;
    statusValue: number;

    // CODE REVIEW: @Ben these should be not hacked into the base agent. You can
    // instead the features themselves, using a private property within the
    // agent.props[featurename] dictionary

    // feature helpers
    canSeeCone: any; // used by Vision
    canSeeColor: any; // used by Vision
    cursor: IAgent; // used by Movement
    distanceTo: any; // used by Movement
    touchTable: Map<any, any>; // used by feat-touches to keep track of other agents
    lastTouched: any; // used by Touches
    isTouching: any; // used by Touches
    statusObject: any;
    debug?: any; // used by Vision to pass polygon path of cone to class-visual
  }

  /// FEATURE DECLARATIONS ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Features are very similar to IScopeable interface in method
   */
  interface IFeature {
    meta: { name: string };
    get name(): string;
    method: IKeyObject;
    initialize(pm: any): void;
    decorate(agent: IAgent): void;
    featAddProp(agent: IAgent, key: string, prop: IScopeable): void;
    featAddMethod(mName: string, smc_or_f: FeatureMethod): void;
    featGetMethod(mName: string): FeatureMethod;
    symbolize(): TSymbolData;
  }
  type FeatureMethod = (agent: IAgent, ...any) => any;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Weird Typescript syntax for declaring a Constructor of a IScopeable,
   *  when these are passed to a class that manages instances of other classes
   */
  interface IScopeableCtor {
    new (value?: any, ...args: any[]): IScopeable;
    Symbols?: TSymbolData;
  }
  /** Declare an object with keys. If you use just object, typescript will complain
   *  every time you add an undeclared property name
   */
  interface IKeyObject {
    [key: string]: any;
  }

  /// SIMULATION RUNTIME //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine Message, which consists of a message and an SMCProgram.
   */
  interface IMessage {
    id?: number;
    channel?: string;
    message?: string;
    context?: {}; // context object for expressions, programs
    actions?: TMethod[];
    conseq?: TMethod;
    inputs?: any;
  }

  /// INTERMEDIATE SCRIPT REPRESENTATION //////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Our "script" format is a serializeable format that can be converted to
   *  either compiled output (a TSMCProgram stored in a TSMCBundle) or to
   *  renderable JSX for a UI.
   */
  interface IToken {
    // special types
    expr?: string; // gobbleExpression()
    program?: string; // gobbleBlock()
    block?: TScriptUnit[]; // gobbleMultiBlock()
    objref?: string[]; // gobbleParts()
    // standard types
    identifier?: string; // gobbleIdentifier()
    string?: string; // gobbleStringLiteral()
    value?: number; // gobbleNumericLiteral()
    // meta
    directive?: string; // gobbleDirective()
    comment?: string; // gobbleComment()
    line?: string; // as-is line insertion
  }
  type TScriptUnit = IToken[]; // tokens from script-parser
  /*  @SRI: this conflation of args and tokens continues to bite us in the ass
      perhaps instead of having a DecodeStatement method, we push the decoding
      down to use const [value,type] = UnpackToken(tok) in the compiler
      statements themselves */
  type TKWArg = number | string | IToken; // "decoded" tokens
  type TKWArguments = TKWArg[]; // decoded tokens provided to compile functions
  type TScript = TScriptUnit[]; // We use TScriptUnit[] in code
  type TCompiledStatement = (TOpcode | TOpcodeErr)[];
  type TUnpackedToken = [type: string, value: any];

  /// COMPILER OUPUT //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** These are the kind of programs  */
  interface ISMCPrograms {
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

  /// SYMBOL DATA AND TYPES ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // symbol type declarations
  type TSLit = `${'boolean' | 'string' | 'number' | 'enum'}`;
  type TSSMObj = `${'prop' | 'method' | 'gvar' | 'block'}`;
  type TSDeferred = `${'objref' | 'expr' | '{value}'}`;
  type TSDict = `${'keyword' | 'pragma' | 'test' | 'program' | 'event'}`;
  type TSAgent = `${'blueprint' | 'feature'}`;
  type TSMultiArg = `${'{...}'}`; // multiple arg token marker
  type TSList = `${'{list}'}`; // forbidden type!!! don't use!!!
  type TSUnknown = `${'{?}'}`; // forbidden type!!! don't use!!!
  type TGSType = `${
    | TSLit
    | TSSMObj
    | TSDeferred
    | TSDict
    | TSAgent
    | TSMultiArg
    | TSList
    | TSUnknown}`;
  type TSEnum = { enum: string[] }; // special format for enum args (future)
  type TGSArg = `${string}:${TGSType}` | TSEnum;
  type TGSMethodSig = {
    name?: string;
    args?: TGSArg[];
    returns?: TGSArg;
    info?: string;
  };
  type TNameSet = Set<string>;
  type TSymUnpackedArg = [name: string, type: TGSType];

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** describes the type of error that occurred during parsing so it can be
   *  rendered in the GUI */
  /// `valid | empty | error | unexpected | vague`
  type TValidationErrorCodes =
    | 'debug' // a debug placeholder
    | 'invalid' // token incorrect type, or invalid value
    | 'empty' // missing token
    | 'extra' // extra token
    | 'vague'; // indeterminate token need

  /// MAIN SYMBOL DATA DECLARATION ////////////////////////////////////////////
  /** data description of symbols for features, props. returned from anything
   *  that produces Symbol data: keywords with .symbolize(unit), gvars and feat
   *  modules that implement a static .Symbols definition
   *
   *  WARNING: this is a 'by reference' dictionary of dictionaries, so modifying
   *  a TSymbolData object property could corrupt multiple dictionaries! Consider
   *  them read-only.
   */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  type TSymbolData = {
    // read-only dictionaries
    keywords?: string[]; // a list of valid keywords for position 0
    ctors?: { [ctorName: string]: TSymbolData }; // constructor object if needed (used by var- props)
    blueprints?: { [bpName: string]: TSymbolData }; // blueprints
    props?: { [propName: string]: TSymbolData };
    methods?: { [methodName: string]: TGSMethodSig };
    features?: { [featureName: string]: TSymbolData };
    context?: { [line: number]: any }; // line number for a root statement
    methodSig?: TGSMethodSig; // arg choices
    arg?: TGSArg; // arg definition string 'name:type'
    // ok to change or add, as these are not defined in the reference dictionaries
    error?: TSymbolError; // debugging if error
    unitText?: string; // the scriptText word associated with symbol
    gsType?: TGSType; // the gemscript meaning of this token
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** TSymbolViewData is the "GUI-friendly" data structure derived from
   *  a TSymbolData ditionary. This is what's used to draw a GUI
   */
  type TSymbolViewData = {
    keywords?: { items: string[]; info: string };
    features?: { items: string[]; info: string };
    props?: { items: string[]; info: string };
    methods?: { items: string[]; info: string };
    // in the case of arg, items arrau begins with argname, followed by argtype
    arg?: { items: [name: string, type: string]; info: string };
    //
    error?: { info: string };
    unitText?: string; // the scriptText word associated with symbol
    gsType?: string; // the gemscript meaning of this token
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** blueprint symbol data format */
  type TBundleSymbols = {
    props?: { [propName: string]: TSymbolData }; // map to varctor.symbols
    features?: { [featName: string]: TSymbolData }; // map to feature.Symbols
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a data structure used to iterate through a scriptunit token.
   *  it is updated and modified as a particular token is evaluated
   *  in dtoks from left-to-right up to the index
   */
  type TSymbolRefs = {
    bundle: ISMCBundle; // blueprint bundle to use
    globals: { [any: string]: any }; // global object context for expressions, blocks
    symbols?: TSymbolData; // current scope
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used by keyword validator function , used for individual token validation
   *  by symbol utilities!
   */
  type TSymbolError = {
    code: TValidationErrorCodes;
    info: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** keyword.validate() returns an array of TSymbolData that
   *  the error state returns code and desc if a parse issue is detected
   *  if symbol information can be inferred despite an error, it will be
   *  returned otherwise it is void.
   */
  type TValidatedScriptUnit = {
    validationTokens: TSymbolData[];
    validationLog?: string[];
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** tag types used by ben's extensions */
  type TBundleTags = Map<string, any>;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** store directives in the bundle as raw scriptunits*/
  type TBundleDirectives = Map<string, IToken[]>;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** datatype returned by ExtractBlueprintMeta() */
  type TBlueprintMeta = {
    BLUEPRINT: [bpName: string, bpBase: string];
    PROGRAMS: { [programType: string]: true };
    TAGS: { [tagName: string]: any };
  };

  /// PROGRAM BUNDLES /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** An ISMCBundle is a collection of compiled elements. This is the minimum
   *  metadata; see class-sm-bundle for the list of possible entities
   */
  interface ISMCBundle extends ISMCPrograms {
    name?: string; // the blueprint name of the bundle, if any
    parent?: string; // the parent bundle, if any
    type?: EBundleType; // enum type (see below)
    script?: TScriptUnit[]; // saved script
    text?: string; // saved text
    symbols?: TBundleSymbols;
    tags?: TBundleTags; // ben's hack for 'character controlable' blueprints
    directives?: TBundleDirectives;
  }

  /// SCRIPT UNIT TRANSPILER //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** related keyword interface  */
  interface IKeyword {
    keyword: string;
    args: TGSArg[] | TGSArg[][]; // multiple signatures
    compile(unit: TScriptUnit, lineIdx?: number): (TOpcode | TOpcodeErr)[];
    jsx(index: number, unit: TScriptUnit, jsxOpt?: {}): any[] /* deprecated */;
    symbolize(unit: TScriptUnit, lineIdx?: number): TSymbolData;
    validateInit(refs: TSymbolRefs): void;
    validate(unit: TScriptUnit): TValidatedScriptUnit;
    getName(): string;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** weird Typescript constructor definition used by Transpiler
   *  see fettblog.eu/typescript-interface-constructor-pattern/
   */
  interface IKeywordCtor {
    new (keyword?: string): IKeyword;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A payload received from a Wizard UI component that has the reconstructed
   *  ScriptUnit
   */
  interface IScriptUpdate {
    index: number;
    scriptUnit: TScriptUnit;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** function signatures for 'dereferencing' function in keyword compilers */
  type DerefMethod = (agent: IAgent, context: object) => IScopeable;

  /// STACKMACHINE TYPE DECLARATIONS //////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine maintains state in form of a data stack, a scope stack,
   *  and a flags object. This state is passed, along with agent, to every
   *  stackmachine opcode. The opcode is free to mutate the stacks and agent
   */
  interface IState {
    stack: TStackable[]; // data stack (pass values in/out)
    ctx: {}; // a context object (dependent on caller)
    flags: IComparator; // condition flags
    peek(): TStackable;
    pop(num?: number): TStackable[]; // return n things as array
    push(...args: any): void;
    reset(): void;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A "stackable" object is one that can be pushed on the data stack in the
   *  stack machine.
   */
  type TStackable = IScopeable | TValue;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Allowed "literal values" on the data stack */
  type TValue = string | number | boolean;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine condition
   */
  interface IComparator {
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine operation or "opcode" is a function that receives mutable
   *  agent, stack, scope, and condition flag objects. This is how agents
   *  and their props are changed by the scripting engine. The agent is
   *  the memory context, and the stack is used to pass values in/out.
   *  It returns void, but we are also allowing Promise as a return type
   *  in case we want to have asynchronous opcodes.
   */
  type TOpcode = (
    agent?: IAgent, // memory context (an agent instance)
    sm_state?: IState // machine state
  ) => TOpWait;
  type TOpcodeErr = [error: string, line: number];

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Stackmachine operations return a Promise if it is operating asynchronously
   *  though this may not be necessary. I thought it might be cool
   */
  type TOpWait = Promise<any> | void;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a shim for "Registration Code", which runs globally and has a
   *  different function signature than TOpcode. Used for code that runs outside
   *  of an instanced Agent.
   */
  type TRegcode = (
    agent?: IAgent // OPTIONAL memory context
  ) => void;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine program is an array of opcodes that are read from the
   *  beginning and executed one-after-the-other. Each function is invoked
   *  with the current data and scope stacks, as well as flags object that
   *  can be updated by conditional opcodes
   */
  type TSMCProgram = TOpcode[];
  type TSMCGlobalProgram = TRegcode[];
  type TSMCFunction = TOpcode;
  /** Also could be an AST, which is an object with a type property */
  type TExpressionAST = { expr: object }; // expr is binary tre

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine method can be either a stackmachine program OR a regular
   *  function. The invocation method will check what it is
   */
  type TMethod = TSMCProgram | TSMCFunction | TExpressionAST;

  /// INTERACTION TYPE DECLARATIONS ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface IActable {
    isSelected: boolean;
    isHovered: boolean;
    isGrouped: boolean;
    isCaptive: boolean;
    setSelected: (mode: boolean) => boolean;
    setHovered: (mode: boolean) => boolean;
    setGrouped: (mode: boolean) => boolean;
    setCaptive: (mode: boolean) => boolean;
  }

  /// AGENT MOVEMENT MODES ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface IMovementMode {
    mode: () => EControlMode;
    setPreviousMode: () => EControlMode;
    setModeStatic: () => EControlMode;
    setModeDrag: () => EControlMode;
    setModePuppet: () => EControlMode;
    setModeAuto: () => EControlMode;
    isModeStatic: () => boolean;
    isModeDrag: () => boolean;
    isModePuppet: () => boolean;
    isModeAuto: () => boolean;
  }
}

/// EXPORT AS MODULE FOR GLOBALS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// workaround for global enums not being inlined as objects
/// requires explicit import { ... } from types/t-script.d
export enum EControlMode {
  static = 0,
  drag, // temporarily override control by system, e.g. during drag
  puppet, // someone (not system) is controlling it
  auto // AI
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** defines the kinds of bundles. most of the time our bundles refer to
 *  blueprint bundles that contain a subset of possible keys.
 */
export enum EBundleType {
  INIT = 'init', // freshly created or empty bundle (set to another type)
  BLUEPRINT = 'blueprint' // blueprint for initializing agents
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** list of possible tags in a bundle (not mutually-exclusive) */
export enum EBundleTag {
  isCharControllable = 'isCharControllable', // char controller controllable
  isPozyxControllable = 'isPozyxControllable', // pozyx tracker controllable
  isPTrackControllable = 'isPTrackControllable' // ptrack tracker controllable
}
