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
    '[[{"directive":"#"},{"identifier":"BLUEPRINT"},{"identifier":"Bee"}],[{"directive":"#"},{"identifier":"PROGRAM"},{"identifier":"DEFINE"}],[{"comment":"what all agent instances use"}],[{"identifier":"useFeature"},{"identifier":"Costume"}],[{"identifier":"useFeature"},{"identifier":"Movement"}],[{"identifier":"addProp"},{"identifier":"foodLevel"},{"identifier":"Number"},{"value":50}],[{"identifier":"featCall"},{"identifier":"Costume"},{"identifier":"setCostume"},{"string":"bunny.json"},{"value":1}],[{"directive":"#"},{"identifier":"PROGRAM"},{"identifier":"UPDATE"}],[{"comment":"executed on every sim tick"}],[{"identifier":"prop"},{"objref":["agent","skin"]},{"identifier":"setTo"},{"string":"bunny.json"}],[{"identifier":"ifExpr"},{"expr":"true"},{"block":[[{"identifier":"ifExpr"},{"expr":"false"},{"block":[[{"identifier":"dbgOut"},{"string":"true"}]]},{"block":[[{"identifier":"dbgOut"},{"string":"chained blocks work"}]]}]]}]]'
};

export default Bee;
