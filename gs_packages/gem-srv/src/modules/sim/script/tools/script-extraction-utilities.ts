/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Brute-force metadata tools for extracting symbol information from blueprints
  before transpiler generated symbol tables

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Agent from 'lib/class-sm-agent';
import { TextToScript } from './script-tokenizer';
import * as COMPILER from './script-compiler';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint name from a script
 *  Compiles raw scriptText to determine the blueprint name
 *  @param {string} bpText
 */
function ExtractBlueprintName(bpText: string): string {
  const script = TextToScript(bpText);
  const bundle = COMPILER.CompileBlueprint(script); // compile to get name
  return bundle.name;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A brute force method of retrieving the blueprint properties from a
 *  scriptText. Compiles raw scriptText to determine the blueprint properties
 *  Only includes `prop` properties, not `featProps`
 *  @param {string} bpText
 *  @return {Object[]} [...{name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintProperties(bpText): any[] {
  // HACK in built in properties -- where should these be looked up?
  // 1. Start with built in properties
  let properties: any[] = [
    { name: 'x', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'y', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'zIndex', type: 'number', defaultValue: 0, isFeatProp: false },
    {
      name: 'skin',
      type: 'string',
      defaultValue: 'onexone.json',
      isFeatProp: false
    },
    { name: 'color', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'scale', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'scaleY', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'orientation', type: 'number', defaultValue: 0, isFeatProp: false },
    { name: 'visible', type: 'boolean', defaultValue: true, isFeatProp: false },
    { name: 'alpha', type: 'number', defaultValue: 1, isFeatProp: false },
    { name: 'isInert', type: 'boolean', defaultValue: false, isFeatProp: false },
    {
      name: 'statusText',
      type: 'string',
      defaultValue: undefined,
      isFeatProp: false
    },
    {
      name: 'statusValue',
      type: 'number',
      defaultValue: undefined,
      isFeatProp: false
    },
    {
      name: 'statusValueColor',
      type: 'number',
      defaultValue: undefined,
      isFeatProp: false
    },
    {
      name: 'statusValueIsLarge',
      type: 'boolean',
      defaultValue: undefined,
      isFeatProp: false
    }
    // Don't allow wizard to set built-in skin property directly.
    // This should be handled via `featCall Costume setCostume` because that
    // call properly initializes the frameCount.
    // { name: 'skin', type: 'string', defaultValue: 'bunny.json', isFeatProp: true }
  ];
  // 2. Brute force deconstruct added properties
  //    by walking down script and looking for `addProp`
  if (!bpText) return properties; // During update script can be undefined
  const scriptUnits = TextToScript(bpText);
  scriptUnits.forEach(unit => {
    if (unit[0] && unit[0].identifier === 'addProp') {
      // add them to the top of the list
      properties.unshift({
        name: unit[1].identifier,
        type: unit[2].identifier.toLowerCase(),
        defaultValue: Object.values(unit[3]), // might be a 'value' or 'string' or 'identifier'
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
 *  @param {string} bpText
 *  @return {map} [ ...{name: {name, type, defaultValue, isFeatProp}]
 */
function ExtractBlueprintPropertiesMap(bpText) {
  const properties = this.ExtractBlueprintProperties(bpText);
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
function ExtractBlueprintPropertiesTypeMap(bpText) {
  const properties = this.ExtractBlueprintProperties(bpText);
  const map = new Map();
  properties.forEach(p => map.set(p.name, p.type));
  return map;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** brute force method of retrieving a list of features used in a scriptText
 */
function ExtractFeaturesUsed(bpText: string): string[] {
  // Brute force deconstruct added properties
  // by walking down script and looking for `addProp`
  if (!bpText) return []; // During update script can be undefined
  const featureNames = [];
  const scriptUnits = TextToScript(bpText);
  scriptUnits.forEach(unit => {
    if (unit[0] && unit[0].identifier === 'useFeature') {
      featureNames.push(unit[1].identifier);
    }
  });
  return featureNames;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** featPropMap is a map of ALL properties of ALL features
 *  for a given script (could be blueprint, or script snippet)
 */
function ExtractFeatPropMapFromScript(bpText: string): Map<string, any[]> {
  // Get list of features used in blueprint
  const featureNames = this.ExtractFeaturesUsed(bpText);
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

    const dummy = new SM_Agent();
    dummy.addFeature(fName);
    const propMap = new Map();
    Object.keys(dummy.prop[fName]).forEach(key => {
      const featProp = dummy.prop[fName][key];
      // ignore private props
      if (key.startsWith('_')) return;
      // deconstruct GVarType
      let type;
      if (featProp instanceof SM_Boolean) type = 'boolean';
      if (featProp instanceof SM_Number) type = 'number';
      if (featProp instanceof SM_String) type = 'string';
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
 *  Used by project-server.InstanceAdd to check for the presence of
 *  '# PROGRAM INIT' to decide whether or not to replace
 *  the init script.
 *  @param {string} bpText blueprint scriptText
 *  @param {string} directive
 *  @returns boolean
 */
function HasDirective(bpText: string, directive: string) {
  if (!bpText) return false; // During update script can be undefined
  const units = TextToScript(bpText);
  let result = false;
  units.forEach(rawUnit => {
    const unit = COMPILER.DecodeStatement(rawUnit);
    if (unit.length !== 3) return; // we're expecting `# PROGRAM xxx` so length = 3
    if (unit[0] === '_pragma' && unit[1] === 'PROGRAM' && unit[2] === directive)
      result = true;
  });
  return result;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  ExtractBlueprintProperties,
  ExtractBlueprintPropertiesMap,
  ExtractBlueprintPropertiesTypeMap,
  ExtractFeaturesUsed,
  ExtractFeatPropMapFromScript,
  ExtractFeatPropMap
};
