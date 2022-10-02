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
import ERROR from 'modules/error-mgr';

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
  // try {
  const [lineScript] = TOKENIZER.TextToScript(line);
  const vtoks = COMPILER.ValidateStatement(lineScript, {
    bundle: bdl,
    globals: {}
  });
  return vtoks;
  // } catch (caught) {
  //   ERROR(`could not validate text string`, {
  //     source: 'validator',
  //     data: {
  //       line,
  //       bundle: bdl
  //     },
  //     where: 'transpiler.ValidateLineText',
  //     caught
  //   });
  // }
}

/// SCRIPT UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: ensure that a script has the required blue directives. Does not
 *  modify original script */
function EnforceBlueprintPragmas(script: TScriptUnit[]): TScriptUnit[] {
  const TAGMAP: { [key: string]: any } = {};
  const newScript = [];

  // first scan for blueprint, insert if missing
  /* SETUP **/ const statements = script.entries();
  /* READ ***/ let [stmNum, stm] = statements.next().value;
  let [kw, pragmaType, pragmaKey, ...args] = TOKENIZER.UnpackStatement(stm);
  pragmaType = (pragmaType as string).toUpperCase();
  if (kw && kw !== '#' && pragmaType !== 'BLUEPRINT') {
    newScript.push(...TOKENIZER.TextToScript(`# BLUEPRINT Agent${Date.now()}`));
  }
  newScript.push(stm);
  // next scan for everything that is a directive at the top
  let scanTags = true;
  let entry;
  while (scanTags) {
    /* READ ***/ entry = statements.next().value;
    if (entry !== undefined) {
      [stmNum, stm] = entry;
      [kw, pragmaType, pragmaKey, ...args] = TOKENIZER.UnpackStatement(stm);
      if ((kw && kw !== '#') || pragmaType !== 'TAG') {
        // stop at the first non tag
        scanTags = false;
      } else {
        pragmaType = pragmaType || '';
        pragmaType = (pragmaType as string).toUpperCase();
        pragmaKey = pragmaKey || '';
        pragmaKey = (pragmaKey as string).toUpperCase();
        const pkey = pragmaType;
        if (TAGMAP[pkey] === undefined) TAGMAP[pkey] = {};
        const pdict = TAGMAP[pkey];
        pdict[pragmaKey as string] = { stmNum, args };
        newScript.push(stm);
      }
    } else {
      scanTags = false;
    }
  }
  // check that required directives are in place
  const foundTags = { ...TAGMAP.TAG };
  const reqTags = { ...SIMDATA.GetBundleTagSymbols() }; // make a copy to destroy
  Object.keys(foundTags).forEach(tag => {
    const hasTag = SIMDATA.IsBundleTagName(tag);
    if (hasTag) {
      if (DBG) console.log('deleting', hasTag, 'from', reqTags);
      delete reqTags[hasTag];
    }
  });
  // see if there are any non-deleted tags, and then shove them in.
  Object.keys(reqTags).forEach(key => {
    if (DBG) console.log('adding missing TAG', key);
    newScript.push(...TOKENIZER.TextToScript(`# TAG ${key} false`));
  });

  // add a blank line underneath
  // newScript.push(...TOKENIZER.TextToScript(''));

  // check for required program directives
  // while writing the rest of the statements
  const needsProg = new Set(SIMDATA.GetBundleOutSymbols());
  /* REUSE **/ if (entry !== undefined) {
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
      /* READ ***/ entry = statements.next().value; /*** READ ***/
    }
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
function removeCharacter(instanceDef: TInstanceDef) {
  SIMAGENTS.DeleteAgent(instanceDef);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// API: These methods make new agents from registered blueprints that are
/// created by CompileBlueprint()
export {
  MakeAgent, // BlueprintName => Agent
  removeCharacter,
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
export * from 'script/tools/script-compiler'; //
/// FORWARDED API: convert text to tokenized scripts
export * from 'script/tools/script-tokenizer';
/// FORWARDED API: convert tokenized script to React-renderable data structures
export * from 'script/tools/script-to-lines';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEPRCECATED API: convert tokenized script into a React representation
export * from 'script/tools/script-to-jsx';
/// DEPRECATED API: these are routines that extract these values using brute
/// force techniques before the compiler generated this information for us
export * from 'script/tools/script-extraction-utilities';
