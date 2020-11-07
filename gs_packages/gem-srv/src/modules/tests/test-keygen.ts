/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test converter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as KEYDICT from 'script/keyword-factory';
import { ScriptUnit, ScriptUpdate } from 'lib/t-script';
import './test-expression';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');
const DBG = true;

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOURCE: ScriptUnit[] = [
  ['defBlueprint', 'Bee'],
  ['defProp', 'nectarAmount', 'GSNumber', 0],
  ['useFeature', 'FishCounter'],
  ['useFeature', 'BeanCounter'],
  ['useFeature', 'Movement'],
  ['endBlueprint'],
  ['defBlueprint', 'HoneyBee', 'Bee'],
  ['defProp', 'honeySacks', 'GSNumber', 0],
  ['endBlueprint']
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestListSource(source = SOURCE) {
  if (DBG)
    console.log(...PR('Source Lines - (made by GUI, saved/loaded from network)'));
  source.forEach((line, index) => {
    if (DBG) console.log(index, line);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToProgram(source = SOURCE) {
  // the idea is to create a data structure we can generate and then parse
  if (DBG)
    console.log(
      ...PR('KEYGEN.CompileTemplate() - create blueprint smc program arrays')
    );
  // get the output
  const output = KEYDICT.CompileSource(source);
  //  print the output
  output.define.forEach(
    statement => DBG && console.log('definition:', statement)
  );
  output.defaults.forEach(
    statement => DBG && console.log('defaults:  ', statement)
  );
  output.conditions.forEach(
    statement => DBG && console.log('conditions:', statement)
  );
  return 'end test';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToUI(source: ScriptUnit[] = SOURCE) {
  // the idea is to parse data structure into react
  if (DBG)
    console.log(...PR('KEYGEN.RenderSource() - generate renderable components'));
  const jsx = KEYDICT.RenderSource(source);
  UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
}

/// WINDOW DEBUG //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** receives the react state object */
UR.RegisterMessage('SCRIPT_UI_CHANGED', (updata: ScriptUpdate) => {
  const { index, scriptUnit } = updata;
  SOURCE[index] = scriptUnit;
  if (DBG) console.log(...PR(`SOURCE[${index}] updated:`, SOURCE[index]));
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

(window as any).sourceRender = (source: ScriptUnit[] = SOURCE) => {
  console.log(...PR('rendering test source'));
  const jsx = KEYDICT.RenderSource(source);
  UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
};
(window as any).sourceCompile = (source: ScriptUnit[] = SOURCE) => {
  console.log(...PR('compiling test source'));
  TestSourceToProgram(source);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  TestListSource,
  TestSourceToProgram,
  TestSourceToUI
};
