/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert ScriptUnits to JSX

  This duplicates much of the compile scripts in Transpiler, but
  rather than compiling blocks, it passes the blocks to the keyword
  so that the keyword can render the block JSX.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit, IToken } from 'lib/t-script.d';
import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { GetProgram } from 'modules/datacore/dc-named-methods';
import { TextToScript, ScriptToText } from 'modules/sim/script/tools/_all_tools';
import { ParseExpression } from './class-expr-parser-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPT_TO_JSX', 'TagDebug');
const DBG = false;

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to return the 'decoded' value of a token
 *  COPIED unmodified from transpiler-v2.
 */
function m_GetTokenValue(arg) {
  const { directive, comment, line } = arg; // meta information
  const { token, value, string } = arg; // primitive values
  const { objref, program, block, expr } = arg; // req runtime eval
  if (directive) return arg; // directive = _pragma, cmd
  if (comment) return comment;
  if (line !== undefined) return `// line:${line}`; // don't compile these!
  if (token !== undefined) return token;
  if (value !== undefined) return value;
  if (string !== undefined) return string;
  if (program) return arg; // { program = string name of stored program }
  if (Array.isArray(block)) return arg; // { block = array of arrays of tok }
  if (objref) {
    console.log('GetTokenValue objref', arg);
    return arg; // { objref = array of string parts }
  }
  if (expr) return arg; // { expr = string }
  console.warn('unknown argument type:', arg);
  throw Error('unknown argument type');
}

/// SUPPORT API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return 'expanded' version of argument, suitable for passing to a keyword
 *  compiler
 *  COPIED from script-compiler.ts and
 * MODIFIED to not compile blocks
 */
function r_DecodeToken(tok: IToken): any {
  if (tok.comment !== undefined) return '//'; // signal compiler to skip
  const arg = m_GetTokenValue(tok); // convert
  // check special types
  if (arg.directive) return '_pragma'; // { directive, cmd } for compile-time processing
  if (typeof arg.expr === 'string') {
    const ast = ParseExpression(arg.expr);
    return { expr: ast }; // runtime processing through Evaluate() required
  }
  if (Array.isArray(arg.objref)) return arg; // runtime processing required
  if (typeof arg.program === 'string') return GetProgram(arg.program); // runtime processing required

  // NEW: Pass Blocks uncompiled
  if (arg.block) return arg.block; // return detokenized block
  // ORIG: Compile blocks for execution
  // if (arg.block) return CompileScript(arg.block); // recursive compile

  if (arg.line !== undefined) return `// line: ${arg.line}`;

  // 6. otherwise this is a plain argument
  return arg;
}

/** Given a ScriptUnit, return the 'decoded' tokens as usable valuables when
 *  it is time to invoke a compiler function
 *  COPIED unmodified from script-compiler.ts to use non-compiled r_DecodeToken
 */
function DecodeStatement(toks: TScriptUnit): any[] {
  // console.log('toks', toks);
  const dUnit: TScriptUnit = toks.map((tok, ii) => {
    let arg = r_DecodeToken(tok);
    return arg;
  });
  return dUnit;
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 *  @param {array} options -- { isEditable }
 *  COPIED unmodified from transpiler-v2
 */

/// REIVEW: Remove/rpelace transpiler-v2's version of RenderScript?

function RenderScript(units: TScriptUnit[], options: any[]): any[] {
  const sourceJSX = [];
  if (!(units.length > 0)) return sourceJSX;
  let out = [];
  if (DBG) console.groupCollapsed(...PR('RENDERING SCRIPT'));

  units.forEach((rawUnit, index) => {
    let unit = DecodeStatement(rawUnit);

    // ORIG: Skip blank lines
    // if (unit.length === 0) return;

    // NEW: Keep blank lines, otherwise
    // index gets screwed up when updating text lines.
    // Treat the blank lines as a comment.
    if (unit.length === 0) {
      sourceJSX.push('//'); // no jsx to render for comments
      return;
    }

    let keyword = unit[0];

    // ORIG
    // comment processing
    // if (keyword === '//') {
    // sourceJSX.push(undefined); // no jsx to render for comments
    // if (DBG) console.groupEnd();
    // return;
    // }
    //
    // HACK
    // Process comments as a keyword so they are displayed with line numbers
    if (keyword === '//') {
      keyword = '_comment';
      unit[1] = rawUnit[0] ? rawUnit[0].comment : '';
    }

    if (keyword === '#') keyword = '_pragma';
    let kwProcessor = GetKeyword(keyword);
    if (!kwProcessor) {
      kwProcessor = GetKeyword('dbgError');
      kwProcessor.keyword = keyword;
    }

    /// NO THIS DOES NOT WORK EITHER!
    // Make sure OPtions is cleared b/c parentLineIndices is being passwed on?
    // options.parentLineIndices = undefined;

    // clone the options so each can have its own parentLineIndices
    const kwOptions = { ...options };

    const jsx = kwProcessor.jsx(index, unit, kwOptions);
    sourceJSX.push(jsx);
    out.push(`<${kwProcessor.getName()} ... />\n`);
  });

  if (DBG) console.log(`JSX (SIMULATED)\n${out.join('')}`);
  if (DBG) console.groupEnd();
  return sourceJSX;
}

/** given a TScriptUnit[], return text version */
function ScriptToJSX(units: TScriptUnit[], options: any[]): any {
  return RenderScript(units, options);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// This should replace one line in origScriptUnits and then return origScriptUnits
/// Called by UpdateScript
function UpdateLine(origScriptUnits: any, update: any) {
  // console.error('UpdateLine parentLineIndices.length', update.parentLineIndices.length);
  const line = update.index;
  const nestParent = update.parentLineIndices.shift();
  const parentIndex = nestParent.index;
  const blockPosition = nestParent.blockIndex; // could be first block or second block <conseq> <alt>
  // console.log('working on parentIndex', parentIndex, blockPosition);

  // Still nested deeper?  Recurse!
  if (update.parentLineIndices.length > 0) {
    // console.log(
    //   '=> recursing. replacing line',
    //   parentIndex,
    //   'with',
    //   update.parentLineIndices,
    //   origScriptUnits[parentIndex]
    // );

    // Update the block!
    // 1. Get the updated Line
    const updatedLine = UpdateLine(
      origScriptUnits[parentIndex][blockPosition].block,
      update
    );
    // 2. Insert it into the script
    origScriptUnits[parentIndex][blockPosition] = {
      block: updatedLine
    };

    return origScriptUnits;
  }

  // Found deepest line.  Replace!
  if (parentIndex !== undefined) {
    // replacing a nested line
    // console.warn(
    //   'updating nested line -- this should be nested script, not the full script',
    //   origScriptUnits
    // );
    // console.error(
    //   'index/line',
    //   line,
    //   'parentIndex',
    //   parentIndex,
    //   'block is',
    //   blockPosition
    // );

    const origBlockData = origScriptUnits[parentIndex][blockPosition].block;
    // console.log('...origBlock', origBlock);
    origBlockData.splice(line, 1, ...update.scriptUnit);
    // console.log('...updatedBlockData', origBlockData);
    origScriptUnits[parentIndex][blockPosition] = {
      block: origBlockData
    };
  } else {
    // just a single script line
    console.error('replacing script line', line, update.scriptUnit);
    origScriptUnits[line] = update.scriptUnit;
  }
  return origScriptUnits;
}

/**
 * Handles script wizard updates sent from:
 * 1. PanelRound / PanelRoundEditor / SubpanelScript
 * 2. InstanceEditor
 * 3. Script Editor / PanelScript
 *
 * This will
 * a. insert the newly updated line
 * b. return the full updated script
 *
 * `update` is usually just a single line that needs to be updated
 * but the line might be nested many levels deep.
 *
 * @param origScriptText
 * @param update
 * @returns
 */
function UpdateScript(origScriptText: string, update: any) {
  // 1. Convert orig script to script units
  const origScriptUnits = TextToScript(origScriptText);
  // console.warn(
  //   'UpdateScript: update.parentLineIndices',
  //   update.parentLineIndices.length,
  //   update.parentLineIndices,
  //   'orig script',
  //   origScriptUnits
  // );

  // 2. Convert updated script to script units
  // const updatedScriptUnits = [...update.scriptUnit];

  // 3. Figure out which unit line to replace
  let scriptUnits = [...origScriptUnits];

  //    parentIndices is an array with the top level
  //    index first, followed by any subsequent lines
  if (update.parentLineIndices !== undefined) {
    // Update is a nested line, replace the block
    // 2a. How many nested levels down do we need to go?
    scriptUnits = UpdateLine(origScriptUnits, update);
  } else {
    // Update root level line
    const line = update.index;
    // just grab the first item?
    scriptUnits[line] = update.scriptUnit[0];
  }
  // console.log('updated ScriptUnits', scriptUnits);

  // 3. Convert back to script text
  const updatedScript = ScriptToText(scriptUnits);
  // console.log('updated script text', updatedScript);

  return updatedScript;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ScriptToJSX, UpdateScript };
