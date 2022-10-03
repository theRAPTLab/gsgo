/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script parsing without keyword generation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Bee from './td-blueprint-bee';
import Moth from './td-blueprint-moth';

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const block = {
  text: `
when A touches A [[
  prop A set 10
  prop B set 20
]]
`,
  expect:
    '[[{"identifier":"when"},{"identifier":"A"},{"identifier":"touches"},{"identifier":"A"},{"block":[[{"identifier":"prop"},{"identifier":"A"},{"identifier":"set"},{"value":10}],[{"identifier":"prop"},{"identifier":"B"},{"identifier":"set"},{"value":20}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test block chaining
const blockblock = {
  text: `
when A touches B [[
  prop A set 30
  prop B set 40
]] [[
  prop A sub 10
  prop B sub 20
]]
`,
  expect:
    '[[{"identifier":"when"},{"identifier":"A"},{"identifier":"touches"},{"identifier":"B"},{"block":[[{"identifier":"prop"},{"identifier":"A"},{"identifier":"set"},{"value":30}],[{"identifier":"prop"},{"identifier":"B"},{"identifier":"set"},{"value":40}]]},{"block":[[{"identifier":"prop"},{"identifier":"A"},{"identifier":"sub"},{"value":10}],[{"identifier":"prop"},{"identifier":"B"},{"identifier":"sub"},{"value":20}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block
const nblock = {
  text: `
when [[
  prop A
  ifExpr [[
    prop D
  ]]
]]
`,
  expect:
    '[[{"identifier":"when"},{"block":[[{"identifier":"prop"},{"identifier":"A"}],[{"identifier":"ifExpr"},{"block":[[{"identifier":"prop"},{"identifier":"D"}]]}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test tripple nesting
const tnblock = {
  text: `
ifExpr {{ A }} [[
  ifExpr {{ BB }} [[
    ifExpr {{ CCC }} [[
      prop DDD add 1
    ]]
  ]]
  prop EEE set 0
]]
`,
  expect:
    '[[{"identifier":"ifExpr"},{"expr":"A"},{"block":[[{"identifier":"ifExpr"},{"expr":"BB"},{"block":[[{"identifier":"ifExpr"},{"expr":"CCC"},{"block":[[{"identifier":"prop"},{"identifier":"DDD"},{"identifier":"add"},{"value":1}]]}]]}],[{"identifier":"prop"},{"identifier":"EEE"},{"identifier":"set"},{"value":0}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block chaining
const nblockblock = {
  text: `
when A touches B [[
  prop X set 10
  ifExpr {{ X }} [[
    prop D add 1
  ]] [[
    prop D delete
  ]]
]]
`,
  expect:
    '[[{"identifier":"when"},{"identifier":"A"},{"identifier":"touches"},{"identifier":"B"},{"block":[[{"identifier":"prop"},{"identifier":"X"},{"identifier":"set"},{"value":10}],[{"identifier":"ifExpr"},{"expr":"X"},{"block":[[{"identifier":"prop"},{"identifier":"D"},{"identifier":"add"},{"value":1}]]},{"block":[[{"identifier":"prop"},{"identifier":"D"},{"identifier":"delete"}]]}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifExpr = {
  text: `
ifExpr {{ A }} [[
  dbgOut "true that"
]]
  `,
  expect:
    '[[{"identifier":"ifExpr"},{"expr":"A"},{"block":[[{"identifier":"dbgOut"},{"string":"true that"}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const comment = {
  text: `
ifExpr {{ A }} [[
  // comment A
  prop A setTo 1
  ifExpr {{ B }} [[
    // comment B
    prop B setTo 2
  ]]
]]
`,
  expect:
    '[[{"identifier":"ifExpr"},{"expr":"A"},{"block":[[{"comment":"comment A"}],[{"identifier":"prop"},{"identifier":"A"},{"identifier":"setTo"},{"value":1}],[{"identifier":"ifExpr"},{"expr":"B"},{"block":[[{"comment":"comment B"}],[{"identifier":"prop"},{"identifier":"B"},{"identifier":"setTo"},{"value":2}]]}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const bee = {
  text: Bee.text,
  expect: Bee.expect
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const moth = {
  text: Moth.text,
  expect: Moth.expect
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const Blocks = {
  block,
  blockblock,
  nblock,
  tnblock,
  nblockblock,
  ifExpr,
  comment,
  bee,
  moth
};
