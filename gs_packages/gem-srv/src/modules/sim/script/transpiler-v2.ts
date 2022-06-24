/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TRANSPILER is the main API for managing the SIMULATION ENGINE's scriptable
  AGENTS. It exposes the various elements of the script engine that affect
  the simulator, which is controlled via the `api-sim` module.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import SM_Bundle from 'lib/class-sm-bundle';
import { EBundleType } from 'modules/../types/t-script.d'; // workaround to import as obj

import SM_Agent from 'lib/class-sm-agent';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

// critical imports
import 'script/keywords/_all_keywords';

// tooling imports
import * as TOKENIZER from 'script/tools/script-tokenizer';
import * as COMPILER from 'script/tools/script-compiler';
import * as SYMBOLUTILS from 'script/tools/symbol-utilities';
import { DEBUG_FLAGS } from 'config/dev-settings';
const { SYMBOLIZE_CALLS: DBG_SC } = DEBUG_FLAGS;

// dummy to import symbol-utilities otherwise it gets treeshaken out
SYMBOLUTILS.BindModule();

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRANSPILE', 'TagDebug');
const DBG = false;

/// BLUEPRINT UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a bundle, ensure it's the right type and save it to the
 *  bundle dictionary
 */
function RegisterBlueprint(bdl: SM_Bundle): SM_Bundle {
  // ensure that bundle has at least a define and name
  if (bdl.type === EBundleType.INIT) {
    return undefined;
  }
  if (bdl.DEFINE && bdl.type === EBundleType.BLUEPRINT) {
    if (DBG) console.group(...PR(`SAVING BLUEPRINT for ${bdl.name}`));
    // First deregister the blueprint if it exists
    // RemoveGlobalCondition(bdl.name); // deprecatd in script-xp
    SIMDATA.SaveBlueprintBundle(bdl);
    if (DBG) console.groupEnd();
    return bdl;
  }
  console.log(bdl);
  throw Error('not blueprint');
}

/// SCRIPT TEXT UTILITIES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a source text and return compiled TSM_Method. Similar to
 *  CompileBlueprint but does not handle directives or build a bundle. Used
 *  for generating code snippets from any GEMSCRIPT text (e.g. for init
 *  scripts, or anything that isn't part of the
 */
function CompileText(text: string, refs: TSymbolRefs): TSMCProgram {
  const script = TOKENIZER.TextToScript(text);
  return COMPILER.CompileScript(script, refs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Given a lineScript in text form and a bundle with symbols, validate it */
function ValidateLineText(line: string, bdl: SM_Bundle): TValidatedScriptUnit {
  const [lineScript] = TOKENIZER.TextToScript(line);
  const vtoks = COMPILER.ValidateStatement(lineScript, {
    bundle: bdl,
    globals: {}
  });
  return vtoks;
}

/// AGENT UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: "Make" an agent using an instance definitions, which adds the new
 *  instance to the simulation engine data
 */
function MakeAgent(instanceDef: TInstanceDef) {
  const fn = 'MakeAgent:';
  const { id, bpid, label } = instanceDef;
  const agent = new SM_Agent(label, String(id));
  // handle extension of base agent
  // TODO: instanceDefs should reflect the changes in merge #208
  if (typeof bpid === 'string') {
    if (DBG_SC)
      console.warn(
        `${fn} making %c${bpid} id:${id} `,
        'font-style:bold;color:black'
      );
    const bdl = SIMDATA.GetBlueprintBundle(bpid);
    if (!bdl) throw Error(`agent blueprint for '${bpid}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bdl);
    return SIMAGENTS.SaveAgent(agent);
  }
  throw Error(
    `${fn} bad blueprint name ${JSON.stringify(
      bpid
    )} in instanceDef ${JSON.stringify(instanceDef)}`
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveAgent(instanceDef: TInstanceDef) {
  SIMAGENTS.DeleteAgent(instanceDef);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: These methods make new agents from registered blueprints that are
/// created by CompileBlueprint()
export {
  MakeAgent, // BlueprintName => Agent
  RemoveAgent,
  RegisterBlueprint
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: These methods are related to transpiling GEMSCRIPT
/// from source text and
export {
  CompileText, // compile a script text that IS NOT a blueprint
  ValidateLineText // return validation tokens for line
};
export {
  DecodeTokenPrimitive, // utility: to convert a scriptToken into runtime data
  DecodeToken, // utility: with DecodeTokenPrimitive, converts a token into runtime entity
  DecodeStatement, // utility: works with DecodeToken to create runtime enties
  SymbolizeStatement, // utility: extract symbols defined by a keyword
  ValidateStatement, // utility: check script tokens against symbols
  ValidateExpression, // utility: see if expression can access stuff
  //
  CompileScript, // API: return a TSMCProgram from a script text
  ExtractBlueprintMeta, // API: return directives from script text
  //
  CompileBlueprint, // API: save a blueprint script as a bundle with program output
  SymbolizeBlueprint // API: save blueprint symbols to a bundle
} from 'script/tools/script-compiler';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FORWARDED API: convert text to tokenized scripts
export {
  TextToScript, // text w/ newlines => TScriptUnit[]
  StringToLineScript, // single-line string => TScriptUnit
  ScriptToText, // TScriptUnit[] => produce source text from units
  TokenToString, // for converting a token to its text representation
  StatementToText // convert scriptUnit[] to text
} from 'script/tools/script-tokenizer';
/// DEPRCECATED API: convert tokenized script into a React representation
export {
  ScriptToJSX // TScriptUnit[] => jsx
} from 'script/tools/script-to-jsx';
/// FORWARDED API: convert tokenized script to React-renderable data structures
export {
  ScriptToLines, // converts script into a viewmodel suitable for rendering as lines
  ScriptToEditableTokens, // script to editable token list
  ScriptPageToEditableTokens, // script_page to editable token list
  EditableTokensToScript // pack editable token list back into script
} from 'script/tools/script-to-lines';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEPRECATED API: these are routines that extract these values using brute
/// force techniques before the compiler generated this information for us
export {
  ExtractBlueprintProperties,
  ExtractBlueprintPropertiesMap,
  ExtractBlueprintPropertiesTypeMap,
  ExtractFeaturesUsed,
  ExtractFeatPropMapFromScript,
  ExtractFeatPropMap
} from 'script/tools/script-extraction-utilities';
