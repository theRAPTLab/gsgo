/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Bee from './td-blueprint-bee';
import Moth from './td-blueprint-moth';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const simpleIfExpr = {
  text: `
ifExpr {{ A }} [[
  dbgOut "true that"
]]
`,
  ctx: { A: true, agent: {} },
  stack: []
};
const moth = {
  text: Moth.text,
  ctx: {},
  stack: []
};
const bee = {
  text: Bee.text,
  ctx: {},
  stack: []
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const ScriptTest = {
  simpleIfExpr,
  bee,
  moth // doesn't run because CursorPack is not clean
};
export const BlueprintTest = {
  bee,
  moth
};
