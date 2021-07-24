/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script parsing without keyword generation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Bee from './gsrc-blueprint-bee';
import Moth from './gsrc-blueprint-moth';

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
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"A"},{"block":[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":20}]]}]]'
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
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},{"block":[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":30}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":40}]]},{"block":[[{"token":"prop"},{"token":"A"},{"token":"sub"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"sub"},{"value":20}]]}]]'
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
    '[[{"token":"when"},{"block":[[{"token":"prop"},{"token":"A"}],[{"token":"ifExpr"},{"block":[[{"token":"prop"},{"token":"D"}]]}]]}]]'
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
    '[[{"token":"ifExpr"},{"expr":"A"},{"block":[[{"token":"ifExpr"},{"expr":"BB"},{"block":[[{"token":"ifExpr"},{"expr":"CCC"},{"block":[[{"token":"prop"},{"token":"DDD"},{"token":"add"},{"value":1}]]}]]}],[{"token":"prop"},{"token":"EEE"},{"token":"set"},{"value":0}]]}]]'
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
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},{"block":[[{"token":"prop"},{"token":"X"},{"token":"set"},{"value":10}],[{"token":"ifExpr"},{"expr":"X"},{"block":[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]},{"block":[[{"token":"prop"},{"token":"D"},{"token":"delete"}]]}]]}]]'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifExpr = {
  text: `
ifExpr {{ A }} [[
  dbgOut "true that"
]]
  `,
  expect:
    '[[{"token":"ifExpr"},{"expr":"A"},{"block":[[{"token":"dbgOut"},{"string":"true that"}]]}]]'
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
    '[[{"token":"ifExpr"},{"expr":"A"},{"block":[[{"comment":"comment A"}],[{"token":"prop"},{"token":"A"},{"token":"setTo"},{"value":1}],[{"token":"ifExpr"},{"expr":"B"},{"block":[[{"comment":"comment B"}],[{"token":"prop"},{"token":"B"},{"token":"setTo"},{"value":2}]]}]]}]]'
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
