/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Panel Script - Control Module for Panel Script

  Handles business logic for PaneScript

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
// TRANSPILER v1
// import * as TRANSPILER from 'script/transpiler';

// TRANSPILER v2
import * as TRANSPILER from 'script/transpiler-v2';

import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('mod-panel-script');
const DBG = false;

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// compile source to jsx
export function CompileToJSX(currentScript) {
  if (DBG) console.group(...PR('CompleToJSX'));

  // Construct list of selectable agent properties
  const propMap = TRANSPILER.ExtractBlueprintPropertiesMap(currentScript);

  // Construct list of featProps for script UI menu
  const featPropMap = TRANSPILER.ExtractFeatPropMapFromScript(currentScript);
  console.log('featPropMap', featPropMap);
  // console.error('currentScript', currentScript);

  // TRANSPILER v1
  // const source = TRANSPILER.ScriptifyText(currentScript);

  // TRANSPILER v2
  const source = TRANSPILER.TextToScript(currentScript);
  console.error('mod-panel-script', source);

  // ORIG using TRANSPILER v1
  // const jsx = TRANSPILER.RenderScript(source, {

  // TRANSPILER v2
  // NEW Use ScriptToJSX for block rendering
  const jsx = ScriptToJSX(source, {
    isEditable: true,
    isDeletable: false,
    isInstanceEditor: false,
    propMap,
    featPropMap
  });
  if (DBG) console.groupEnd();
  return jsx;
}
