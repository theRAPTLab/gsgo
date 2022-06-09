/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as SIMDATA from 'modules/datacore/dc-sim-data';
import { Evaluate } from 'lib/expr-evaluator';
// imports types from t-script.d
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import FLAGS from 'modules/flags';
import { EControlMode } from '../types/t-script.d';
import SM_Message from './class-sm-message';
import SM_Object from './class-sm-object';
import SM_State from './class-sm-state';
import StatusObject from './class-status-object';

/// CONSTANTS & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REF_ID_COUNT = 0;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GAgent extends SM_Object implements IAgent, IActable {
  blueprint: ISMCBundle;
  featureMap: Map<string, IFeature>;
  controlMode: EControlMode;
  controlModeHistory: EControlMode[];
  isCaptive: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  isGlowing: boolean;
  isLargeGraphic: boolean;
  updateQueue: TMethod[];
  thinkQueue: TMethod[];
  execQueue: TMethod[];
  canSeeCone: any;
  canSeeColor: any;
  cursor: IAgent;
  distanceTo: any;
  touchTable: Map<any, any>;
  lastTouched: any;
  isTouching: any;
  statusObject: StatusObject;
  static Symbols: TSymbolData;

  //
  constructor(agentName = '<anon>', id?: string | number) {
    super(agentName); // sets value to agentName, which is only for debugging

    // override default SM_Object id with instance id
    this.id = id || this.id;

    this.refId = REF_ID_COUNT++;
    this.meta.type = Symbol.for('Agent');
    this.blueprint = undefined;
    this.featureMap = new Map();
    // note: this.props defined in SM_Object of type SM_Dict
    // note: this.methods defined in SM_Object of type SM_Dict
    this.updateQueue = [];
    this.thinkQueue = [];
    this.execQueue = [];
    // built-in movement control states
    this.controlMode = EControlMode.auto;
    this.controlModeHistory = [];
    // shared basic props in props for conceptual symmetry
    this.prop.x = new SM_Number(0); // default to 0, otherwise it'll start out undefined
    this.prop.y = new SM_Number(0); // default to 0, otherwise it'll start out undefined
    this.prop.zIndex = new SM_Number();
    this.prop.skin = new SM_String();
    this.prop.color = new SM_Number();
    this.prop.scale = new SM_Number();
    this.prop.scale.setMax(10);
    this.prop.scale.setMin(-10);
    this.prop.scaleY = new SM_Number();
    this.prop.scaleY.setMax(10);
    this.prop.scaleY.setMin(-10);
    this.prop.orientation = new SM_Number();
    this.prop.visible = new SM_Boolean(true);
    this.prop.alpha = new SM_Number();
    this.prop.alpha.setMax(1);
    this.prop.alpha.setMin(0);
    this.prop.isInert = new SM_Boolean(false);
    this.prop.isInhabitingTarget = new SM_Boolean(false); // is not available to pick up agent

    // REVIEW: All of these status variables should be folded into statusObject
    this.prop.statusText = new SM_String();
    this.prop.statusValue = new SM_Number();
    this.prop.statusValue.setMax(1);
    this.prop.statusValue.setMin(0);
    this.prop.statusValueColor = new SM_Number(); // color
    this.prop.statusValueIsLarge = new SM_Boolean(false); // script accessible
    // feature data -- only accessible via features, not directly
    this.statusObject = new StatusObject(this);
    // this.prop.name = () =>
    //   throw Error('use agent.name, not agent.prop.name');
    // };
    this.symbolize(); // will make symbols from default prop contents
  }

  /// BUILT-IN PROPERTY ACCESSORS /////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// All agents have these built-in properties. While they are also accessible
  /// via the prop object and getProp() method, these is a shortcut accessors
  /// for keyword authors to use. Note that the 'name' accessor is defined in
  /// Agent's superclass SM_Object
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  get x() {
    return this.prop.x.value;
  }
  set x(num: number) {
    this.prop.x.value = num;
  }
  get y() {
    return this.prop.y.value;
  }
  set y(num: number) {
    this.prop.y.value = num;
  }
  get zIndex() {
    return this.prop.zIndex.value;
  }
  set zIndex(num: number) {
    this.prop.zIndex.value = num;
  }
  get skin() {
    return this.prop.skin.value;
  }
  set skin(str: string) {
    this.prop.skin.value = str;
  }
  get color() {
    return this.prop.color.value;
  }
  set color(num: number) {
    this.prop.color.value = num;
  }
  get scale() {
    return this.prop.scale.value;
  }
  set scale(num: number) {
    this.prop.scale.setTo(num);
  }
  get scaleY() {
    return this.prop.scaleY.value;
  }
  set scaleY(num: number) {
    this.prop.scaleY.setTo(num);
  }
  set orientation(rad: number) {
    this.prop.orientation.setTo(rad);
  }
  get orientation() {
    return this.prop.orientation.value;
  }
  set visible(bool: boolean) {
    this.prop.visible.setTo(bool);
  }
  get visible() {
    return this.prop.visible.value;
  }
  get alpha() {
    return this.prop.alpha.value;
  }
  set alpha(num: number) {
    this.prop.alpha.setTo(num);
  }
  get isInert() {
    return this.prop.isInert.value;
  }
  set isInert(bool: boolean) {
    this.prop.isInert.setTo(bool);
  }
  get statusText() {
    return this.prop.statusText.value;
  }
  set statusText(str: string) {
    this.prop.statusText.setTo(str);
  }
  get statusValue() {
    return this.prop.statusValue.value;
  }
  set statusValue(num: number) {
    this.prop.statusValue.setTo(num);
  }
  get statusValueColor() {
    return this.prop.statusValueColor.value;
  }
  set statusValueColor(num: number) {
    this.prop.statusValueColor.setTo(num);
  }
  get statusValueIsLarge() {
    return this.prop.statusValueIsLarge.value;
  }
  set statusValueIsLarge(mode: boolean) {
    this.prop.statusValueIsLarge.setTo(mode);
  }

  /** called right after constructor creates default props for all agents. The symbol
   *  data is stored as a static class variable.
   */
  symbolize(): TSymbolData {
    if (GAgent.Symbols) return GAgent.Symbols;
    // create the symbol data for props since they don't exist yet
    const P = 'makeDefaultSymbols()';
    const sym = {};
    // Only expose specific GAgent properties
    const props = ['x', 'y', 'statusText'];
    for (let prop of props) {
      if (sym[prop] !== undefined) throw Error(`${P}: ${prop} already exists`);
      sym[prop] = this.getProp(prop).symbolize();
    }
    // ORIG: symbolize ALL properties
    // for (const [propName, prop] of Object.entries(this.prop)) {
    //   if (sym[propName] !== undefined)
    //     throw Error(`${P}: ${propName} already exists`);
    //   sym[propName] = prop.symbolize();
    // }
    GAgent.Symbols = { props: sym };
    return sym;
  }

  /// MOVEMENT MODES //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  private pushMode = (mode: EControlMode) => {
    this.controlMode = mode;
    return this.controlModeHistory.push(mode);
  };
  mode = () => this.controlMode;
  setPreviousMode = () => this.controlModeHistory.pop() || EControlMode.auto;
  setModeStatic = () => this.pushMode(EControlMode.static);
  setModeDrag = () => this.pushMode(EControlMode.drag);
  setModePuppet = () => this.pushMode(EControlMode.puppet);
  setModeAuto = () => this.pushMode(EControlMode.auto);
  isModeStatic = () => this.controlMode === EControlMode.static;
  isModeDrag = () => this.controlMode === EControlMode.drag;
  isModePuppet = () => this.controlMode === EControlMode.puppet; // is input Agent
  isModeAuto = () => this.controlMode === EControlMode.auto;

  /// AGENT INTERACTION STATES ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);
  setGlowing = (mode = this.isGlowing) => (this.isGlowing = mode);
  toggleSelected = () => {
    this.isSelected = !this.isSelected;
  };

  /// PROPERTIES, METHODS, FEATURES ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// addProp, getProp is defined in SM_Object
  /// addMethod, getMethod is defined in SM_Object
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoke method by name.
   */
  execMethod(mName: string, ...args: any): any {
    const m = this.getMethod(mName);
    return this.exec(m, {}, ...args);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add a featurepack to an agent's feature map by feature name featurepacks
   *  store its own properties directly in agent.props featurepacks store method
   *  pointers in agent.methods, and all methods have the signature
   *  method(agentInstance, ...args)
   */
  addFeature(fName: string): void {
    // does key already exist in this agent? double define in blueprint!
    if (this.featureMap.has(fName))
      throw Error(`feature '${fName}' already in blueprint`);
    // save the FeaturePack object reference in agent.feature map
    const fpack = SIMDATA.GetFeature(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    this.featureMap.set(fName, fpack);
    fpack.decorate(this);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns true if the featurepack is associated with this agent instance.
   *  Used by sim-conditions to check for feature before calling
   *  without throwing an error like getFeature does */
  hasFeature(fName: string): boolean {
    const feat = this.featureMap.get(fName);
    if (feat === undefined) return false;
    return true;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns the featurepack associated with this agent instance. This is an
   *  object reference to a shared instance of IFeature */
  getFeature(fName: string): any {
    const feat = this.featureMap.get(fName);
    if (feat === undefined) throw Error(`no feature named '${fName}'`);
    return feat;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return a feature with feature method for execution */
  getFeatMethod(fName: string, mName: string): any {
    const feat = this.getFeature(fName);
    const featMethod = feat[mName];
    if (!featMethod)
      throw Error(`method '${mName}' not in Feature '${feat.name}'`);
    return [feat, featMethod];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Called from compiled code, execute a feature function with feature context
   *  as 'this' with signature (agent,...args)
   *  This is a variation of exec_program() with 'this' swapped for the feature
   *  instance
   */
  callFeatMethod(fName: string, mName: string, ...args): any {
    const [feat, featMethod] = this.getFeatMethod(fName, mName);
    return featMethod.call(feat, this, ...args);
  }
  /** Return prop given the passed agent and key. This prop is stored
   *  in the agent's props map as a SM_Dictionary, so this version
   *  of prop returns the contents of the SM_Dictionary!
   */
  getFeatProp(fName: string, pName: string): ISM_Object {
    const featProps = this.prop[fName];
    return featProps[pName];
  }
  /** Return prop value given passed agent and key */
  getFeatPropValue(fName: string, pName: string): any {
    const featProps = this.prop[fName];
    return featProps[pName].value;
  }
  /** Return private feature variable. The variable name must begin with
   *  an _, and it holds a regular Javascript value
   */
  getFeatVar(fName: string, vName: string): any {
    if (!vName.startsWith('_')) throw Error('feature var name must begin with _');
    const featProps = this.prop[fName];
    return featProps[vName];
  }
  /** Returns a bitflags for various selection states */
  getFlags(): number {
    // return Math.random() > 0.5 ? true : false;
    const selected = this.isSelected ? FLAGS.SELECTION.SELECTED : 0;
    const hovered = this.isHovered ? FLAGS.SELECTION.HOVERED : 0;
    const grouped = this.isGrouped ? FLAGS.SELECTION.GROUPED : 0;
    const captive = this.isCaptive ? FLAGS.SELECTION.CAPTIVE : 0;
    const glowing = this.isGlowing ? FLAGS.SELECTION.GLOWING : 0;
    const largeMeter = this.prop.statusValueIsLarge.value
      ? FLAGS.SELECTION.LARGEMETER
      : 0;
    return selected | hovered | grouped | captive | glowing | largeMeter;
  }
  /** Returns a bitflags for various selection states */
  getMeterFlags(): number {
    return this.statusObject.position;
  }
  /// SIM LIFECYCLE QUEUES ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// To change the behavior of an instance, inject a program into either
  /// the UPDATE, THINK, or EXEC queues. The queues are executed during
  /// the corresponding AGENT_UPDATE, AGENT_THINK, and AGENT_EXEC lifecycle
  /// hooks.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Queue a message to be handled during AGENT_UPDATE. Currently, it extracts
   *  the 'actions' property which is TMethod that can be executed. This is
   *  called from sim-conditions during update
   */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  queueUpdateMessage(message: SM_Message) {
    const { actions } = message;
    this.updateQueue.push(...actions);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  queueThinkMessage(message: SM_Message) {
    const { actions } = message;
    this.thinkQueue.push(...actions);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  queueExecMessage(message: SM_Message) {
    const { actions } = message;
    this.execQueue.push(...actions);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** After running the blueprint update program, also run any programs that
   *  are stored in the queue, then clear it. The algorithm is the same for
   *  each queue type.
   */
  agentUPDATE(frameTime: number) {
    const ctx = { agent: this, [this.blueprint.name]: this };
    if (this.blueprint && this.blueprint.update) {
      this.exec(this.blueprint.update, ctx);
    }
    this.updateQueue.forEach(action => {
      // console.log(this.name(), 'updateAction', this.exec(action));
      this.exec(action, ctx);
    });
    this.updateQueue = [];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  agentTHINK(frameTime: number) {
    const ctx = { agent: this, [this.blueprint.name]: this };
    if (this.blueprint && this.blueprint.think) {
      this.exec(this.blueprint.think, ctx);
    }
    this.thinkQueue.forEach(action => {
      // console.log(this.name(), 'thinkAction', this.exec(action));
      this.exec(action, ctx);
    });
    this.thinkQueue = [];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  agentEXEC(frameTime: number) {
    const ctx = { agent: this, [this.blueprint.name]: this };
    if (this.blueprint && this.blueprint.exec) {
      this.exec(this.blueprint.exec, ctx);
    }
    this.execQueue.forEach(action => {
      // console.log(this.name(), 'execAction', this.exec(action));
      this.exec(action, ctx);
    });
    this.execQueue = [];
  }

  /// AGENT BLUEPRINT INSTANTIATION ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** After a blank agent is created via new Agent(), this method accepts a
   *  blueprint program bundle and executes the initialization programs that
   *  were compiled. All agent initialization, including assigning features,
   *  are done through the scripting language interface.
   */
  setBlueprint(bdl: ISMCBundle) {
    if (!bdl) throw Error('setBlueprint expects an ISMCBundle');
    if (!bdl.name) throw Error('setBlueprint got bp without name');
    this.blueprint = bdl;
    // call initialization
    this.exec(bdl.define);
    this.exec(bdl.init);
  }

  /// AGENT PROGRAM EXECUTION /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Agent instances provide the execution context for each program it wants
  /// to run on itself. The main API method is exec(program,...args), which
  /// can handle SMC code, regular Javascript functions, named programs in
  /// the global program store, and abstract syntax trees
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Run a TMethod with a variable list of arguments.
   */
  exec(m: TMethod, context?, ...args): any {
    if (m === undefined) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const ctx = { agent: this, global: GAgent.GLOBAL_AGENT };
    Object.assign(ctx, context);
    if (Array.isArray(m)) return this.exec_smc(m, ctx, ...args);
    if (typeof m === 'object') {
      if (m.expr) return this.exec_ast(m.expr, ctx);
      console.warn('exec got unexpected object node', m);
    }
    if (typeof m === 'function') return this.exec_func(m, ctx, ...args);
    if (typeof m === 'string') return this.exec_program(m, ctx, ...args);
    throw Error('method object is neither function or smc');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute agent stack machine program. Note that commander also
   *  implements ExecSMC to run arbitrary programs as well when
   *  processing AgentSets. Optionally pass a stack to reuse.
   */
  exec_smc(program: TSMCProgram, ctx, ...args) {
    const state = new SM_State([...args], ctx);
    program.forEach(op => op(this, state));
    return state.stack;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute a method that is a Javascript function with
   *  agent as the execution context
   */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  exec_func(program: Function, ctx, ...args: any[]): any {
    return program.call(this, ctx, ...args);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute a named program stored in global program store */
  exec_program(progName: string, context, ...args) {
    const prog = SIMDATA.GetProgram(progName) || SIMDATA.GetTest(progName);
    if (prog !== undefined) return this.exec(prog, context, ...args);
    throw Error(`program ${progName} not found in PROGRAMS or TESTS`);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Parse an abstract syntax tree through Evaluate */
  exec_ast(exprAST: object, ctx, ...args) {
    ctx.args = args;
    return Evaluate(exprAST, ctx);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Utility to evalute an AST or array of ASTs, replacing them with
   *  the evaluated VALUES at runtime. The arguments are mutated and
   *  returned to the caller. This is typically used by keyword implementors
   *  during COMPILE, which must convert the ScriptUnit[] arguments of the
   *  PROGRAM and EXPRESSION types into a runtime AST that is captured by
   *  the produced function array.
   */
  evaluateArgs(args: any, context: object = this): any {
    if (typeof args === 'object' && args.type !== undefined)
      return Evaluate(args, this);

    if (Array.isArray(args)) {
      // mutate array if there are expressions
      args.forEach((arg, index, arr) => {
        if (typeof arg !== 'object') return;
        if (arg.type === undefined) return;
        arr[index] = Evaluate(arg, context);
      });
      return args;
    }
    // numbers, strings, booleans return as-is
    return args;
  }

  /// OBJECT SERIALIZATION ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return a pure data object that represents the runtime state of this
   *  agent instance, suitable for being deserialized back into an agent
   *  instance when we need to.
   */
  serialize() {
    // call serialize on all features
    // call serialize on all props
    return super
      .serialize()
      .concat([
        'name',
        this.name,
        'x',
        this.prop.x.value,
        'y',
        this.prop.y.value,
        'skin',
        this.prop.skin.value,
        'scale',
        this.prop.scale.value,
        'scaleY',
        this.prop.scaleY.value,
        'alpha',
        this.prop.alpha.value,
        'isInert',
        this.prop.isInert.value,
        'feature',
        this.featureMap.keys()
      ]);
  }
  /// STATIC METHODS AND MEMBERS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static GLOBAL_AGENT: GAgent;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static ClearGlobalAgent() {
    GAgent.GLOBAL_AGENT = new GAgent('GlobalAgent');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static GetGlobalAgent() {
    if (GAgent.GLOBAL_AGENT === undefined)
      GAgent.GLOBAL_AGENT = new GAgent('GlobalAgent');
    return GAgent.GLOBAL_AGENT;
  }
  // end of Agent class
}

/// STATIC VARIABLES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GAgent.Symbols = undefined; // set by GAgent.makeDefaultSymbols()

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export main Agent
export default GAgent;
