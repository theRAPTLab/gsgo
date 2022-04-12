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
  TSymArg,
  TSValidType,
  TSymUnpackedArg
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
const VALID_ARGTYPES: TSValidType[] = [
  // see t-script.d "SYMBOL DATA AND TYPES"
  // these are used both for keyword args and method signature args
  'boolean',
  'string',
  'number',
  'enum',
  //
  'prop', // same as objref in some keywords
  'method',
  'gvar',
  'block',
  //
  'objref', // value of anobject ref
  'expr', // an expression that can be coerced to any type
  '{value}', // composite: literal, objref or expression
  //
  'pragma',
  'test',
  'program',
  'event',
  'feature',
  'blueprint',
  // placeholder keyword args for use in scriptunits
  '{...}'
];

/// KEYWORD UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of TSymbolArgType (or array of arrays TSymbolArgType)
 *  iterate through all the argument definitions and make sure they are
 *  valid syntax
 */
function ValidateArgs(args: TSymArg[]): boolean {
  const fn = 'ValidateArgs';
  if (!Array.isArray(args)) {
    console.warn(`${fn}: invalid argtype array`);
    return false;
  }
  for (const arg of args) {
    if (Array.isArray(arg)) return ValidateArgs(arg);
    if (typeof arg !== 'string') {
      console.warn(`${fn}: invalid argDef ${typeof arg}`);
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
      console.warn(`${fn}: missing argName in '${arg}'`);
      return false;
    }
    if (!VALID_ARGTYPES.includes(argType as TSValidType)) {
      console.warn(`${fn}: '${arg}' has invalid argtype`);
      return false;
    }
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a string 'arg' of form 'name:argType', return [name, argType] if the
 *  string meets type requirements, [undefined, undefined] otherwise
 */
function UnpackArg(arg: TSymArg): TSymUnpackedArg {
  if (typeof arg !== 'string') return [undefined, undefined];
  let [name, type, ...xtra] = arg.split(':') as TSymUnpackedArg;
  // if there are multiple :, then that is an error
  if (xtra.length > 0) return [undefined, undefined];
  if (!VALID_ARGTYPES.includes(type)) return [undefined, undefined];
  // a zero-length name is an error except for the
  // multi-argument {args} glob type
  if (name.length === 0) {
    if (type === '{...}') name = '**';
    else return [undefined, undefined];
  }
  // name and type are good, so return valid unpacked arg
  return [name, type];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterKeyword(Ctor: IKeywordCtor, key?: string) {
  const fn = 'RegisterKeyword:';
  const kobj = new Ctor();
  if (!ValidateArgs(kobj.args as TSymArg[]))
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
 *  CODE REVIEW: @Sri this predates the formal argtype system in t-script.d.ts, so
 *  it should be updated or removed
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
  UnpackArg,
  ValidateArgs,
  UtilDerefArg,
  UtilFirstValue
};
export {
  UnpackToken,
  IsValidToken,
  IsValidTokenType,
  TokenValue
} from 'script/tools/class-gscript-tokenizer-v2';
