/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Panel Script - Control Module for Panel Script

  Handles business logic for PaneScript

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler';
import GAgent from '../../../lib/class-gagent';

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

  // console.error('currentScript', currentScript);
  const source = TRANSPILER.ScriptifyText(currentScript);
  // console.error('mod-panel-script', source);
  const jsx = TRANSPILER.RenderScript(source, {
    isEditable: true,
    isDeletable: false,
    isInstanceEditor: false,
    propMap,
    featPropMap
  });
  if (DBG) console.groupEnd();
  return jsx;
}
