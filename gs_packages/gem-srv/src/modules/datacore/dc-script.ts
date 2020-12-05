/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SCRIPT TRANSPILER DATA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TSMCProgram,
  TScriptUnit,
  ISMCBundle,
  IKeyword,
  IKeywordCtor
} from 'lib/t-script.d';
import { GetFunction } from './dc-programs';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCSCRP', 'TagRed');

const BLUEPRINTS: Map<string, ISMCBundle> = new Map();
const KEYWORDS: Map<string, IKeyword> = new Map();
const SCRIPTS: Map<string, TScriptUnit[]> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SCRIPT_EVENTS: Map<string, Map<string, TSMCProgram>> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

/// SCRIPT EVENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Register an agentset to a particular handler. It's a TSMCProgram[] (an
 *  array of program arrays consisting of a stack of functions) that will
 *  get run when the EventHandler receives it.
 *  SCRIPT_EVENTS: Map<string, Map<string,TSMCProgram[]>> = new Map();
 *                eventName->Map(blueprintName)->TSMCProgram[]
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SubscribeToScriptEvent(
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
export function GetScriptEventHandlers(evtName: string) {
  if (!SCRIPT_EVENTS.has(evtName)) SCRIPT_EVENTS.set(evtName, new Map());
  const subbedBPs = SCRIPT_EVENTS.get(evtName); // event->blueprint codearr
  const handlers = [];
  subbedBPs.forEach((handler, agentType) => {
    handlers.push({ agentType, handler });
  });
  return handlers;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllScriptEvents() {
  SCRIPT_EVENTS.clear();
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a program name [[progname]] might be passed, which needs to be dereferenced
 *  into a TSMCProgram stored in the FUNCTIONS table
 */
export function UtilDerefArg(arg: any) {
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
export function UtilFirstValue(thing: any): any {
  if (Array.isArray(thing)) return thing.shift();
  return thing;
}
