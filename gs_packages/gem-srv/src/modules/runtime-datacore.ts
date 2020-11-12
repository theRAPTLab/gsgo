/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Simulation Data is a pure data module that can be included anywhere
  to access global data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import PixiTextureMgr from 'lib/class-pixi-asset-mgr';
import {
  IScopeableCtor,
  IFeature,
  TMethod,
  ISMCBundle,
  IKeyword,
  IKeywordCtor
} from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RUNTIME-CORE', 'TagRed');

/// DATA STORAGE MAPS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AGENTS = new Map(); // blueprint => Map<id,Agent>
const AGENT_DICT = new Map(); // id => Agent
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SMO_DICT: Map<string, IScopeableCtor> = new Map();
const FEATURES: Map<string, IFeature> = new Map();
const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CONDITIONS: Map<string, TMethod> = new Map();
const TESTS: Map<string, TMethod> = new Map();
const PROGRAMS: Map<string, TMethod> = new Map();
const ASSET_MGR = new PixiTextureMgr();

/// ASSET LOADING API METHODS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const GetAsset = ASSET_MGR.getAsset;
export const GetAssetById = ASSET_MGR.getAssetById;
export const LoadAssets = ASSET_MGR.loadManifest;

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
export function RegisterValueCTor(name: string, ctor: IScopeableCtor) {
  if (SMO_DICT.has(name)) throw Error(`RegisterValueCTor: ${name} exists`);
  SMO_DICT.set(name, ctor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get the registered SMObject constructor by name */
export function GetValueCtor(name: string): IScopeableCtor {
  if (!SMO_DICT.has(name)) throw Error(`GetValueCtor: ${name} `);
  return SMO_DICT.get(name);
}

/// BLUEPRINT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SaveBlueprint(bp: ISMCBundle) {
  const { name } = bp;
  if (BLUEPRINTS.has(name))
    console.warn(...PR(`overwriting blueprint '${name}'`));
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
export function RegisterTest(name: string, f_or_smc: TMethod) {
  if (TESTS.has(name)) throw Error(`RegisterTest: ${name} exists`);
  TESTS.set(name, f_or_smc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetTest(name: string): TMethod {
  if (!TESTS.has(name)) {
    console.log(...PR(`test '${name}' doesn't exist`));
  } else return TESTS.get(name);
}

/// PROGRAM UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterProgram(name: string, f_or_smc: TMethod) {
  if (PROGRAMS.has(name)) throw Error(`RegisterProgram: ${name} exists`);
  PROGRAMS.set(name, f_or_smc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetProgram(name: string): TMethod {
  if (!PROGRAMS.has(name)) {
    console.log(...PR(`program '${name}' doesn't exist`));
  } else return PROGRAMS.get(name);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for erasing data structures
UR.SystemHook('SIM/RESET', () => {});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for exported functions
/// expose maps and managers
export { AGENTS, BLUEPRINTS, FEATURES, CONDITIONS };
