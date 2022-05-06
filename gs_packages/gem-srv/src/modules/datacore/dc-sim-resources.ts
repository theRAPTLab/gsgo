/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIMULATION RESOURCES

  Contains dictionaries of the active entities available to the simulation
  engine that determine its runtime state. Prior to this module, the
  dictionaries were scattered across separate datacore modules which made
  it hard to see the distinct systems we support in addition o the simulator

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  TSMCProgram,
  ISMCBundle,
  TScriptUnit,
  IFeature,
  IScopeableCtor,
  IToken,
  IKeyword,
  IKeywordCtor,
  TSymArg
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
  if (!CHECK.AreValidArgs(kobj.args as TSymArg[]))
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

/// SCRIPT EVENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Register an agentset to a particular handler. It's a TSMCProgram[] (an
 *  array of program arrays consisting of a stack of functions) that will
 *  get run when the EventHandler receives it.
 *  SCRIPT_EVENTS: Map<string, Map<string,TSMCProgram[]>> = new Map();
 *                eventName->Map(blueprintName)->TSMCProgram[]
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SubscribeToScriptEvent(
  evtName: string,
  bpName: string,
  consq: TSMCProgram
) {
  if (!EVENT_SCRIPTS.has(evtName)) EVENT_SCRIPTS.set(evtName, new Map());
  const subbedBPs = EVENT_SCRIPTS.get(evtName); // event->blueprint codearr
  if (!subbedBPs.has(bpName)) subbedBPs.set(bpName, []);
  // get the blueprint array for bpName, created if necessary
  const codearr = subbedBPs.get(bpName);
  if (typeof consq === 'function') codearr.push(consq);
  else codearr.push(...consq);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetScriptEventHandlers(evtName: string) {
  if (!EVENT_SCRIPTS.has(evtName)) EVENT_SCRIPTS.set(evtName, new Map());
  const subbedBPs = EVENT_SCRIPTS.get(evtName); // event->blueprint codearr
  const handlers = [];
  subbedBPs.forEach((handler, agentType) => {
    handlers.push({ agentType, handler });
  });
  return handlers;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllScriptEvents() {
  EVENT_SCRIPTS.clear();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// blueprints are stored as "bundles" by their name
export {
  SaveBlueprint,
  GetBlueprint,
  GetAllBlueprints,
  DeleteBlueprint,
  DeleteAllBlueprints
};
/// scriptable properties are called "gvars" and have constructors for each type
export { RegisterVarCTor, GetVarCtor, SymbolDefFor, GetAllVarCtors };
/// the transpiler is extendable using "keyword' modules that implement
/// symbolize, validate, and compile
export { RegisterKeyword, GetKeyword, GetAllKeywords };
/// engine maintains dicts of named Javascript functions
export { RegisterFunction, GetFunction };
/// engine maintain dicts of compiler script code (TSMCProgram)
export { RegisterProgram, GetProgram };
/// "when" conditions use programs that expect a certain input
export { RegisterTest, GetTest, DeleteAllTests };
/// extensions to the script engine capabilities are handled with "feature" modules
export {
  GetFeature,
  GetAllFeatures,
  GetFeatureMethod,
  RegisterFeature,
  DeleteAllFeatures
};
/// simulation triggers are managed through "script event" dicts
export { SubscribeToScriptEvent, GetScriptEventHandlers, DeleteAllScriptEvents };

/* exports from dc-script-engine that are no longer exported
export { BLUEPRINTS, KEYWORDS, SCRIPTS, SCRIPT_EVENTS };
  SaveScript,
  DeleteScript,
  UpdateScriptIndex,
  //
  UnpackArg,
  AreValidArgs,
  UtilDerefArg,
  UtilFirstValue
};
export {
  UnpackToken,
  IsValidToken,
  IsValidTokenType,
  TokenValue
} from 'script/tools/class-gscript-tokenizer-v2';
*/
