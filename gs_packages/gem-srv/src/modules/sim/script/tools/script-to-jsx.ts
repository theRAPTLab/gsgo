/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Convert ScriptUnits to JSX

  This duplicates much of the compile scripts in Transpiler, but
  rather than compiling blocks, it passes the blocks to the keyword
  so that the keyword can render the block JSX.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TScriptUnit } from 'lib/t-script.d';
import { GetKeyword } from 'modules/datacore/dc-script-engine';
import { ScriptToText } from './script-to-text';
import { TextToScript } from './text-to-script';
import { DecodeStatement } from './script-compiler';

const merge = require('deepmerge'); // using require so TS doesn't look for types

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SCRIPT_TO_JSX', 'TagDebug');
const DBG = false;

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 *  @param {array} options -- { isEditable }
 */
function ScriptToJSX(units: TScriptUnit[], options: any[]): any[] {
  const sourceJSX = [];
  if (!(units.length > 0)) return sourceJSX;
  let out = [];
  if (DBG) console.groupCollapsed(...PR('RENDERING SCRIPT'));

  units.forEach((rawUnit, index) => {
    let unit = DecodeStatement(
      rawUnit
    ); /* bug? DecodeToken will compile the script */

    // ORIG: Skip blank lines
    // if (unit.length === 0) return;

    // NEW: Keep blank lines, otherwise
    //      index gets screwed up when updating text lines
    //      Treate the blank lines as a comment
    let keyword = unit[0];
    if (keyword === '') {
      // blank line keyword is ''
      keyword = '_comment';
      unit[1] = '';
    }

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

/** THE FOLLOWING CODE IS RELATED TO THE OLD JSX RENDERER PROTOTYPE I THINK **/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This should replace one line in origScriptUnits and then return origScriptUnits
/// Called by UpdateScript
function UpdateLine(origScriptUnits: any, update: any) {
  // Make a copy of the update data since we modify parentLineIndices at each level
  // otherwise we may end up chagning the parentLineIndices for other lines.
  const updateLineData = merge.all([update]);
  const line = updateLineData.index;
  const nestParent = updateLineData.parentLineIndices.shift();
  const parentIndex = nestParent.index;
  const blockPosition = nestParent.blockIndex; // could be first block or second block <conseq> <alt>

  // Still nested deeper?  Recurse!
  if (updateLineData.parentLineIndices.length > 0) {
    // Update the block!
    // 1. Get the updated Line
    const updatedLine = UpdateLine(
      origScriptUnits[parentIndex][blockPosition].block,
      updateLineData
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
    const origBlockData = origScriptUnits[parentIndex][blockPosition].block;
    origBlockData.splice(line, 1, ...updateLineData.scriptUnit);
    // console.log('...updatedBlockData', origBlockData);
    origScriptUnits[parentIndex][blockPosition] = {
      block: origBlockData
    };
  } else {
    // just a single script line
    origScriptUnits[line] = updateLineData.scriptUnit;
  }
  return origScriptUnits;
}

/**
 * Handles script wizard line updates sent from:
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

  // 2. Clone orig script units for updating.
  let scriptUnits = [...origScriptUnits];

  //    parentIndices is an array with the top level
  //    index first, followed by any subsequent lines
  //    it is defined by the keywords, since they know the block structure
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

  // 3. Convert back to script text
  const updatedScript = ScriptToText(scriptUnits);
  // console.log('updated script text', updatedScript);

  return updatedScript;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ScriptToJSX, UpdateScript };
