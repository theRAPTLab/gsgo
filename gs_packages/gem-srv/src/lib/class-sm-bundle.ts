/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A Stack Machine Bundle is a collection of program contexts. Different bundle
  types contain different named programs that have specific types that are
  relevant to a bundle type.

  Bundle Types (EBundleType) specify the kind of programs that are contained
  within suitable for simulation-level actions. They are a kind of context
  for all the program types within

  Program Types represent the primary kinds of programs that exist within
  the GEMscript system.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  TOpcode,
  TRegcode,
  ISMCBundle,
  ISMCPrograms,
  EBundleType
} from './t-script.d';

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a SMCBundle
 */
export default class SM_Bundle implements ISMCBundle {
  name: string; // the name of the bundle, if any
  parent: string; // the name of parent bundle, if any
  type: EBundleType; // enum type (see t-script.d)
  // lifecycle programs (can be in multiple types)
  define: TOpcode[]; // allocation phase
  init: TOpcode[]; // initialize phase
  update: TOpcode[]; // update phase
  think: TOpcode[]; // think phase
  exec: TOpcode[]; // execution phase
  // global programs
  condition: TRegcode[]; // conditionals
  // local conditions (one per bundle)
  test: TOpcode[]; // returns true or false
  conseq: TOpcode[]; // run if true
  alter: TOpcode[]; // run if false
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(name?: string, type?: EBundleType) {
    if (typeof name === 'string') this.setName(name);
    if (type !== undefined) this.setType(type);
    else this.setType(EBundleType.INIT);
    //
    this.define = []; // allocate data structures (agents, features, modules)
    this.init = []; // initialize data structures (a,f,m)
    this.update = []; // update lifecycle (a,f,m)
    this.think = []; // think lifecycle (a,f,m)
    this.exec = []; // exec lifecycle (a,f,m)
    this.condition = []; // global program
    this.test = []; // test function
    this.conseq = []; // program
    this.alter = []; // program
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setName(name: string, parent?: string) {
    if (!name) throw Error('a name is required');
    if (typeof name !== 'string') throw Error('name must be string');
    this.name = name;
    this.parent = parent;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setType(type: EBundleType) {
    const valid = Object.values(EBundleType).includes(type as any);
    if (!valid) throw Error(`invalid bundle type '${type}'`);
    this.type = type;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return an object with non-empty program arrays */
  getPrograms(): ISMCPrograms {
    let progs: ISMCPrograms = {};
    if (this.define.length) progs.define = this.define;
    if (this.init.length) progs.init = this.init;
    if (this.update.length) progs.update = this.update;
    if (this.think.length) progs.think = this.think;
    if (this.exec.length) progs.exec = this.exec;
    if (this.condition.length) progs.condition = this.condition;
    if (this.test.length) progs.test = this.test;
    if (this.conseq.length) progs.conseq = this.conseq;
    if (this.alter.length) progs.alter = this.alter;
    return progs;
  }

  /// BUNDLE INITIALIZERS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  initProgram() {
    this.define = [];
    return this;
  }
  initCondition() {
    this.test = [];
    this.conseq = [];
    this.alter = [];
    return this;
  }
  initBlueprint(name: string) {
    if (name !== undefined) this.name = name;
    this.define = [];
    this.init = [];
    this.update = [];
    this.think = [];
    this.exec = [];
    return this;
  }
  initGlobalProgram(name: string) {
    if (name !== undefined) this.name = name;
    this.define = [];
    return this;
  }
  initGlobalCondition(key: string) {
    if (key !== undefined) this.name = key;
    this.condition = [];
    return this;
  }
  initGlobalTest(name: string) {
    if (name !== undefined) this.name = name;
    this.test = [];
    return this;
  }
}
