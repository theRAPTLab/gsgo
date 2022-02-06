/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT TRANSPILER DATA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TSMCProgram,
  TScriptUnit,
  ISMCBundle,
  IKeyword,
  IKeywordCtor,
  TSymbolArgType
} from 'lib/t-script.d';
import { GetFunction } from './dc-named-methods';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCSCRP');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
const SCRIPTS: Map<string, TScriptUnit[]> = new Map();
const SCRIPT_EVENTS: Map<string, Map<string, TSMCProgram>> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VALID_ARGTYPES = [
  // see t-script.d TSymbolArgType
  'boolean',
  'string',
  'number',
  'expr',
  'objref',
  'anyref',
  'anyval',
  'args',
  'block',
  'test',
  'program',
  'event',
  'feature'
];

/// KEYWORD UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of TSymbolArgType  (or array of arrays TSymbolArgType)
 *  iterate through all the argument definitions and make sure they are
 *  valid syntax
 */
function ValidateArgTypes(args: TSymbolArgType[]): boolean {
  const P = 'ValidateArgTypes';
  if (!Array.isArray(args)) {
    console.warn(`${P}: invalid argtype array`);
    return false;
  }
  for (const arg of args) {
    if (Array.isArray(arg)) return ValidateArgTypes(arg);
    if (typeof arg !== 'string') {
      console.warn(`${P}: invalid argDef ${typeof arg}`);
      return false;
    }
    if (DBG)
      console.log(
        `%c${arg}%c passes arg check`,
        'font-weight:bold',
        'font-weight:normal'
      );
    const [argName, argType] = arg.split(':');
    if (argName.length === 0) {
      console.warn(`${P}: missing argName in '${arg}'`);
      return false;
    }
    if (!VALID_ARGTYPES.includes(argType)) {
      console.warn(`${P}: '${arg}' has invalid argtype`);
      return false;
    }
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** An argtype is of the form 'name:type', and is used for symbol definitions
 *  Returns the argName, argType in array if they are valid
 */
function DecodeArgType(arg: TSymbolArgType) {
  const P = 'ValidateArgType';
  if (typeof arg !== 'string')
    throw Error(`${P}: arg must be string, not ${typeof arg}`);
  const abits = (arg as string).split(':');
  if (abits.length > 2) throw Error(`${P}: too many : separators`);
  const [argName, argType] = abits;
  if (argName.length === 0) throw Error(`${P}: no argname`);
  if (!VALID_ARGTYPES.includes(argType)) throw Error(`${P}: bad type ${argType}`);
  // passed, so return the argument
  return [argName, argType];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterKeyword(Ctor: IKeywordCtor, key?: string) {
  const fn = 'RegisterKeyword:';
  const kobj = new Ctor();
  if (!ValidateArgTypes(kobj.args as TSymbolArgType[]))
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
  if (!SCRIPT_EVENTS.has(evtName)) SCRIPT_EVENTS.set(evtName, new Map());
  const subbedBPs = SCRIPT_EVENTS.get(evtName); // event->blueprint codearr
  if (!subbedBPs.has(bpName)) subbedBPs.set(bpName, []);
  // get the blueprint array for bpName, created if necessary
  const codearr = subbedBPs.get(bpName);
  if (typeof consq === 'function') codearr.push(consq);
  else codearr.push(...consq);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetScriptEventHandlers(evtName: string) {
  if (!SCRIPT_EVENTS.has(evtName)) SCRIPT_EVENTS.set(evtName, new Map());
  const subbedBPs = SCRIPT_EVENTS.get(evtName); // event->blueprint codearr
  const handlers = [];
  subbedBPs.forEach((handler, agentType) => {
    handlers.push({ agentType, handler });
  });
  return handlers;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteAllScriptEvents() {
  SCRIPT_EVENTS.clear();
}

/// SCRIPT UNITS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WIP centralized source manager */
function SaveScript(name: string, source: TScriptUnit[]): boolean {
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WIP centralized source deleter */
function DeleteScript(name: string): boolean {
  if (SCRIPTS.has(name)) {
    SCRIPTS.delete(name);
    return true;
  }
  console.warn(...PR(`source '${name}' doesn't exist`));
  return false;
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a program name [[progname]] might be passed, which needs to be dereferenced
 *  into a TSMCProgram stored in the FUNCTIONS table
 */
function UtilDerefArg(arg: any) {
  const type = typeof arg;
  if (type === 'number') return arg;
  if (type !== 'string') return arg;
  if (arg.substring(0, 2) !== '[[') return arg;
  if (arg.substring(arg.length - 2, arg.length) !== ']]') return arg;
  const progName = arg.substring(2, arg.length - 2).trim();
  const prog = GetFunction(progName);
  if (prog !== undefined) return prog;
  throw Error(`could not deference "${arg}" to named program "${progName}"`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UtilFirstValue(thing: any): any {
  if (Array.isArray(thing)) return thing.shift();
  return thing;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { BLUEPRINTS, KEYWORDS, SCRIPTS, SCRIPT_EVENTS };
export {
  RegisterKeyword,
  GetKeyword,
  GetAllKeywords,
  //
  SubscribeToScriptEvent,
  GetScriptEventHandlers,
  DeleteAllScriptEvents,
  //
  SaveScript,
  DeleteScript,
  UpdateScriptIndex,
  //
  SaveBlueprint,
  GetBlueprint,
  GetAllBlueprints,
  DeleteBlueprint,
  DeleteAllBlueprints,
  //
  DecodeArgType,
  ValidateArgTypes,
  UtilDerefArg,
  UtilFirstValue
};
