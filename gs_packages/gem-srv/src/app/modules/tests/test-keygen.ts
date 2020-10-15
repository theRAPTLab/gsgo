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
const SOURCE = [
  'defTemplate Bee',
  'defProp nectarAmount GSNumber 0',
  'useFeature FishCounter',
  'useFeature BeanCounter',
  'useFeature Movement',
  'endTemplate',
  'defTemplate HoneyBee Bee',
  'defProp honeySacks GSNumber 0',
  'endTemplate'
];
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
    ...PR('KEYGEN.CompileSource() - create template smc program arrays')
  );
  // get the output
  const output = KEYGEN.CompileSource(source);
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
function TestSourceToReact(source = SOURCE) {
  // the idea is to parse data structure into react
  console.log(...PR('KEYGEN.RenderSource() - generate renderable components'));
  const react = KEYGEN.RenderSource(source);
  react.forEach(component => console.log(component));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  TestListSource,
  TestSourceToProgram,
  TestSourceToReact
};
