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

/// COMMAND DEFINITIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a template */
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
  console.log(...PR('source lines (made by GUI, saved/loaded from db)'));
  source.forEach((line, index) => {
    console.log(index, line);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToProgram(source = SOURCE) {
  // the idea is to create a data structure we can generate and then parse
  console.log(...PR('line compiler test'));
  KEYGEN.CompileSource(source);
  return 'end test';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestSourceToReact(source = SOURCE) {
  // the idea is to parse data structure into react
  console.log(...PR('line renderer test'));
  KEYGEN.RenderSource(source);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  TestListSource,
  TestSourceToProgram,
  TestSourceToReact
};
