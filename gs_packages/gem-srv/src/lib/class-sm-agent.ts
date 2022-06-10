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
import { EControlMode } from 'modules/../types/t-script.d';
import SM_Message from './class-sm-message';
import SM_Object from './class-sm-object';
import SM_State from './class-sm-state';
import StatusObject from './class-status-object';

/// CONSTANTS & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REF_ID_COUNT = 0;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SM_Agent extends SM_Object implements IAgent, IActable {
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
  updateQueue: TSM_Method[];
  thinkQueue: TSM_Method[];
  execQueue: TSM_Method[];
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
  /** Returns symbol data. It's called right after constructor creates default
   *  props for all agents. The symbol data is stored as a static class
   *  variable. */
  symbolize(): TSymbolData {
    if (SM_Agent.Symbols) return SM_Agent.Symbols;
    // create the symbol data for props since they don't exist yet
    const fn = 'symbolize:';
    const sym = {};
    // Only expose specific SM_Agent properties
    const props = ['x', 'y', 'statusText'];
    for (let prop of props) {
      if (sym[prop] !== undefined) throw Error(`${fn}: ${prop} already exists`);
      sym[prop] = this.getProp(prop).symbolize();
    }
    SM_Agent.Symbols = { props: sym };
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

  /// FEATURE SUPPORT ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Agents do not have their own methods. They are instead added as
  /// "feature modules" that contain a single copy of the method code that
  /// receives an agent instance as a memory context to work with.
  /// All feature methods have the signature method(agentInstance, ...args)
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** SM_Feature modules are registered in a featureMap for each instance */
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
      throw Error(`method '${mName}' not in SM_Feature '${feat.name}'`);
    return [feat, featMethod];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Called from compiled code, execute a feature function with feature context
   *  as 'this' with signature (agent,...args)
   *  This is a variation of exec_program() with 'this' swapped for the feature
   *  instance */
  callFeatMethod(fName: string, mName: string, ...args): any {
    const [feat, featMethod] = this.getFeatMethod(fName, mName);
    return featMethod.call(feat, this, ...args);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return feature prop given the passed agent and key. SM_Feature props are
   *  stored in agent.props[featureName] in its on key-value object. Note
   *  that the built-in SM_Object.getProp() can also handle dotted notation
   *  so this method is superfluous but retained for compatibility */
  getFeatProp(fName: string, pName: string): ISM_Object {
    const featProps = this.prop[fName];
    return featProps[pName];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return prop value given passed agent and key */
  getFeatPropValue(fName: string, pName: string): any {
    const featProps = this.prop[fName];
    return featProps[pName].value;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return private feature variable. The variable name must begin with
   *  an _, and it holds a regular Javascript value
   */
  getFeatPrivateProp(fName: string, vName: string): any {
    if (!vName.startsWith('_')) throw Error('feature var name must begin with _');
    const featProps = this.prop[fName];
    return featProps[vName];
  }

  /// AGENT INTERACTION SUPPORT /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Agents in the system may be actively 'selected' or 'grouped' or have some
  /// other user-imposed UI status that is independence of the simulation. These
  /// are encoded here as 'none-simulation' data. For the most part, they are
  /// named not for their visual appearance, but for their logical status, because
  /// the simulation's appearance should be "interpreted" by the visual layer
  /// and not baked-into the simulation objects themselves.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Returns a bitflags for various selection states (and more) */
  getFlags(): number {
    // group membership as part of a selection set
    const selected = this.isSelected ? FLAGS.SELECTION.SELECTED : 0;
    const hovered = this.isHovered ? FLAGS.SELECTION.HOVERED : 0;
    const grouped = this.isGrouped ? FLAGS.SELECTION.GROUPED : 0;
    const captive = this.isCaptive ? FLAGS.SELECTION.CAPTIVE : 0;
    // these are improperly named visual states and some kind of
    // haciked meter system that shouldn't be here
    const glowing = this.isGlowing ? FLAGS.SELECTION.GLOWING : 0;
    const largeMeter = this.prop.statusValueIsLarge.value
      ? FLAGS.SELECTION.LARGEMETER
      : 0;
    return selected | hovered | grouped | captive | glowing | largeMeter;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** I'm not sure what this does. Ben hacked it in and didn't comment it. */
  getMeterFlags(): number {
    return this.statusObject.position;
  }

  /// SIM LIFECYCLE QUEUES ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// To change the behavior of an instance, inject a program into either
  /// the UPDATE, THINK, or EXEC queues. The queues are executed during
  /// the corresponding AGENT_UPDATE, AGENT_THINK, and AGENT_EXEC lifecycle
  /// hooks. Each 'action' contains a TSMCProgram.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Queue a message action to run during AGENT_UPDATE */
  queueUpdateMessage(message: SM_Message) {
    const { actions } = message;
    this.updateQueue.push(...actions);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Queue a message action to run during AGENT_THINK */
  queueThinkMessage(message: SM_Message) {
    const { actions } = message;
    this.thinkQueue.push(...actions);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Queue a message action to run during AGENT_EXEC */
  queueExecMessage(message: SM_Message) {
    const { actions } = message;
    this.execQueue.push(...actions);
  }
  /// SIM LIFECYCLE EXECUTION /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// The agent's BLUEPRINT has the shared update, think, and exec programs
  /// that are defined for all instance. Also, conditional code can
  /// cause additional actions to be queued. These methods are directly called
  /// by the simulator game loop for each agent instance in the system.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Run the agent's UPDATE programs */
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
  /** Run the agent's THINK programs */
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
  /** Run the agent's EXEC programs */
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
   *  are done through the scripting language interface. */
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
  /** Run a TSM_Method with a variable list of arguments. */
  exec(m: TSM_Method, context?: TAnyObject, ...args: any[]): any {
    if (m === undefined) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const ctx = { agent: this, global: SM_Agent.GLOBAL_AGENT };
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
   *  processing AgentSets. Optionally pass a stack to reuse. */
  exec_smc(program: TSMCProgram, ctx: TAnyObject, ...args: any[]) {
    const state = new SM_State([...args], ctx);
    program.forEach(op => op(this, state));
    return state.stack;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute a method that is a Javascript function with
   *  agent as the execution context */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  exec_func(program: Function, ctx, ...args: any[]): any {
    return program.call(this, ctx, ...args);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute a named program stored in global program store */
  exec_program(progName: string, context: TAnyObject, ...args: any[]) {
    const prog = SIMDATA.GetProgram(progName) || SIMDATA.GetTest(progName);
    if (prog !== undefined) return this.exec(prog, context, ...args);
    throw Error(`program ${progName} not found in PROGRAMS or TESTS`);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Parse an abstract syntax tree through Evaluate */
  exec_ast(exprAST: object, ctx: TAnyObject, ...args: any[]) {
    ctx.args = args;
    return Evaluate(exprAST, ctx);
  }

  /// STATIC METHODS AND MEMBERS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static GLOBAL_AGENT: SM_Agent;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static ClearGlobalAgent() {
    SM_Agent.GLOBAL_AGENT = new SM_Agent('GlobalAgent');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static GetGlobalAgent() {
    if (SM_Agent.GLOBAL_AGENT === undefined)
      SM_Agent.GLOBAL_AGENT = new SM_Agent('GlobalAgent');
    return SM_Agent.GLOBAL_AGENT;
  }
  // end of Agent class
}

/// STATIC VARIABLES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SM_Agent.Symbols = undefined; // set by SM_Agent.makeDefaultSymbols()

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export main Agent
export default SM_Agent;
