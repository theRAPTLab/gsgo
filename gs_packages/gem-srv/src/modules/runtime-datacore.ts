/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

  IMPORTANT:
  Do not import other modules into here unless you are absolutely
  sure it will not create a circular dependency!
  This module is intended to be "pure" so any module can import
  it and access its

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  IScopeableCtor,
  IFeature,
  TOpcode,
  TSMCProgram,
  TScriptUnit,
  ISMCBundle,
  EBundleType,
  IKeyword,
  IKeywordCtor
} from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCORE', 'TagRed');

/// valid keys are defined in ISMCBundle, and values indicate the
/// context that these program
const BUNDLE_CONTEXTS = [
  'define',
  'init',
  'update',
  'think',
  'exec',
  'condition',
  'test',
  'conseq',
  'alter'
];

/// GLOBAL DATACORE STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let BUNDLE_OUT = 'define';

/// DATA STORAGE MAPS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AGENTS = new Map(); // blueprint => Map<id,Agent>
const AGENT_DICT = new Map(); // id => Agent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VAR_DICT: Map<string, IScopeableCtor> = new Map();
const FEATURES: Map<string, IFeature> = new Map();
const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
const SCRIPTS: Map<string, TScriptUnit[]> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CONDITIONS: Map<string, TSMCProgram> = new Map();
const TESTS: Map<string, TSMCProgram> = new Map();
const PROGRAMS: Map<string, TSMCProgram> = new Map();
const TEST_RESULTS: Map<string, { passed: any[]; failed: any[] }> = new Map();

/// KEYWORD UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterKeyword(Ctor: IKeywordCtor) {
  const kobj = new Ctor();
  KEYWORDS.set(kobj.keyword, kobj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetKeyword(name: string): IKeyword {
  return KEYWORDS.get(name);
}

/// VALUE TYPE UTILITIES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a SMObject, store in VARTYPES */
export function RegisterVarCTor(name: string, ctor: IScopeableCtor) {
  if (VAR_DICT.has(name)) throw Error(`RegisterVarCTor: ${name} exists`);
  VAR_DICT.set(name, ctor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get the registered SMObject constructor by name */
export function GetVarCtor(name: string): IScopeableCtor {
  if (!VAR_DICT.has(name)) throw Error(`GetVarCtor: ${name} `);
  return VAR_DICT.get(name);
}

/// SCRIPT UNITS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WIP centralized source manager */
export function SaveScript(name: string, source: TScriptUnit[]): boolean {
  if (SCRIPTS.has(name)) console.warn(...PR(`overwriting source '${name}'`));
  if (!Array.isArray(source)) {
    console.warn(...PR(`SaveScript: '${name}' source must be array`));
    return false;
  }
  SCRIPTS.set(name, source);
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WIP centralized source updater */
function UpdateScriptIndex(name: string, i: number, u: TScriptUnit): boolean {
  const source = SCRIPTS.get(name);
  try {
    if (!source) throw Error(`'${name}' doesn't exist`);
    if (typeof i !== 'number') throw Error(`index must be number, not ${i}`);
    if (i < 0 || i > u.length) throw Error(`index ${i} out of range`);
  } catch (e) {
    console.warn(...PR(e));
    return false;
  }
  source[i] = u;
  return true;
}
export { UpdateScriptIndex };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WIP centralized source deleter */
export function DeleteScript(name: string): boolean {
  if (SCRIPTS.has(name)) {
    SCRIPTS.delete(name);
    return true;
  }
  console.warn(...PR(`source '${name}' doesn't exist`));
  return false;
}

/// BLUEPRINT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SaveBlueprint(bp: ISMCBundle) {
  console.log('saving', bp);
  const { name } = bp;
  // just overwrite it
  BLUEPRINTS.set(name, bp);
  return bp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetBlueprint(name: string): ISMCBundle {
  name = name || 'default';
  const bdl = BLUEPRINTS.get(name);
  if (!bdl) console.warn(`blueprint '${name}' does not exist`);
  return bdl;
}

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** save agent by type into agent map, which contains weaksets of types */
export function SaveAgent(agent) {
  const { id, blueprint } = agent;
  const type = blueprint.name;
  if (!AGENTS.has(type)) AGENTS.set(type, new Map());
  // agents is a Map of agents
  const agents = AGENTS.get(type);
  // retrieve the set
  if (agents.has(id)) throw Error(`agent id ${id} already in ${type} list`);
  agents.set(id, agent);
  // also save the id global lookup table
  if (AGENT_DICT.has(id)) throw Error(`agent id ${id} already in global dict`);
  AGENT_DICT.set(id, agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set by type */
export function GetAgentsByType(bpType) {
  const agentSet = AGENTS.get(bpType);
  if (agentSet) return [...agentSet.values()];
  console.warn(...PR(`agents of '${bpType}' don't exist`));
  return [];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAgentById(id) {
  const agent = AGENT_DICT.get(id);
  if (agent) return agent;
  console.warn(...PR(`agent ${id} not in AGENT_DICT`));
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllAgents() {
  const arr = [];
  const maps = [...AGENTS.values()];
  maps.forEach(map => {
    arr.push(...map.values());
  });
  return arr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllAgents() {
  AGENTS.clear();
}

/// CONDITION UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SaveCondition(condition) {
  console.log('unimplemented; got', condition);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetCondition(signature) {
  console.log('unimplemented; got', signature);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllConditions() {
  const conditions = CONDITIONS.entries();
  return [...conditions];
}

/// TEST UTILITIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns true if test was saved for the first time, false otherwise */
export function RegisterTest(name: string, program: TSMCProgram): boolean {
  // if (TESTS.has(name)) throw Error(`RegisterTest: ${name} exists`);
  const newRegistration = !TESTS.has(name);
  TESTS.set(name, program);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetTest(name: string): TSMCProgram {
  return TESTS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllTests() {
  TESTS.clear();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function MakeTestResultKey(...args: string[]) {
  if (!Array.isArray(args)) args = [args];
  return `TK_${args.join(':')}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SaveTestResults(key: string, passed: any[], failed: any[]) {
  TEST_RESULTS.set(key, { passed, failed });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetTestResults(key: string) {
  return TEST_RESULTS.get(key) || { passed: [], failed: [] };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function PurgeTestResults() {
  TEST_RESULTS.clear();
}

/// PROGRAM UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterProgram(name: string, program: TSMCProgram) {
  if (PROGRAMS.has(name)) throw Error(`RegisterProgram: ${name} exists`);
  PROGRAMS.set(name, program);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetProgram(name: string): TSMCProgram {
  return PROGRAMS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function IsValidBundleProgram(name: string): boolean {
  return BUNDLE_CONTEXTS.includes(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the passed bundle string is valid */
export function IsValidBundleType(type: EBundleType) {
  return Object.values(EBundleType).includes(type as any);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the datacore global var BUNDLE_OUT to name, which tells the
 *  AddToBundle(bdl,prog) call where the program should be added
 */
export function SetBundleOut(name: string): boolean {
  if (IsValidBundleProgram(name)) {
    BUNDLE_OUT = name;
    return true;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** main API for add a program to a bundle. It does not check the bundle
 *  type because it may not have been set yet.
 */
export function AddToBundle(bdl: ISMCBundle, prog: TOpcode[]) {
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[BUNDLE_OUT]) bdl[BUNDLE_OUT] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${BUNDLE_OUT}]`);
  bdl[BUNDLE_OUT].push(...prog);
}

/// DEFAULT TEXT FOR SCRIPT TESTING ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT_TEXT = `
# BLUEPRINT Bee Agent
# DEFINE
addProp frame Number 2
useFeature Movement
prop skin 'bunny.json'
# CONDITION
addTest BunnyTest [[
  propMethod y gt 1000
  dbgStack
]]
# UPDATE
featureCall Movement jitterPos -5 5
ifTest [[ BunnyTest ]] {{ agent.prop('x').setTo(global.LibMath.sin(global._frame()/10)*100) }}
// condition test 2
ifExpr {{ global.LibMath.random() < 0.01 }} {{ agent.prop('y').setTo(100) }} {{ agent.prop('y').setTo(-100) }}
ifProg [[ BunnyTest ]] [[
  propMethod x setTo 100
  propMethod y setTo 100
]] [[
  propMethod x setTo -100
  propMethod y setTo -100
]]
`;
export function GetDefaultText() {
  return DEFAULT_TEXT;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for erasing data structures
UR.SystemHook('SIM/RESET', () => {});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exported functions
/// expose maps and managers
export { AGENTS, KEYWORDS, BLUEPRINTS, FEATURES, CONDITIONS, TEST_RESULTS };
