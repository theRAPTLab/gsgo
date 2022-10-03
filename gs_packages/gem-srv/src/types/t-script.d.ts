/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Type Declarations

  look for CODE REVIEW: tags here to see what needs to be cleaned up
  for a second revision of the script engine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

declare global {
  /// GENERIC OBJECTS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** the generic object with arbitrary keys */
  type TAnyObject = {
    [any: string]: any;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Declare an object with keys. Used by SM_Objects to store props or
   *  methods. SM_Dict can also be nested, as in the case with Features */
  type SM_Dict = {
    [key: string]: any | SM_Dict;
  };

  /// BASE SIMULATION OBJECTS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** The fundamentable scriptable element is the SM_Object, which implement
   *  the essential getMethod, getProp, and value methods.
   *  SM_Agent, prop types, and SM_Feature classes implement this interface. */
  interface ISM_Object {
    id: any;
    refId?: any;
    meta: { type: symbol; name?: string };
    prop?: SM_Dict;
    method?: SM_Dict;
    addMethod: (name: String, callable: TSM_Method) => void;
    addProp: (name: string, gv: ISM_Object) => ISM_Object;
    getMethod: (name: string) => TSM_Method;
    getProp: (name: string) => ISM_Object;
    getPropValue: (name: string) => any;
    get value(): any;
    set value(val: any);
    symbolize: () => TSymbolData;
    value: any;
    name: string;
  }

  /// INTERACTION TYPE DECLARATIONS ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** the interactable interface model an object that has state that can be
   *  represented by a direct maniplation-style UI */
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
  /** the movement mode interface models an object that can be in one of
   *  several 'controlled movement' modes */
  interface IControllable {
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
  /// AGENT TYPE DECLARATIONS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Agents have additional properties on top of ISM_Object */
  interface IAgent extends ISM_Object, IActable, IControllable {
    blueprint: any;
    featureMap: Map<string, IFeature>;
    addFeature: (name: string) => void;
    hasFeature: (name: string) => boolean;
    getFeature: (name: string) => any;
    updateQueue: TSM_Method[];
    thinkQueue: TSM_Method[];
    execQueue: TSM_Method[];
    queueUpdateMessage: (msg: IMessage) => void;
    queueThinkMessage: (msg: IMessage) => void;
    queueExecMessage: (msg: IMessage) => void;
    exec: (prog: TSM_Method, ctx?: object, ...args) => any;
    getFeatMethod: (fname: string, mName: string) => [IFeature, TSM_Method];
    callFeatMethod: (fName: string, mName: string, ...args) => any;
    getFeatProp: (fName: string, pName: string) => ISM_Object;
    getFeatPropValue: (fName: string, pName: string) => any;

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
  /** Features are very similar to ISM_Object interface, but they are
   *  collections of methods, not simulator objects. The methods defined in
   *  an IFeature are javascript functions instead of ASTs or TSMCProgram
   *  as Features are intended to encapsulate high performance code that's
   *  too difficult for students to write; methods expose this to GEMSCRIPT */
  interface IFeature {
    meta: { name: string };
    get name(): string;
    method: SM_Dict;
    initialize(pm: any): void;
    decorate(agent: IAgent): void;
    featAddProp(agent: IAgent, key: string, prop: ISM_Object): void;
    featAddMethod(mName: string, func: TSM_FeatureMethod): void;
    featGetMethod(mName: string): TSM_FeatureMethod;
    // compatibility with SM_Object
    getMethod(mName: string): TSM_FeatureMethod;
    symbolize(): TSymbolData;
    reset(): void;
  }
  /** SM_Feature methods are either functions or TSMCPrograms */
  type TSM_FeatureMethod = (agent: IAgent, ...any: any[]) => any;

  /// SIMULATION RUNTIME //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine Message, which consists of a message and an SMCProgram */
  interface IMessage {
    id?: number;
    channel?: string;
    message?: string;
    context?: {}; // context object for expressions, programs
    actions?: TSM_Method[];
    conseq?: TSM_Method;
    inputs?: any;
  }

  /// INTERMEDIATE SCRIPT REPRESENTATION //////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Our "script" format is a serializeable format that can be converted to
   *  either compiled output (a TSMCProgram stored in a TSMCBundle) or to
   *  renderable JSX for a UI. */
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
  type TKWArg = number | string | TSM_Method | IToken; // "decoded" tokens
  type TKWArguments = TKWArg[]; // decoded tokens provided to compile functions
  type TScript = TScriptUnit[]; // We use TScriptUnit[] in code
  type TUnpackedToken = [type: string, value: any];

  /// SYMBOL DATA AND TYPES ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // symbol type declarations
  // fyi: using template string format allows us to specify strings that match
  // these types to filter string values! function myFunction(type:TSLit) works
  type TSLit = `${'boolean'}` | `${'string'}` | `${'number'}` | `${'identifier'}`;
  type TSSMObj = `${'prop'}` | `${'method'}` | `${'propType'}` | `${'block'}`;
  type TSDeferred = `${'objref'}` | `${'expr'}`;
  type TSSpecial = `${'{value}'}` | `${'{string}'}` | `${'{any}'}`;
  type TSDict = `${'keyword'}` | `${'pragma'}` | `${'test'}` | `${'program'}`;
  type TSNameList = `${'event'}` | `${'option'}`;
  type TSAgent = `${'blueprint'}` | `${'feature'}` | `${'bdlOut'}` | `${'tag'}`;
  type TSMultiArg = `${'{...}'}`; // multiple arg token marker
  type TSList = `${'{list}'}`; // future
  type TSNonCode = `${'{noncode}'}`;
  type TSUnknown = `${'{?}'}`; // unknown 'vague' type for validation
  type TGSType =
    | TSLit
    | TSSMObj
    | TSDeferred
    | TSSpecial
    | TSDict
    | TSNameList
    | TSAgent
    | TSMultiArg
    | TSList
    | TSUnknown
    | TSNonCode;
  type TSEnum = { enum: string[] }; // special format for enum args (future)
  type TGSArg = `${string}:${TGSType}` | TSEnum;
  type TGSMethodSig = {
    parent?: string; // featureName, propName
    name?: string;
    args?: TGSArg[];
    returns?: TGSArg;
    info?: string;
  };
  type TNameSet = Set<string>;
  type TSymUnpackedArg = [name: string, type: TGSType];

  /// MAIN SYMBOL DATA DECLARATION ////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** data description of symbols for features, props. returned from anything
   *  that produces Symbol data: keywords with .symbolize(unit), gvars and feat
   *  modules that implement a static Symbols definition */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  type TSymbolData = {
    // read-only dictionaries
    keywords?: string[]; // a list of valid keywords for position 0
    propTypes?: { [ctorName: string]: TSymbolData }; // constructor object if needed (used by var- props)
    pragmas?: { [prName: string]: TGSMethodSig }; // directives hack
    blueprints?: { [bpName: string]: TSymbolData }; // blueprints
    props?: { [propName: string]: TSymbolData };
    methods?: { [methodName: string]: TGSMethodSig };
    features?: { [featureName: string]: TSymbolData };
    featuresList?: string[];
    context?: { [line: number]: any }; // line number for a root statement
    methodSig?: TGSMethodSig; // arg choices
    arg?: TGSArg; // arg definition string 'name:type'
    tests?: string[]; // unused in gemscript 1.0
    programs?: string[]; // unused in gemscript 1.0
    bdlOuts?: string[]; // valid bundle output name (e.g. DEFINE, INIT, UPDATE)
    tags?: { [tagName: string]: TGSArg };
    events?: string[]; // system names
    options?: string[]; // option flag  names
    globals?: { [globalObj: string]: any }; // global symbols
    // ok to change or add, as these are not defined in the reference dictionaries
    error?: TSymbolError; // debugging if error
    unitText?: string; // the scriptText word associated with symbol
    symbolScope?: Array<keyof TSymbolData>; // 'relevant' scope to iterate by gui
    ui_action?: [command: TValidationActionCodes, ...params: any[]];
    sm_parent?: string; // path to parent sm-object definitions
    gsName?: string; // the 'parameter name/hint' of this token
    gsType?: TGSType; // the gemscript meaning of this token
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** TSymbolViewData is the "GUI-friendly" data structure derived from
   *  a TSymbolData ditionary. This is what's used to draw a GUI */
  type TSymbolViewData = {
    keywords?: { items: string[]; info: string };
    features?: { items: string[]; info: string };
    props?: { items: string[]; info: string };
    methods?: { items: string[]; info: string };
    methodSig?: { items: string[]; info: string };
    // in the case of arg, items arrau begins with argname, followed by argtype
    arg?: { items: [name: string, type: string]; info: string };
    //
    error?: { info: string };
    unitText?: string; // the scriptText word associated with symbol
    gsType?: string; // the gemscript meaning of this token
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Validation Tokens are a wrapper for TSymbolData, and the VSDToken
   *  constructor accepts this subset of TSymbolData propers */
  type TSymbolMeta = {
    gsArg: TGSArg;
    symbolScope?: Array<keyof TSymbolData>; // which symbol dicts apply to gui display
    sm_parent?: string; // dotted string path of parent sm object
    ui_action?: [command: TValidationActionCodes, ...params: any[]];
    act_args?: any[]; // oh so hacky
    unitText?: string;
    err_code?: TValidationErrorCodes;
    err_info?: string;
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
   *  in dtoks from left-to-right up to the index */
  type TSymbolRefs = {
    bundle: ISMCBundle; // blueprint bundle to use
    globals: TAnyObject; // global object context for expressions, blocks
    symbols?: TSymbolData; // current scope
    line?: number; // current line number
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** used by keyword validator function , used for individual token validation
   *  by symbol utilities! */
  type TSymbolError = {
    code: TValidationErrorCodes;
    info: string;
  };
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** when a vtoken indicates that some action is required to validate,
   *  the uiAction code is set */
  type TValidationActionCodes = 'ensureBlock';
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** describes the type of error that occurred during parsing so it can be
   *  rendered in the GUI */
  /// `valid | empty | error | unexpected | vague`
  type TValidationErrorCodes =
    | 'debug' // a debug placeholder
    | 'invalid' // token incorrect type, or invalid value
    | 'empty' // missing token
    | 'extra' // extra token
    | 'vague' // indeterminate token need
    | 'system'; // a non-editable not-an-error system-handwavy thing
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** keyword.validate() returns an array of TSymbolData that
   *  the error state returns code and desc if a parse issue is detected
   *  if symbol information can be inferred despite an error, it will be
   *  returned otherwise it is void. */
  type TValidatedScriptUnit = {
    validationTokens: TSymbolData[];
    validationLog?: string[];
  };

  /// PROGRAM BUNDLES /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** These are the kind of programs that the simulation engine knows about */
  interface ISMCPrograms {
    // blueprint
    DEFINE?: TSMCProgram; // def blueprint, props, features
    INIT?: TSMCProgram; // allocate mem/define default values for instance
    UPDATE?: TSMCProgram; // run during instance update cycle
    THINK?: TSMCProgram; // run during instance think phase
    EXEC?: TSMCProgram; // run during instance exec phase
    // global conditions
    CONDITION?: TSMCProgram; // condition handlers to run
    // global script events
    EVENT?: TSMCProgram; // event handlers to run
    // local condition (one per bundle)
    TEST?: TSMCProgram; // program returning true on stack
    CONSEQ?: TSMCProgram; // program to run on true
    ALTER?: TSMCProgram; // program to run otherwise
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** An ISMCBundle is a collection of compiled elements. This is the minimum
   *  metadata; see class-sm-bundle for the list of possible entities */
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

  /// SCRIPT UNIT TRANSPILER //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** related keyword interface */
  interface IKeyword {
    keyword: string;
    args: TGSArg[] | TGSArg[][]; // multiple signatures
    compile(unit: TKWArguments, refs: TSymbolRefs): TOpcode[];
    jsx(index: number, unit: TScriptUnit, jsxOpt?: {}): any[] /* deprecated */;
    symbolize(unit: TScriptUnit, line?: number): TSymbolData;
    setRefs(refs: TSymbolRefs): void;
    validate(unit: TScriptUnit): TValidatedScriptUnit;
    getName(): string;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** weird Typescript constructor definition used by Transpiler
   *  see fettblog.eu/typescript-interface-constructor-pattern/ */
  interface IKeywordCtor {
    new (keyword?: string): IKeyword;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** a pragma handler is mapepd to a directive (e.g. BLUEPRINT, PROGRAM) */
  type TPragmaHandler = (...param: any) => TOpcode[];

  /// SCRIPT COMPILER HELPERS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** function signatures for 'dereferencing' function in keyword compilers */
  type DerefMethod = (agent: IAgent, context: object) => ISM_Object;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** At runtime, a function is needed to extract a property from a live
   *  agent instance, and this is generated at compile time. It's very similar
   *  to TOpcode's method signature because it's designed to be used inside
   *  of it, passing the original parameters to it  */
  type TSM_PropFunction = (agent?: IAgent, sm_state?: IState) => any;

  /// STACKMACHINE TYPE DECLARATIONS //////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine maintains state in form of a data stack, a scope stack,
   *  and a flags object. This state is passed, along with agent, to every
   *  stackmachine opcode. The opcode is free to mutate the stacks and agent */
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
   *  stack machine.   */
  type TStackable = ISM_Object | TValue;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Allowed "literal values" on the data stack */
  type TValue = string | number | boolean;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine condition */
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
  /** SM_Agents use this "opcode" format, which receives mutable
   *  agent, stack, scope, and condition flag objects. This is how agents
   *  and their props are changed by the scripting engine. The agent is
   *  the memory context, and the stack is used to pass values in/out. */
  type TOpcode = (
    agent?: IAgent, // memory context (an agent instance)
    sm_state?: IState // machine state
  ) => void;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Used for transpiler-generated code that runs outside of an instanced
   *  SM_Agent, for example the code that runs during CONDITION phase */
  type TRegcode = (
    agent?: IAgent // OPTIONAL memory context
  ) => void;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine program is an array of TOpcode function objects that
   *  are invoked one-after-the-other with the same SM_Agent instance and
   *  an optional memory context */
  type TSMCProgram = TOpcode[];
  /** A global program is one that runs outside of SM_Agent, recieving only
   *  optional memory context */
  type TSMCGlobalProgram = TRegcode[];
  /** An AST produced by expression-parser */
  type TExpressionAST = { expr: any }; // expr is the top node of the AST
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** A stackmachine method can a regular js function, a TSMCProgram, or an
   *  AST expression. SM_Agent.exec() determines how to run it */
  type TSM_Method = TSMCProgram | TExpressionAST;
} // end of global type declaration

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
 *  blueprint bundles that contain a subset of possible keys. */
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** whenever a '' unitText is encountered and we need to display it as a
 *  clickable choice, use this text instead */
export const GUI_EMPTY_TEXT = '<blank>';
