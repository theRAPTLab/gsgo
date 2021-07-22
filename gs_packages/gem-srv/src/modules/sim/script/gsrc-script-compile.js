/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script compiling

  \*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

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
const bee = {
  text: `
# BLUEPRINT Bee
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featCall Costume setCostume "bunny.json" 1
# PROGRAM UPDATE
prop agent.skin setTo "bunny.json"
ifExpr {{true}} [[
  ifExpr {{ false }} [[
    dbgOut "true"
  ]] [[
    dbgOut "chained blocks work"
  ]]
]]
  `,
  ctx: {},
  stack: []
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const Script = {
  simpleIfExpr,
  bee
};
