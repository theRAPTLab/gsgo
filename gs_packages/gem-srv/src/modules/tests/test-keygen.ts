/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test converter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  DefTemplate,
  EndTemplate
} from 'modules/sim/script/keywords/defTemplate';
import { DefProp } from 'modules/sim/script/keywords/defProp';
import { UseFeature } from 'modules/sim/script/keywords/useFeature';
import { KEYGEN, SRCLine, UIUpdate } from 'lib/class-keyword-helper';
import './test-expression';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');
const DBG = true;

/// LOAD KEYWORD DICTIONARY ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
KEYGEN.AddKeywordHelper(EndTemplate);
KEYGEN.AddKeywordHelper(DefTemplate);
KEYGEN.AddKeywordHelper(DefProp);
KEYGEN.AddKeywordHelper(UseFeature);

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOURCE: SRCLine[] = [
  ['defTemplate', 'Bee'],
  ['defProp', 'nectarAmount', 'GSNumber', 0],
  ['useFeature', 'FishCounter'],
  ['useFeature', 'BeanCounter'],
  ['useFeature', 'Movement'],
  ['endTemplate'],
  ['defTemplate', 'HoneyBee', 'Bee'],
  ['defProp', 'honeySacks', 'GSNumber', 0],
  ['endTemplate']
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
      ...PR('KEYGEN.CompileTemplate() - create template smc program arrays')
    );
  // get the output
  const output = KEYGEN.CompileTemplate(source);
  //  print the output
  output.template_define.forEach(
    statement => DBG && console.log('definition:', statement)
  );
  output.template_defaults.forEach(
    statement => DBG && console.log('defaults:  ', statement)
  );
  output.template_conditions.forEach(
    statement => DBG && console.log('conditions:', statement)
  );
  return 'end test';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToUI(source: SRCLine[] = SOURCE) {
  // the idea is to parse data structure into react
  if (DBG)
    console.log(...PR('KEYGEN.RenderSource() - generate renderable components'));
  const jsx = KEYGEN.RenderSource(source);
  UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
}

/// WINDOW DEBUG //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** receives the react state object */
UR.RegisterMessage('SCRIPT_UI_CHANGED', (updata: UIUpdate) => {
  const { index, srcLine } = KEYGEN.RegenSRCLine(updata);
  SOURCE[index] = srcLine;
  if (DBG) console.log(...PR(`SOURCE[${index}] updated:`, SOURCE[index]));
});
(window as any).sourceRender = (source: SRCLine[] = SOURCE) => {
  console.log(...PR('rendering test source'));
  const jsx = KEYGEN.RenderSource(source);
  UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
};
(window as any).sourceCompile = (source: SRCLine[] = SOURCE) => {
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
