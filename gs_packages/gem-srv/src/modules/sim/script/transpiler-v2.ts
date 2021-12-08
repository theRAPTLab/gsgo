/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implement a "Keyword Dictionary" that manages the compile() and render()
  output for a particular script keyword. This module also exposes static
  methods for compiling and rendering TScriptUnit[] arrays

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GAgent from 'lib/class-gagent';
import { TScriptUnit, TSMCProgram, TInstance, EBundleType } from 'lib/t-script.d';
import { SaveAgent, DeleteAgent } from 'modules/datacore/dc-agents';
import { GetBlueprint, SaveBlueprint } from 'modules/datacore/dc-script-engine';
import SM_Bundle from 'lib/class-sm-bundle';

// critical imports
import 'script/keywords/_all_keywords';

// tooling imports
import { TextToScript } from './tools/text-to-script';
import { ScriptToText, TokenToString } from './tools/script-to-text';
import { ScriptToJSX } from './tools/script-to-jsx';
import {
  CompileScript,
  CompileBlueprint,
  DecodeStatement,
  DecodeToken,
  DecodeTokenPrimitive
} from './tools/script-compiler';
import { ScriptToLines } from './tools/script-utilities';
import * as SYMBOLS from './tools/symbol-utilities';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRANSPILE', 'TagDebug');
//
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compile a source text and return compiled TMethod. Similar to
 *  CompileBlueprint but does not handle directives or build a bundle. Used
 *  for generating code snippets on-the-fly.
 */
function CompileText(text: string = ''): TSMCProgram {
  const script = TextToScript(text);
  return CompileScript(script);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Utility to dump node format of script */
function ScriptToConsole(units: TScriptUnit[], lines: string[] = []) {
  let str = [];
  let blkn = 0;
  let offset = 0;
  units.forEach((arr, idx) => {
    str = [];
    blkn = 0;
    arr.forEach(item => {
      const {
        identifier,
        objref,
        directive,
        value,
        string,
        comment,
        block,
        expr
      } = item;
      if (identifier) str.push(identifier);
      if (objref) {
        str.push(objref.join('.'));
      }
      if (directive) str.push(directive);
      if (value) str.push(value);
      if (string) str.push(`"${string}"`);
      if (comment) str.push(`// ${comment}`);
      if (block) {
        str.push('[[');
        block.forEach(line => str.push(line));
        str.push(']]');
        blkn = 1 + block.length;
      }
      if (expr) str.push(expr);
    });
    const out = str.join(' ');
    let line = lines[idx + offset];
    if (line !== undefined) line = line.trim();
    if (line === undefined) console.log('OK:', out);
    else if (blkn > 0) {
      console.log(`%cSKIPPING BLOCK MATCHING:\n${out}`, 'color:#aaa');
      offset += blkn;
    } else if (line !== out)
      console.log(
        `%cMISMATCH %c SOURCE vs DECOMPILED UNITS\n  source: ${line}\n  decomp: %c${out}`,
        'color:red',
        'color:auto',
        'background-color:yellow'
      );
  });
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
    SaveBlueprint(bdl);
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
 *  dc-agents, because datacore modules must be pure definition
 */
function MakeAgent(instanceDef: TInstance) {
  const { bpid, label } = instanceDef;
  const agent = new GAgent(label, String(instanceDef.id));
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (typeof bpid === 'string') {
    const bdl = GetBlueprint(bpid);
    if (!bdl) throw Error(`agent blueprint for '${bpid}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bdl);

    return SaveAgent(agent);
  }
  throw Error(
    `MakeAgent(): bad blueprint name ${JSON.stringify(
      bpid
    )} in instanceDef ${JSON.stringify(instanceDef)}`
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveAgent(instanceDef: TInstance) {
  DeleteAgent(instanceDef);
}

/// CONSOLE TESTING ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** can a simpler context object be created as a wrapper that doesn't bloat
 *  every object?
 *  this is playground code to figure out how to create the Expression
 *  context object that is simpler than our current version, such that
 *  agent.prop('x').value becomes just x or agent.x
 */
if (DBG)
  UR.AddConsoleTool({
    run_context_tests: () => {
      const bpText = `
    # BLUEPRINT ContextTester
    # PROGRAM DEFINE
    addProp aNumber Number 0
    addProp aBool Boolean false
    addProp aString String 'hello'
    `.trim();
      // create base agent
      const agent = new GAgent('context_tester');
      // invoke blueprint creation
      const bpScript = TextToScript(bpText);
      if (!bpScript) return `error: compiler error\n${bpText}`;
      const bdl = CompileBlueprint(bpScript);
      if (!bdl) return `error: bad bundle from text:\n${bpText}`;
      console.log(`attaching blueprint '${bdl.name}' to ${agent.name}`);
      // return a fancy wrapper object that will be used as context for
      // expressions
      // x, y
      const ctx1 = {
        agent: {
          get x() {
            return agent.prop.x.value;
          },
          set x(val) {
            agent.prop.x.value = val;
          }
        }
      };
      // how about using defineProperty programmatically?
      const ctx2 = {};
      Object.defineProperty(ctx2, 'x', {
        get: () => agent.prop.x.value,
        set: val => {
          agent.prop.x.value = val;
        }
      });

      // this would be defined on GAgent
      function addContext(prop) {
        Object.defineProperty(this.context, prop, {
          get: () => this.prop[prop].value,
          set: val => {
            this.prop.x.value = val;
          }
        });
      }
      // set window.ctx
      (window as any).ctx = ctx2;
      return 'inspect window.ctx';
    }
  });
// automatically fire test code because I hate typing
if (DBG)
  setTimeout(() => {
    console.log((window as any).run_context_tests());
  }, 500);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CORE FUNCTIONS
export {
  TextToScript, // text w/ newlines => TScriptUnit[]
  ScriptToText, // TScriptUnit[] => produce source text from units
  CompileScript, // TScriptUnit[] => TSMCProgram
  ScriptToJSX // TScriptUnit[] => jsx
};

/// CONVENIENCE FUNCTIONS
export {
  CompileText,
  CompileBlueprint, // combine scriptunits through m_CompileBundle
  ScriptToConsole, // used in DevCompiler print script to console
  TokenToString, // for converting a token to its text representation
  DecodeTokenPrimitive, // for decoding the value of a token, returns token otherwise
  DecodeToken, // Working with DecodeTokenPrimitive, converts a token into runtime entity
  DecodeStatement, // Works with DecodeToken to create runtime enties
  ScriptToLines // converts script into a viewmodel suitable for rendering as lines
};

/// BLUEPRINT OPERATIONS
export {
  MakeAgent, // BlueprintName => Agent
  RemoveAgent,
  RegisterBlueprint // TScriptUnit[] => ISM_Bundle
};

/// BLUEPRINT SYMBOL
export * from './tools/script-extraction-utilities';
