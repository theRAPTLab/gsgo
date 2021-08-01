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
import {
  GetKeyword,
  GetBlueprint,
  SaveBlueprint
} from 'modules/datacore/dc-script-engine';
import SM_Bundle from 'lib/class-sm-bundle';
import {
  GVarBoolean,
  GVarDictionary,
  GVarNumber,
  GVarString
} from 'modules/sim/vars/_all_vars';

// critical imports
import 'script/keywords/_all_keywords';

// tooling imports
import {
  TextToScript,
  CompileScript,
  ScriptToText,
  CompileBlueprint,
  DecodeStatement,
  ScriptToJSX
} from './tools/_all_tools';

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
        token,
        objref,
        directive,
        value,
        string,
        comment,
        block,
        expr
      } = item;
      if (token) str.push(token);
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint name from a script
 *  Compiles raw scriptText to determine the blueprint name
 *  @param {string} scriptText
 */
function ExtractBlueprintName(scriptText: string): string {
  const script = TextToScript(scriptText);
  const bundle = CompileBlueprint(script); // compile to get name
  return bundle.name;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint properties from a
 *  scriptText. Compiles raw scriptText to determine the blueprint properties
 *  Only includes `prop` properties, not `featProps`
 *  @param {string} scriptText
 *  @return {Object[]} [...{name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintProperties(scriptText): any[] {
  // HACK in built in properties -- where should these be looked up?
  // 1. Start with built in properties
  let properties: any[] = [
    { name: 'x', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'y', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'zIndex', type: 'number', defaultValue: 0, isFeatProp: false },
    // { name: 'skin', type: 'string', defaultValue: 'onexone', isFeatProp: false },
    // { name: 'scale', type: 'number', defaultValue: 1, isFeatProp: false },
    // { name: 'scaleY', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'alpha', type: 'number', defaultValue: 1, isFeatProp: false }
    // { name: 'isInert', type: 'boolean', defaultValue: false, isFeatProp: false },
    // { name: 'text', type: 'string', defaultValue: '""', isFeatProp: false },
    // { name: 'meter', type: 'number', defaultValue: 0, isFeatProp: false },
    // { name: 'meterClr', type: 'number', defaultValue: 0, isFeatProp: false },
    // {
    //   name: 'meterLarge',
    //   type: 'boolean',
    //   defaultValue: false,
    //   isFeatProp: false
    // }

    // Don't allow wizard to set built-in skin property directly.
    // This should be handled via `featCall Costume setCostume` because that
    // call properly initializes the frameCount.
    // { name: 'skin', type: 'string', defaultValue: 'bunny.json', isFeatProp: true }
  ];
  // 2. Brute force deconstruct added properties
  //    by walking down script and looking for `addProp`
  if (!scriptText) return properties; // During update script can be undefined
  const scriptUnits = TextToScript(scriptText);
  scriptUnits.forEach(unit => {
    if (unit[0] && unit[0].token === 'addProp') {
      properties.push({
        name: unit[1].token,
        type: unit[2].token.toLowerCase(),
        defaultValue: Object.values(unit[3]), // might be a 'value' or 'string' or 'token'
        isFeatProp: false
      });
    }
  });
  return properties;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint properties from a scriptText
 *  Compiles raw scriptText to determine the blueprint property types
 *  Used by PanelScript to generate property menus
 *  @param {string} scriptText
 *  @return {map} [ ...{name: {name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintPropertiesMap(scriptText) {
  const properties = this.ExtractBlueprintProperties(scriptText);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p));
  return map;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint properties from a
 *  scriptText Compiles raw scriptText to determine the blueprint property types
 *  Used by PanelScript to generate property menus
 *  @param {string} scriptText
 *  @return {map} [ ...{name: type}]
 */
function ExtractBlueprintPropertiesTypeMap(scriptText) {
  const properties = this.ExtractBlueprintProperties(scriptText);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p.type));
  return map;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** brute force method of retrieving a list of features used in a scriptText
 */
function ExtractFeaturesUsed(scriptText: string): string[] {
  // Brute force deconstruct added properties
  // by walking down script and looking for `addProp`
  if (!scriptText) return []; // During update script can be undefined
  const featureNames = [];
  const scriptUnits = TextToScript(scriptText);
  scriptUnits.forEach(unit => {
    if (unit[0] && unit[0].token === 'useFeature') {
      featureNames.push(unit[1].token);
    }
  });
  return featureNames;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** featPropMap is a map of ALL properties of ALL features
 *  for a given script (could be blueprint, or script snippet)
 */
function ExtractFeatPropMapFromScript(script: string): Map<string, any[]> {
  // Get list of features used in blueprint
  const featureNames = this.ExtractFeaturesUsed(script);
  return ExtractFeatPropMap(featureNames);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** featPropMap is a map of ALL properties of the all the features
 *  in the featureNames array.
 */
function ExtractFeatPropMap(featureNames: string[]): Map<string, any[]> {
  const featPropMap = new Map();
  featureNames.forEach(fName => {
    // HACK
    // featProps are not even defined until
    // feature.decorate is called.  So we use a dummy
    // agent to instantiate the properties so that
    // we can inspect them

    // Skip 'Cursor' because it's not a proper feature
    // and adding it to the dummy agent is problematic
    if (fName === 'Cursor') return;

    const dummy = new GAgent();
    dummy.addFeature(fName);
    const propMap = new Map();
    Object.keys(dummy.prop[fName]).forEach(key => {
      const featProp = dummy.prop[fName][key];
      // ignore private props
      if (key.startsWith('_')) return;
      // deconstruct GVarType
      let type;
      if (featProp instanceof GVarBoolean) type = 'boolean';
      if (featProp instanceof GVarDictionary) type = 'dictionary';
      if (featProp instanceof GVarNumber) type = 'number';
      if (featProp instanceof GVarString) type = 'string';
      propMap.set(key, {
        name: key,
        type,
        defaultValue: featProp.value,
        isFeatProp: true
      });
    });
    featPropMap.set(fName, propMap);
  });
  return featPropMap;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of checking to see if the script has a directive
 *  Used by project-data.InstanceAdd to check for the presence of
 *  '# PROGRAM INIT' to decide whether or not to replace
 *  the init script.
 *  @param {string} bpText
 *  @param {string} directive
 *  @returns boolean
 */
function HasDirective(bpText: string, directive: string) {
  if (!bpText) return false; // During update script can be undefined
  const units = TextToScript(bpText);
  let result = false;
  units.forEach(rawUnit => {
    const unit = DecodeStatement(rawUnit);
    if (unit.length !== 3) return; // we're expecting `# PROGRAM xxx` so length = 3
    if (unit[0] === '_pragma' && unit[1] === 'PROGRAM' && unit[2] === directive)
      result = true;
  });
  return result;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of ScriptUnits, return JSX keyword components for each line
 *  as rendered by the corresponding KeywordDef object
 *  @param {array} options -- { isEditable }
 */
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
    const jsx = kwProcessor.jsx(index, unit, options);
    sourceJSX.push(jsx);
    out.push(`<${kwProcessor.getName()} ... />\n`);
  });

  if (DBG) console.log(`JSX (SIMULATED)\n${out.join('')}`);
  if (DBG) console.groupEnd();
  return sourceJSX;
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
  const { blueprint, name } = instanceDef;
  const agent = new GAgent(name, String(instanceDef.id));
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (typeof blueprint === 'string') {
    const bdl = GetBlueprint(blueprint);
    if (!bdl) throw Error(`agent blueprint for '${blueprint}' not defined`);
    // console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bdl);

    return SaveAgent(agent);
  }
  throw Error(`MakeAgent(): bad blueprint name ${blueprint}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveAgent(instanceDef: TInstance) {
  DeleteAgent(instanceDef);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CORE FUNCTIONS
export {
  TextToScript, // text w/ newlines => TScriptUnit[]
  ScriptToText, // TScriptUnit[] => produce source text from units
  CompileScript, // TScriptUnit[] => TSMCProgram
  ScriptToJSX // TScriptUnit[] => jsx
};

/// DEPRECATED FUNCTIONS
export {
  TextToScript as ScriptifyText, // deprecated
  ScriptToText as TextifyScript, // deprecated
  CompileText // CompileScript
};

/// CONVENIENCE FUNCTIONS
export {
  CompileBlueprint, // combine scriptunits through m_CompileBundle
  RenderScript, // TScriptUnit[] => JSX for wizards
  ScriptToConsole // used in DevCompiler to
};

/// BLUEPRINT OPERATIONS
export {
  MakeAgent, // BlueprintName => Agent
  RemoveAgent,
  RegisterBlueprint, // TScriptUnit[] => ISM_Bundle
  ExtractBlueprintName,
  ExtractBlueprintProperties,
  ExtractBlueprintPropertiesMap,
  ExtractBlueprintPropertiesTypeMap,
  ExtractFeaturesUsed,
  ExtractFeatPropMapFromScript,
  ExtractFeatPropMap,
  HasDirective
};
