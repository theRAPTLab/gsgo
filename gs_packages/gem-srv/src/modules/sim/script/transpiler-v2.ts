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
 *  scripts, or anything that isn't part of it */
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

/// SCRIPT UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: ensure that a script has the required blue directives. Does not
 *  modify original script */
function EnforceBlueprintPragmas(script: TScriptUnit[]): TScriptUnit[] {
  const MAP: { [key: string]: any } = {};
  const newScript = [];
  const statements = script.entries();

  // first scan for blueprint, insert if missing
  let [stmNum, stm] = statements.next().value;
  let [kw, pragmaType, pragmaKey, ...args] = TOKENIZER.UnpackStatement(stm);
  pragmaType = (pragmaType as string).toUpperCase();
  if (kw && kw !== '#' && pragmaType !== 'BLUEPRINT') {
    newScript.push(...TOKENIZER.TextToScript(`# BLUEPRINT Agent${Date.now()}`));
  }
  newScript.push(stm);

  // next scan for everything that is a directive at the top
  let scanTags = true;
  while (scanTags) {
    [stmNum, stm] = statements.next().value;
    [kw, pragmaType, pragmaKey, ...args] = TOKENIZER.UnpackStatement(stm);
    pragmaType = pragmaType || '';
    pragmaType = (pragmaType as string).toUpperCase();
    if ((kw && kw !== '#') || pragmaType !== 'TAG') {
      scanTags = false;
    } else {
      const pkey = pragmaType;
      if (MAP[pkey] === undefined) MAP[pkey] = {};
      const pdict = MAP[pkey];
      pdict[pragmaKey as string] = { stmNum, args };
      newScript.push(stm);
    }
  }
  // check that required directives are in place\
  const foundTags = { ...MAP.TAG };
  const reqTags = { ...SIMDATA.GetBundleTagSymbols() }; // make a copy to destroy
  Object.keys(foundTags).forEach(tag => {
    const hasTag = SIMDATA.IsBundleTagName(tag);
    if (hasTag) delete reqTags[tag];
  });
  // see if there are any non-deleted tags, and then shove them in.
  Object.keys(reqTags).forEach(key =>
    newScript.push(...TOKENIZER.TextToScript(`# TAG ${key} false`))
  );

  // add a blank line underneath
  newScript.push(...TOKENIZER.TextToScript(''));

  // check for required program directives
  // while writing the rest of the statements
  const needsProg = new Set(SIMDATA.GetBundleOutSymbols());
  let entry = statements.next().value;
  while (entry) {
    [stmNum, stm] = entry;
    let b, c;
    [kw, b, c] = TOKENIZER.UnpackStatement(stm);
    kw = kw || '';
    if (kw && kw === '#') {
      b = b || '';
      b = b.toUpperCase();
      c = c || '';
      c = c.toUpperCase();
      if (b === 'PROGRAM') needsProg.delete(c);
    }
    newScript.push(stm);
    entry = statements.next().value;
  }
  // add missing program directives at end of script
  needsProg.forEach(progType => {
    const slines = TOKENIZER.TextToScript(
      `// required directive\n# PROGRAM ${progType}`
    );
    newScript.push([{ line: '' }]);
    newScript.push(...slines);
  });
  // return the modified script
  return newScript;
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
    const bdl = SIMDATA.GetOrCreateBlueprintBundle(bpid);
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
/// from source text
export {
  CompileText, // compile a script text that IS NOT a blueprint
  ValidateLineText // return validation tokens for line
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: script manipulation utilities
export {
  EnforceBlueprintPragmas // make sure a script has required pragmas
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FORWARDED API: convert tokenized scripts into other useful forms
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
