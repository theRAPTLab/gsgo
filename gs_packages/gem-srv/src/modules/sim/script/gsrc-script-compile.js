/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script compiling

  \*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const simpleIfExpr = {
  text: `
ifExpr {{ A }} [[
  dbgOut 'true that'
]]
`,
  ctx: { A: true, agent: {} },
  stack: []
};

export const Script = {
  simpleIfExpr
};
