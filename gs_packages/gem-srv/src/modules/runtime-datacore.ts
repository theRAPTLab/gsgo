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
  IAgent,
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
const AGENTS: Map<string, Map<any, IAgent>> = new Map(); // blueprint => Map<id,Agent>
const AGENT_DICT: Map<any, IAgent> = new Map(); // id => Agent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VAR_DICT: Map<string, IScopeableCtor> = new Map();
const FEATURES: Map<string, IFeature> = new Map();
const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
const SCRIPTS: Map<string, TScriptUnit[]> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CONDITIONS: Map<string, TSMCProgram> = new Map();
const FUNCTIONS: Map<string, Function> = new Map();
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
  console.log('saving', bp.name);
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
/** save agent by type into agent map, which contains weaksets of types
 *  AGENTS has instances by blueprint name, which is a Map of agents
 *  AGENT_DICT has instances by id
 */
export function SaveAgent(agent) {
  const { id, blueprint } = agent;
  const name = blueprint.name;
  //
  if (!AGENTS.has(name)) AGENTS.set(name, new Map());
  const agents = AGENTS.get(name);
  if (agents.has(id)) throw Error(`agent id ${id} already in ${name} list`);
  // save the agent
  agents.set(id, agent);
  // also save the id global lookup table
  if (AGENT_DICT.has(id)) throw Error(`agent id ${id} already in global dict`);
  AGENT_DICT.set(id, agent);
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agent set by type */
export function GetAgentsByType(bpName) {
  const agentSet = AGENTS.get(bpName);
  if (!agentSet) {
    console.warn(...PR(`agents of '${bpName}' don't exist...yet?`));
    return [];
  }
  return [...agentSet.values()];
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
export function AddGlobalCondition(sig: string, condprog: TSMCProgram) {
  if (!CONDITIONS.has(sig)) CONDITIONS.set(sig, []);
  const master = CONDITIONS.get(sig);
  // add all the instructions from conditional program to the master
  master.push(...condprog);
  console.log(...PR(`saved condition '${sig}' (has ${master.length} opcodes)`));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetGlobalCondition(sig: string) {
  const master = CONDITIONS.get(sig);
  console.log(...PR(`getting condition '${sig}' (has ${master.length} opcodes)`));
  return master;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllGlobalConditions() {
  const conditions = CONDITIONS.entries();
  return conditions;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllGlobalConditions() {
  CONDITIONS.clear();
}

/// TEST UTILITIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterFunction(name: string, func: Function): boolean {
  const newRegistration = !FUNCTIONS.has(name);
  FUNCTIONS.set(name, func);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetFunction(name: string): Function {
  let f = FUNCTIONS.get(name);
  // return always random results if the test doesn't exist
  if (!f) f = () => Math.random() > 0.5;
  return f;
}
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

/// SET FILTERING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Durstenfeld Shuffle (shuffles in-place)
 *  also see:
 *  en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
 *  stackoverflow.com/a/12646864/2684520
 *  blog.codinghorror.com/the-danger-of-naivete/
 */
export function ShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return agents of type AgentType that pass test
 *  test looks like (agent)=>boolean
 *  FUTURE OPTIMIZATION will cache the results based on key
 */
export function SingleAgentFilter(type: string, testA: string) {
  const agents = GetAgentsByType(type);
  const testFunc = GetFunction(testA);
  ShuffleArray(agents);
  const pass = [];
  const fail = [];
  agents.forEach(agent => {
    if (testFunc(agent)) pass.push(agent);
    else fail.push(agent);
  });
  return [pass, fail];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return pairs of agents the pass testAB
 *  test looks like (agentA, agentB)=>boolean
 */
export function PairAgentFilter(typeA: string, typeB: string, testAB: string) {
  const setA = GetAgentsByType(typeA);
  const setB = GetAgentsByType(typeB);
  const testFunc = GetFunction(testAB);
  ShuffleArray(setA);
  ShuffleArray(setB);
  const pass = [];
  const fail = [];
  setA.forEach(a =>
    setB.forEach(b => {
      if (testFunc(a, b)) pass.push([a, b]);
      else fail.push([a, b]);
    })
  );
  return [pass, fail];
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
# BLUEPRINT Bee
# DEFINE
addProp frame Number 3
useFeature Movement
prop skin 'bunny.json'
# UPDATE
featureCall Movement jitterPos -5 5
# CONDITION
when Bee sometest [[
  // dbgOut SingleTest
]]
when Bee sometest Bee [[
  dbgOut PairTest
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
