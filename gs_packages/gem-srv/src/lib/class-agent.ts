/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GetFeature, GetProgram, GetTest } from 'modules/datacore';
import * as GLOBAL from 'modules/datacore/dc-globals';
import { Evaluate } from 'lib/expr-evaluator';
import { NumberProp, StringProp } from 'modules/sim/props/var';
import SM_Message from './class-sm-message';
import SM_Object from './class-sm-object';
import SM_State from './class-sm-state';
import {
  IFeature,
  IAgent,
  TMethod,
  TExpressionAST,
  TSMCProgram,
  TSMCFunction,
  IScopeable,
  ISMCBundle
} from './t-script';
import { ControlMode, IActable } from './t-interaction.d';

/// CONSTANTS & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REF_ID_COUNT = 0;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Agent extends SM_Object implements IAgent, IActable {
  blueprint: ISMCBundle;
  featureMap: Map<string, IFeature>;
  controlMode: ControlMode;
  controlModeHistory: ControlMode[];
  isCaptive: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  updateQueue: TMethod[];
  thinkQueue: TMethod[];
  execQueue: TMethod[];
  //
  constructor(agentName = '<anon>') {
    super(agentName); // sets value to agentName, which is only for debugging
    this.refId = REF_ID_COUNT++;
    this.meta.type = Symbol.for('Agent');
    this.blueprint = undefined;
    this.featureMap = new Map();
    // note: this.props defined in SM_Object of type IKeyObject
    // note: this.methods defined in SM_Object of type IKeyObject
    this.updateQueue = [];
    this.thinkQueue = [];
    this.execQueue = [];
    // built-in movement control states
    this.controlMode = ControlMode.puppet;
    this.controlModeHistory = [];
    // shared basic props in props for conceptual symmetry
    this.prop.x = new NumberProp();
    this.prop.y = new NumberProp();
    this.prop.skin = new StringProp('default');
    this.prop.name = () => {
      throw Error('use agent.name, not agent.prop.name');
    };
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
  set y(num) {
    this.prop.y.value = num;
  }
  get skin() {
    return this.prop.skin.value;
  }
  set skin(num) {
    this.prop.skin.value = num;
  }

  /// MOVEMENT MODES //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  private pushMode = (mode: ControlMode) => this.controlModeHistory.push(mode);
  mode = () => this.controlMode;
  setPreviousMode = () => this.controlModeHistory.pop() || ControlMode.auto;
  setModePuppet = () => this.pushMode(ControlMode.puppet);
  setModeAuto = () => this.pushMode(ControlMode.auto);
  setModeStatic = () => this.pushMode(ControlMode.static);
  isModePuppet = () => this.controlMode === ControlMode.puppet;
  isModeAuto = () => this.controlMode === ControlMode.auto;
  isModeStatic = () => this.controlMode === ControlMode.static;

  /// AGENT INTERACTION STATES ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);

  /// PROPERTIES, METHODS, FEATURES ///////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// addProp, getProp is defined in SM_Object
  /// addMethod, getMethod is defined in SM_Object
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoke method by name.
   */
  execMethod(mName: string, ...args: any): any {
    const m = this.getMethod(mName);
    return this.exec(m, ...args);
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
    const fpack = GetFeature(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    this.featureMap.set(fName, fpack);
    fpack.decorate(this);
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
  /** Called from compiled code, execute a feature function with feature context
   *  as 'this' with signature (agent,...args)
   *  This is a variation of exec_program() with 'this' swapped for the feature
   *  instance
   */
  featExec(fName: string, mName: string, ...args): any {
    const feat = this.getFeature(fName);
    const featMethod = feat.method[mName];
    if (!featMethod)
      throw Error(`method '${mName}' not in Feature '${feat.name}'`);
    return featMethod.call(feat, this, ...args);
  }
  /** Return prop given the passed agent and key. This prop is stored
   *  in the agent's props map as a DictionaryProp, so this version
   *  of prop returns the contents of the DictionaryProp!
   */
  featProp(fName: string, pName: string): IScopeable {
    const featProps = this.prop[fName];
    return featProps[pName];
  }

  /// SIM LIFECYCLE QUEUES ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// To change the behavior of an instance, inject a program into either
  /// the UPDATE, THINK, or EXEC queues. The queues are executed during
  /// the corresponding AGENT_UPDATE, AGENT_THINK, and AGENT_EXEC lifecycle
  /// hooks.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Queue a message to be handled during AGENT_UPDATE. Currently, it extracts
   *  the 'actions' property which is TMethod that can be executed
   */
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
  queueExecAction(message: SM_Message) {
    const { actions } = message;
    this.execQueue.push(...actions);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** After running the blueprint update program, also run any programs that
   *  are stored in the queue, then clear it. The algorithm is the same for
   *  each queue type.
   */
  agentUPDATE(frameTime: number) {
    if (this.blueprint && this.blueprint.update) {
      this.exec(this.blueprint.update);
    }
    this.updateQueue.forEach(action => {
      // console.log(this.name(), 'updateAction', this.exec(action));
      this.exec(action);
    });
    this.updateQueue = [];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  agentTHINK(frameTime: number) {
    if (this.blueprint && this.blueprint.think) {
      this.exec(this.blueprint.think);
    }
    this.thinkQueue.forEach(action => {
      // console.log(this.name(), 'thinkAction', this.exec(action));
      this.exec(action);
    });
    this.thinkQueue = [];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  agentEXEC(frameTime: number) {
    if (this.blueprint && this.blueprint.exec) {
      this.exec(this.blueprint.exec);
    }
    this.thinkQueue.forEach(action => {
      // console.log(this.name(), 'execAction', this.exec(action));
      this.exec(action);
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
  exec(m: TMethod, ...args: any[]): any {
    if (m === undefined) return undefined;
    const ctx = { args, agent: this, global: GLOBAL };
    if (typeof m === 'function') return this.exec_func(m, ctx, ...args);
    if (Array.isArray(m)) return this.exec_smc(m, [...args], ctx);
    if (typeof m === 'string') return this.exec_program(m, [...args], ctx);
    if (typeof m === 'object') return this.exec_ast(m, ctx);
    throw Error('method object is neither function or smc');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Execute agent stack machine program. Note that commander also
   *  implements ExecSMC to run arbitrary programs as well when
   *  processing AgentSets. Optionally pass a stack to reuse.
   */
  exec_smc(program: TSMCProgram, stack, ctx) {
    const state = new SM_State(stack, ctx);
    program.forEach((op, index) => {
      if (typeof op !== 'function') console.warn(op, index);
      op(this, state);
    });
    // return the stack as a result, though
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
  exec_program(progName: string, [...args], context) {
    const prog = GetProgram(progName) || GetTest(progName);
    if (prog !== undefined) return this.exec(prog, args, context);
    throw Error(`program ${progName} not found in PROGRAMS or TESTS`);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Parse an abstract syntax tree through Evaluate */
  exec_ast(ast: TExpressionAST, ctx) {
    return Evaluate(ast, ctx);
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
        'feature',
        this.featureMap.keys()
      ]);
  }

  // end of Agent class
}

/// GLOBAL INSTANCES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// The global agent is our "World Agent" that contains shared properties for
/// a running simulation
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GLOBAL_AGENT = new Agent();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetGlobalAgent() {
  return GLOBAL_AGENT;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export main Agent
export default Agent;
export { GetGlobalAgent };
