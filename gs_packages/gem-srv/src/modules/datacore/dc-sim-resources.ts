/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIMULATION RESOURCES

  Contains dictionaries of the active entities available to the simulation
  engine that determine its runtime state. Prior to this module, the
  dictionaries were scattered across separate datacore modules which made
  it hard to see the distinct systems we support in addition o the simulator

  BLUEPRINTS - the compiled bundles used to instance AGENTS
  KEYWORDS - the keyword modules used to transpile GEM-SCRIPT
  VARS - the scriptable variables (properties) in GEM-SCRIPT

  replaces
  - dc-script-engine  BLUEPRINTS, KEYWORDS, EVENTS
  - dc-varprops       now called SCRIPT_VARS
  - dc-named-methods  now called EVENT_SCRIPTS, TEST_SCRIPTS, NAMED_SCRIPTS
                      and NAMED_FUNCTIONS
  - dc-features       FEATURES

  adds
  - dc-type-checks    holds common compile- and run time type validators

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TSMCProgram,
  TScriptUnit,
  ISMCBundle,
  IFeature,
  IScopeableCtor,
  IKeyword,
  IKeywordCtor,
  TSymArg,
  TSValidType,
  TSymUnpackedArg
} from 'lib/t-script.d';
import * as CHECK from './dc-type-check';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const FEATURES: Map<string, IFeature> = new Map();
const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
const VARS: Map<string, IScopeableCtor> = new Map();
const EVENT_SCRIPTS: Map<string, Map<string, TSMCProgram>> = new Map();
const TEST_SCRIPTS: Map<string, TSMCProgram> = new Map();
const NAMED_SCRIPTS: Map<string, TSMCProgram> = new Map();
const NAMED_FUNCTIONS: Map<string, Function> = new Map();

/// FEATURES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Retrieve a feature module by name (as defined in the feature class)
 *  and return its instance
 */
function GetFeature(fName) {
  return FEATURES.get(fName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllFeatures() {
  return FEATURES;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve a method from a feature instance
 */
function GetFeatureMethod(fName: string, mName: string) {
  return GetFeature(fName)[mName];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Register a feature module by name (as defined in the feature class)
 */
function RegisterFeature(fpack) {
  FEATURES.set(fpack.name, fpack);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllFeatures() {
  FEATURES.clear();
}

/// BLUEPRINT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SaveBlueprint(bp: ISMCBundle) {
  const { name } = bp;
  // just overwrite it
  BLUEPRINTS.set(name, bp);
  return bp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBlueprint(name: string): ISMCBundle {
  name = name || 'default';
  const bdl = BLUEPRINTS.get(name);
  // if (!bdl) console.warn(`blueprint '${name}' does not exist`);
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllBlueprints() {
  const arr = [];
  const maps = [...BLUEPRINTS.values()];
  maps.forEach(map => {
    arr.push(map);
  });
  return arr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteBlueprint(name: string) {
  if (!BLUEPRINTS.has(name)) {
    console.warn(`trying to delete non-existent blueprint '${name}'`);
    return;
  }
  BLUEPRINTS.delete(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllBlueprints() {
  BLUEPRINTS.clear();
}

/// KEYWORDS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterKeyword(Ctor: IKeywordCtor, key?: string) {
  const fn = 'RegisterKeyword:';
  const kobj = new Ctor();
  if (!CHECK.ValidateArgs(kobj.args as TSymArg[]))
    throw Error(`${fn} invalid argDef in keyword '${kobj.keyword}'`);
  KEYWORDS.set(key || kobj.keyword, kobj);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetKeyword(name: string): IKeyword {
  return KEYWORDS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllKeywords() {
  const arr = [];
  KEYWORDS.forEach((value, key) => {
    arr.push(key);
  });
  return arr;
}

/// VALUE TYPE UTILITIES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a SMObject, store in VARS dict */
function RegisterVarCTor(name: string, ctor) {
  if (VARS.has(name)) throw Error(`RegisterVarCTor: ${name} exists`);
  VARS.set(name, ctor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get the registered SMObject constructor by name */
function GetVarCtor(name: string): IScopeableCtor {
  if (!VARS.has(name)) throw Error(`GetVarCtor: ${name} `);
  return VARS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAllVarCtors(): Map<string, IScopeableCtor> {
  return VARS;
}

/// SYMBOL UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return symbol data for a given gvar */
function SymbolDefFor(name: string) {
  const def = VARS.get(name);
  if (def) return def.Symbols;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns true if test was saved for the first time, false otherwise */
function RegisterTest(name: string, program: TSMCProgram): boolean {
  // if (TESTS.has(name)) throw Error(`RegisterTest: ${name} exists`);
  const newRegistration = !TEST_SCRIPTS.has(name);
  TEST_SCRIPTS.set(name, program);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetTest(name: string): TSMCProgram {
  return TEST_SCRIPTS.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllTests() {
  TEST_SCRIPTS.clear();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterProgram(name: string, program: TSMCProgram) {
  if (NAMED_SCRIPTS.has(name)) throw Error(`RegisterProgram: ${name} exists`);
  NAMED_SCRIPTS.set(name, program);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetProgram(name: string): TSMCProgram {
  return NAMED_SCRIPTS.get(name);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterFunction(name: string, func: Function): boolean {
  const newRegistration = !NAMED_FUNCTIONS.has(name);
  NAMED_FUNCTIONS.set(name, func);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetFunction(name: string): Function {
  let f = NAMED_FUNCTIONS.get(name);
  // return always random results if the test doesn't exist
  if (!f) f = () => Math.random() > 0.5;
  return f;
}

/// DEPRECATED - MOVE TO FEAT VISION //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Returns the SCALED bounding rect of the agent
export function GetAgentBoundingRect(agent) {
  // Based on costume
  if (!agent.hasFeature('Costume'))
    throw new Error(
      `GetAgentBoundingRect: Tried to use vision on an agent with no costume ${agent.id}`
    );
  const { w, h } = agent.callFeatMethod('Costume', 'getScaledBounds');
  const halfw = w / 2;
  const halfh = h / 2;
  return [
    { x: agent.x - halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y + halfh },
    { x: agent.x - halfw, y: agent.y + halfh }
  ];
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SaveBlueprint,
  GetBlueprint,
  GetAllBlueprints,
  DeleteBlueprint,
  DeleteAllBlueprints
};
export { RegisterVarCTor, GetVarCtor, SymbolDefFor, GetAllVarCtors };
export { RegisterKeyword, GetKeyword, GetAllKeywords };
export { RegisterFunction, GetFunction };
export { RegisterProgram, GetProgram };
export { RegisterTest, GetTest, DeleteAllTests };
export { GetFeature, GetAllFeatures, RegisterFeature, DeleteAllFeatures };
