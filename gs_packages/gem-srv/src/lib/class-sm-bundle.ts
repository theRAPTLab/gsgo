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

// uses types from t-script
import { EBundleType } from 'modules/../types/t-script.d'; // workaround to import as obj

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a SMCBundle */
class SM_Bundle implements ISMCBundle {
  name: string; // the name of the bundle, if any
  parent: string; // the name of parent bundle, if any
  type: EBundleType; // enum type (see t-script.d)
  script: TScriptUnit[]; // saved script
  text: string; // save script text
  // lifecycle programs (can be in multiple types)
  DEFINE: TOpcode[]; // allocation phase
  INIT: TOpcode[]; // initialize phase
  UPDATE: TOpcode[]; // UPDATE phase
  THINK: TOpcode[]; // THINK phase
  EXEC: TOpcode[]; // execution phase
  // global programs
  CONDITION: TRegcode[]; // conditionals
  // local conditions (one per bundle)
  TEST: TOpcode[]; // returns true or false
  CONSEQ: TOpcode[]; // run if true
  ALTER: TOpcode[]; // run if false
  // metadata
  tags: TBundleTags;
  symbols: TSymbolData;
  directives: TBundleDirectives;
  //
  _clone: number; // secret clone generation information
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(name?: string, type?: EBundleType) {
    if (typeof name === 'string') this.setName(name);
    if (type !== undefined) this.setType(type);
    else this.setType(EBundleType.INIT);
    //
    this.DEFINE = []; // allocate data structures (agents, features, modules)
    this.INIT = []; // initialize data structures (a,f,m)
    this.UPDATE = []; // UPDATE lifecycle (a,f,m)
    this.THINK = []; // THINK lifecycle (a,f,m)
    this.EXEC = []; // EXEC lifecycle (a,f,m)
    this.CONDITION = []; // global program
    this.TEST = []; // test function
    this.CONSEQ = []; // program
    this.ALTER = []; // program
    //
    this.tags = new Map();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** makes a bad copy of a bundle, ensuring only certain objects are recreated
   *  instead of referenced. This should only be used in very special technical
   *  cases */
  carelessClone(): SM_Bundle {
    const nbdl = new SM_Bundle();
    Object.assign(nbdl, this);
    nbdl.symbols = { ...nbdl.symbols }; // new wrapper
    const gen = this._clone || 0;
    nbdl._clone = gen + 1; // clone generation
    return nbdl;
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
  setTag(tagName: string, value: any) {
    this.tags.set(tagName, value);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getTag(tagName: string): any {
    return this.tags.get(tagName);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getSymbolData(type?: keyof TSymbolData): TSymbolData {
    if (type === 'keywords')
      return {
        error: {
          code: 'invalid',
          info: 'bundles do not contain keyword symbols'
        }
      };
    if (!this.symbols)
      return {
        error: {
          code: 'invalid',
          info: 'symbols are not defined in this bundle'
        }
      };
    if (type === undefined) return this.symbols;
    const sdata = this.symbols[type] as TSymbolData;
    if (!sdata)
      return {
        error: {
          code: 'invalid',
          info: `symbols.${type} does not exist in this bundle`
        }
      };
    return sdata;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  getSymbolDataNames(type?: keyof TSymbolData): string[] {
    const symbols = this.getSymbolData(type);
    if (symbols.error) return undefined;
    return [...Object.keys(symbols)];
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  saveScript(script: TScriptUnit[]) {
    const fn = 'saveScript:';
    if (!Array.isArray(script)) throw Error(`${fn} not a script`);
    if (script.length > 0 && !Array.isArray(script[0]))
      throw Error(`${fn} not a script`);
    this.script = script;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  saveText(text: string) {
    const fn = 'saveText:';
    if (typeof text !== 'string') throw Error(`not a scriptText?`);
    if (!text.trim()) console.warn(`${fn} empty text saved`);
    this.text = text;
  }

  /// BUNDLE INITIALIZERS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  initProgram() {
    this.DEFINE = [];
    return this;
  }
  initCondition() {
    this.TEST = [];
    this.CONSEQ = [];
    this.ALTER = [];
    return this;
  }
  initBlueprint(name: string) {
    if (name !== undefined) this.name = name;
    this.DEFINE = [];
    this.INIT = [];
    this.UPDATE = [];
    this.THINK = [];
    this.EXEC = [];
    return this;
  }
  initGlobalProgram(name: string) {
    if (name !== undefined) this.name = name;
    this.DEFINE = [];
    return this;
  }
  initGlobalCondition(key: string) {
    if (key !== undefined) this.name = key;
    this.CONDITION = [];
    return this;
  }
  initGlobalTest(name: string) {
    if (name !== undefined) this.name = name;
    this.TEST = [];
    return this;
  }
}

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SM_Bundle;
