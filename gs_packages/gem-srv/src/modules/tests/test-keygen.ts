/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test converter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-old';
import { TScriptUnit, IScriptUpdate } from 'lib/t-script';
import './test-expression';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');
const DBG = true;

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SCRIPT: TScriptUnit[] = [
  ['defBlueprint', 'Bee'],
  ['addProp', 'nectarAmount', 'GSNumber', 0],
  ['useFeature', 'FishCounter'],
  ['useFeature', 'BeanCounter'],
  ['useFeature', 'Movement'],
  ['endBlueprint'],
  ['defBlueprint', 'HoneyBee', 'Bee'],
  ['addProp', 'honeySacks', 'GSNumber', 0],
  ['endBlueprint']
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestListScript(source = SCRIPT) {
  if (DBG)
    console.log(...PR('Source Lines - (made by GUI, saved/loaded from network)'));
  source.forEach((line, index) => {
    if (DBG) console.log(index, line);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestScriptToProgram(source = SCRIPT) {
  // the idea is to create a data structure we can generate and then parse
  if (DBG)
    console.log(
      ...PR('KEYGEN.CompileTemplate() - create blueprint smc program arrays')
    );
  // get the output
  const output = TRANSPILER.CompileBlueprint(source);
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
function TestScriptToUI(source: TScriptUnit[] = SCRIPT) {
  // the idea is to parse data structure into react
  if (DBG)
    console.log(...PR('KEYGEN.RenderScript() - generate renderable components'));
  const jsx = TRANSPILER.RenderScript(source);
  UR.RaiseMessage('SCRIPT_JSX_CHANGED', jsx);
}

/// WINDOW DEBUG //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** receives the react state object */
UR.RegisterMessage('SCRIPT_SRC_CHANGED', (updata: IScriptUpdate) => {
  const { index, scriptUnit } = updata;
  SCRIPT[index] = scriptUnit;
  if (DBG) console.log(...PR(`SCRIPT[${index}] updated:`, SCRIPT[index]));
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

(window as any).sourceRender = (source: TScriptUnit[] = SCRIPT) => {
  console.log(...PR('rendering test source'));
  const jsx = TRANSPILER.RenderScript(source);
  UR.RaiseMessage('SCRIPT_JSX_CHANGED', jsx);
};
(window as any).sourceCompile = (source: TScriptUnit[] = SCRIPT) => {
  console.log(...PR('compiling test source'));
  TestScriptToProgram(source);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  TestListScript,
  TestScriptToProgram,
  TestScriptToUI
};
