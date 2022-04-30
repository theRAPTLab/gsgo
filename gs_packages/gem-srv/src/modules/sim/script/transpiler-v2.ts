/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TRANSPILER is the main API for managing the SIMULATION ENGINE's scriptable
  AGENTS. It exposes the various elements of the script engine that affect
  the simulator, which is controlled via the `api-sim` module.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GAgent from 'lib/class-gagent';
import SM_Bundle from 'lib/class-sm-bundle';
import { TSMCProgram, TInstance, EBundleType } from 'lib/t-script.d';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';
import * as DCENGINE from 'modules/datacore/dc-sim-resources';

// critical imports
import 'script/keywords/_all_keywords';

// tooling imports
import * as DECOMPILER from 'script/tools/text-to-script';
import * as COMPILER from 'script/tools/script-compiler';
import * as SYMBOLHELPERS from 'script/tools/symbol-helpers';

// dummy to import symbol-utilities otherwise it gets treeshaken out
SYMBOLHELPERS.BindModule();

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRANSPILE', 'TagDebug');
//
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a source text and return compiled TMethod. Similar to
 *  CompileBlueprint but does not handle directives or build a bundle. Used
 *  for generating code snippets from any GEMSCRIPT text (e.g. for init
 *  scripts, or anything that isn't part of the
 */
function CompileText(text: string = ''): TSMCProgram {
  const script = DECOMPILER.TextToScript(text);
  return COMPILER.CompileScript(script);
}

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterBlueprint(bdl: SM_Bundle): SM_Bundle {
  // ensure that bundle has at least a define and name
  if (bdl.type === EBundleType.INIT) {
    return undefined;
  }
  if (bdl.define && bdl.type === EBundleType.BLUEPRINT) {
    if (DBG) console.group(...PR(`SAVING BLUEPRINT for ${bdl.name}`));
    // First deregister the blueprint if it exists
    // RemoveGlobalCondition(bdl.name); // deprecatd in script-xp
    DCENGINE.SaveBlueprint(bdl);
    // run conditional programming in template
    // this is a stack of functions that run in global context
    // initialize global programs in the bundle
    // const { condition, event } = bdl.getPrograms();
    // AddGlobalCondition(bdl.name, condition); // deprecated in script-xp branch
    if (DBG) console.groupEnd();
    return bdl;
  }
  console.log(bdl);
  throw Error('not blueprint');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to make an Agent. This has to be done in a module outside of
 *  dc-sim-agents, because datacore modules must be pure definition
 */
function MakeAgent(instanceDef: TInstance) {
  const fn = 'MakeAgent:';
  const { bpid, label } = instanceDef;
  const agent = new GAgent(label, String(instanceDef.id));
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (typeof bpid === 'string') {
    const bdl = DCENGINE.GetBlueprint(bpid);
    if (!bdl) throw Error(`agent blueprint for '${bpid}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bdl);
    return DCAGENTS.SaveAgent(agent);
  }
  throw Error(
    `${fn} bad blueprint name ${JSON.stringify(
      bpid
    )} in instanceDef ${JSON.stringify(instanceDef)}`
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveAgent(instanceDef: TInstance) {
  DCAGENTS.DeleteAgent(instanceDef);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: These methods are related to transpiling GEMSCRIPT
/// from source text and
export {
  CompileText // compile a script text that IS NOT a blueprint
};
export {
  CompileScript, // API: return a TSMCProgram from a script text
  CompileBlueprint, // API: return a blueprint bundle from a blueprint text
  DecodeTokenPrimitive, // utility: to convert a scriptToken into runtime data
  DecodeToken, // utility: with DecodeTokenPrimitive, converts a token into runtime entity
  UnpackToken, // utility: more useful version of DecodeToken
  DecodeStatement, // utility: works with DecodeToken to create runtime enties
  SymbolizeStatement, // utility: extract symbols defined by a keyword
  ValidateStatement // utility: check script tokens against symbols
} from 'script/tools/script-compiler';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: These methods make new agents from registered blueprints that are
/// created by CompileBlueprint()
export {
  RegisterBlueprint, // TScriptUnit[] => ISM_Bundle
  MakeAgent, // BlueprintName => Agent
  RemoveAgent
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FORWARDED API: convert text to tokenized scripts
export {
  TextToScript // text w/ newlines => TScriptUnit[]
} from 'script/tools/text-to-script';
/// FORWARDED API: converts tokenized scripts, scriptTokens to text representation
export {
  ScriptToText, // TScriptUnit[] => produce source text from units
  TokenToString, // for converting a token to its text representation
  StatementToText // convert scriptUnit[] to text
} from 'script/tools/script-to-text';
/// DEPRCECATED API: convert tokenized script into a React representation
export {
  ScriptToJSX // TScriptUnit[] => jsx
} from 'script/tools/script-to-jsx';
/// FORWARDED API: convert tokenized script to React-renderable data structures
export {
  ScriptToLines, // converts script into a viewmodel suitable for rendering as lines
  LINE_START_NUM // either 0 or 1, read to modify index
} from 'script/tools/script-to-lines';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEPRECATED API: these are routines that extract these values using brute
/// force techniques before the compiler generated this information for us
export {
  ExtractBlueprintName,
  ExtractBlueprintProperties,
  ExtractBlueprintPropertiesMap,
  ExtractBlueprintPropertiesTypeMap,
  ExtractFeaturesUsed,
  ExtractFeatPropMapFromScript,
  ExtractFeatPropMap,
  HasDirective
} from 'script/tools/script-extraction-utilities';
