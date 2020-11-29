/* eslint-disable no-return-assign */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { FEATURES, GetProgram, GetTest } from 'modules/runtime-datacore';
import * as GLOBAL from 'modules/runtime-globals';
import { Evaluate } from 'lib/expr-evaluator';
import { NumberProp, StringProp } from 'modules/sim/props/var';
import SM_Message from './class-sm-message';
import SM_Object from './class-sm-object';
import SM_State from './class-sm-state';
import {
  IAgent,
  IScopeable,
  TMethod,
  TExpressionAST,
  TSMCProgram,
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
  features: Map<string, any>;
  controlMode: ControlMode;
  controlModeHistory: ControlMode[];
  isCaptive: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isGrouped: boolean;
  updateQueue: TMethod[];
  thinkQueue: TMethod[];
  execQueue: TMethod[];
  _name: StringProp;
  _x: NumberProp;
  _y: NumberProp;
  _skin: StringProp;
  //
  constructor(agentName = '<anon>') {
    super(agentName); // sets value to agentName, which is only for debugging
    this.meta.type = Symbol.for('Agent');
    // this.props map defined in SM_Object
    // this.methods map defined in SM_Object
    this.blueprint = undefined;
    this.features = new Map();
    this.updateQueue = [];
    this.thinkQueue = [];
    this.execQueue = [];
    this.refId = REF_ID_COUNT++;
    this.controlMode = ControlMode.puppet;
    this.controlModeHistory = [];
    // declare agent basic properties
    this._name = new StringProp(agentName);
    this._x = new NumberProp();
    this._y = new NumberProp();
    this._skin = new StringProp('default');
    // mirror basic props in props for conceptual symmetry
    this.props.set('name', this._name);
    this.props.set('x', this._x);
    this.props.set('y', this._y);
    this.props.set('skin', this._skin);
  }

  // blueprint initialize
  setBlueprint(bdl: ISMCBundle) {
    if (!bdl) throw Error('setBlueprint expects an ISMCBundle');
    if (!bdl.name) throw Error('setBlueprint got bp without name');
    this.blueprint = bdl;
    // call initialization
    this.exec(bdl.define);
    this.exec(bdl.init);
  }

  // internal control mode properties
  private pushMode = (mode: ControlMode) => this.controlModeHistory.push(mode);
  mode = () => this.controlMode;
  setPreviousMode = () => this.controlModeHistory.pop() || ControlMode.auto;
  setModePuppet = () => this.pushMode(ControlMode.puppet);
  setModeAuto = () => this.pushMode(ControlMode.auto);
  setModeStatic = () => this.pushMode(ControlMode.static);
  isModePuppet = () => this.controlMode === ControlMode.puppet;
  isModeAuto = () => this.controlMode === ControlMode.auto;
  isModeStatic = () => this.controlMode === ControlMode.static;

  // interactable states
  setSelected = (mode = this.isSelected) => (this.isSelected = mode);
  setHovered = (mode = this.isHovered) => (this.isHovered = mode);
  setGrouped = (mode = this.isGrouped) => (this.isGrouped = mode);
  setCaptive = (mode = this.isCaptive) => (this.isCaptive = mode);

  // accessor methods for built-in props
  name = (match?: string) => {
    if (typeof match === 'string' && match !== this._name.value) return undefined;
    return this._name.value;
  };
  x = () => this._x.value;
  y = () => this._y.value;
  skin = () => this._skin.value;

  // definition methods
  // addProp defined in SM_Object
  // addMethod defined in SM_Object

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: add a featurepack to an agent's feature map by feature name
   *  featurepacks store its own properties directly in agent.props
   *  featurepacks store method pointers in agent.methods, and all methods
   *  have the signature method(agentInstance, ...args)
   *  @param {string} featureName - name of FeatureLib to look up and add
   *  @returns {FeatureLib} - for chaining agent calls
   */
  addFeature(fName: string): void {
    const { features } = this;
    // does key already exist in this agent? double define in blueprint!
    if (features.has(fName))
      throw Error(`feature '${fName}' already in blueprint`);
    // save the FeaturePack object reference in agent.feature map
    const fpack = FEATURES.get(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    // this should return agent
    this.features.set(fName, fpack);
    fpack.decorate(this);
  }

  /** Retrieve a prop object
   *  This overrides sm-object prop()
   */
  prop(name: string): IScopeable {
    const p = this.props.get(name);
    if (p === undefined)
      console.warn(`agent ${this.name()} does not have prop '${name}'`);
    return p;
  }

  /** Invoke method by name. functions return values, smc programs return stack
   *  This overrides sm-object method()
   */
  method(name: string, ...args: any): any {
    const m = this.methods.get(name);
    return this.exec(m, ...args);
  }

  /** retrieve the feature reference */
  feature(name: string): any {
    const f = this.features.get(name);
    if (f === undefined) throw Error(`no feature named '${name}'`);
    return f;
  }

  /** PhaseMachine Lifecycle Execution QUEUES */
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

  /** utility that checks whether an argument is an expression.
   *  if it is, then Evaluate() is called on it to return an actual
   *  value.
   *  NOTE: args are MUTATED IN-PLACE.
   *  The mutated array is also returned if you want to assign
   *  it directly.
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

  /** handle queue (placeholder) */
  queueUpdateMessage(message: SM_Message) {
    const { actions } = message;
    this.updateQueue.push(...actions);
  }
  queueThinkMessage(message: SM_Message) {
    const { actions } = message;
    this.thinkQueue.push(...actions);
  }
  queueExecAction(message: SM_Message) {
    const { actions } = message;
    this.execQueue.push(...actions);
  }

  /** Execute either a smc_program or function depending on the
   *  method passed-in with arguments
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
  /** Execute a method that is a Javascript function with
   *  agent as the execution context
   */
  exec_func(program: Function, ctx, ...args: any[]): any {
    return program.call(this, this, ...args);
  }
  /** Execute a named program stored in global program store */
  exec_program(progName: string, [...args], context) {
    const prog = GetProgram(progName) || GetTest(progName);
    if (prog !== undefined) return this.exec(prog, args, context);
    throw Error(`program ${progName} not found in PROGRAMS or TESTS`);
  }
  exec_ast(ast: TExpressionAST, ctx) {
    return Evaluate(ast, ctx);
  }
  // serialization
  serialize() {
    // call serialize on all features
    // call serialize on all props
    return super
      .serialize()
      .concat([
        'name',
        this.name(),
        'x',
        this.x(),
        'y',
        this.y(),
        'skin',
        this.skin(),
        'features',
        this.features.keys()
      ]);
  }
} // end of Agent class

/// GLOBAL INSTANCES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GLOBAL_AGENT = new Agent();
function GetGlobalAgent() {
  return GLOBAL_AGENT;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export main Agent
export default Agent;
export { GetGlobalAgent };
