/* eslint-disable @typescript-eslint/quotes */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  imported by test lists
  * gsrc-block-tokenize
  * gsrc-script-compiler

  to generate the text and matching expect values, use the scriptify_test()
  command defined in scriptify-text.js.

  * The 'text' value is what will be "scriptified" into a 'script' object
  * The 'expects' value should match JSON.stringify(script)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const Bee = {
  text: `
# BLUEPRINT Bee
# PROGRAM DEFINE
// what all agent instances use
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featCall Costume setCostume "bunny.json" 1
# PROGRAM UPDATE
// executed on every sim tick
prop agent.skin setTo "bunny.json"
ifExpr {{ true }} [[
  ifExpr {{ false }} [[
    dbgOut "true"
  ]] [[
    dbgOut "chained blocks work"
  ]]
]]
  `,
  expect:
    '[[{"directive":"#"},{"token":"BLUEPRINT"},{"token":"Bee"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"DEFINE"}],[{"comment":"what all agent instances use"}],[{"token":"useFeature"},{"token":"Costume"}],[{"token":"useFeature"},{"token":"Movement"}],[{"token":"addProp"},{"token":"foodLevel"},{"token":"Number"},{"value":50}],[{"token":"featCall"},{"token":"Costume"},{"token":"setCostume"},{"string":"bunny.json"},{"value":1}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"UPDATE"}],[{"comment":"executed on every sim tick"}],[{"token":"prop"},{"objref":["agent","skin"]},{"token":"setTo"},{"string":"bunny.json"}],[{"token":"ifExpr"},{"expr":"true"},{"block":[[{"token":"ifExpr"},{"expr":"false"},{"block":[[{"token":"dbgOut"},{"string":"true"}]]},{"block":[[{"token":"dbgOut"},{"string":"chained blocks work"}]]}]]}]]'
};

export default Bee;
