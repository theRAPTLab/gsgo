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
import { KEYGEN } from 'lib/class-sm-keyword';
import reactTreeWalker from 'lib/util-react-tree-walker';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');

/// LOAD KEYWORD DICTIONARY ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
KEYGEN.AddKeyword(EndTemplate);
KEYGEN.AddKeyword(DefTemplate);
KEYGEN.AddKeyword(DefProp);
KEYGEN.AddKeyword(UseFeature);

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REACT_ROOT;
let KEYWORD_STATES;

const SOURCE = [
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
const SOURCE2 = ['defTemplate Cheese', 'defProp type GSString', 'endTemplate'];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestListSource(source = SOURCE) {
  console.log(...PR('Source Lines - (made by GUI, saved/loaded from network)'));
  source.forEach((line, index) => {
    console.log(index, line);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToProgram(source = SOURCE) {
  // the idea is to create a data structure we can generate and then parse
  console.log(
    ...PR('KEYGEN.CompileTemplate() - create template smc program arrays')
  );
  // get the output
  const output = KEYGEN.CompileTemplate(source);
  //  print the output
  output.template_define.forEach(statement =>
    console.log('definition:', statement)
  );
  output.template_defaults.forEach(statement =>
    console.log('defaults:  ', statement)
  );
  output.template_conditions.forEach(statement =>
    console.log('conditions:', statement)
  );
  return 'end test';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToReact(source: any[][] = SOURCE) {
  // the idea is to parse data structure into react
  console.log(...PR('KEYGEN.RenderSource() - generate renderable components'));
  // REACT_ROOT = KEYGEN.RenderSourceToJSX(source);
  // UR.RaiseMessage('KEYWORD_TEST_RENDER', REACT_ROOT);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function TestReadReact() {
  // TEST: try this neat function to walk tree
  const decompile = [];
  function visitor(element, instance, ctx, childCtx) {
    if (element && element.props) {
      const id = element.props.className || element.props.keyword;
      const kids = element.props.children
        ? element.props.children
        : (instance && instance.state) || [];
      if (id) {
        console.log(`<${id}>`, kids, instance);
        decompile.push(id, kids);
      }
    }
  }
  console.log(...PR('READ REACT'));
  await reactTreeWalker(REACT_ROOT, visitor);
  console.log(...PR('DECOMP', decompile));
}
UR.RegisterMessage('KEYWORD_TEST_READ', TestReadReact);

/// WINDOW DEBUG //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.RegisterMessage('KEYWORD_TEST_UPDATE', event => {
  const { index, keyword, state } = event;
  KEYWORD_STATES[index] = { keyword, args: state };
  console.log(...PR('wrote state', KEYWORD_STATES[index]));
});
(window as any).RenderKeywordObjs = () => {
  KEYWORD_STATES = KEYGEN.MakeKeywordObjs(SOURCE);
  console.log(KEYWORD_STATES);
  const jsx = KEYGEN.RenderKeywordObjs(KEYWORD_STATES);
  UR.RaiseMessage('KEYWORD_TEST_RENDER', jsx);
};
(window as any).DecompileKeywordObjs = () => {
  const source = KEYGEN.DecompileKeywordObjs(KEYWORD_STATES);
  console.log(...PR('DECOMPILED'));
  source.forEach((line, index) => {
    console.log(index, line);
  });
  console.log(...PR('RECOMPILE'));
  TestSourceToProgram(source);
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  TestListSource,
  TestSourceToProgram,
  TestSourceToReact
};
