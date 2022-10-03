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

const Moth = {
  text: `
# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume "bee.json" 0

// COLOR
featCall Costume initHSVColorScale 0 0 1 "value" 11
featProp Costume colorScaleIndex setTo 9

// Fully visible
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3
// featCall Movement wanderUntilInside TreeFoliage

useFeature Physics
featProp Physics scale setTo 0.5

useFeature Touches
featCall Touches monitor TreeTrunk c2b
featCall Touches monitor TreeFoliage c2c c2b b2b binb

// allow removal by  Predator
// allow spawning
useFeature Population

// allow Predator to see us
useFeature Vision

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo energyLevel
// hide text
featProp AgentWidgets text setTo ""
// Plot energy level
featCall AgentWidgets bindGraphTo energyLevel 30

// // random color: shift hue and value
// featCall Costume randomizeColorHSV 0.1 0 0.2

// random start position
// featCall Movement setRandomStart

// allow access to global darkMoths/lightMoths values
useFeature Global

useFeature Cursor

# PROGRAM INIT
// Don't randomize here or we'll keep getting new colors
// Set randomize in # PROGRAM DEFINE
// featCall Costume randomizeColorHSV 0.1 0 0.2
// featCall Movement setRandomStart

# PROGRAM UPDATE
every 0.25 [[
  prop alpha sub 0.1
  prop energyLevel sub 2
]]
every 1 [[
  // Blink every second if invisible
  ifExpr {{ !agent.prop.Vision.visionable.value }} [[
    featCall Costume setGlow 0.05
  ]]
]]
when Moth centerFirstTouches TreeTrunk [[
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel add 50
]]
when Moth centerTouches TreeTrunk [[
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2 ) }} [[
    // color matches trunk, fade away and set un-visionable
    prop alpha setMin 0.1
    featProp Vision visionable setTo false
  ]]
  ifExpr {{ !Moth.prop.isInert.value }} [[
    // show wings folded pose
    featCall Moth.Costume setPose 4
  ]]
  every 1 [[
    ifExpr {{ agent.getProp('energyLevel').value > 90 && !agent.isInert }} [[
      // dbgOut 'SPAWN!'
      featCall Population spawnChild [[
        // new spawn init script (not current agent)
        // spawn randomly darker
        featProp Costume colorValue subRnd 0.5
        prop x addRnd -20 20
        prop y addRnd -20 20

        // add point to global graphs
        ifExpr {{ agent.prop.Costume.colorValue.value < 0.5 }} [[
          featCall Global globalProp lightMoths add 0
          featCall Global globalProp darkMoths add 1
        ]] [[
          featCall Global globalProp lightMoths add 1
          featCall Global globalProp darkMoths add 0
        ]]
      ]]
      prop energyLevel sub 50
    ]]
  ]]
]]
when Moth centerFirstTouches TreeFoliage [[
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel add 80
  ifExpr {{ !Moth.prop.isInert.value }} [[
    // show wings folded pose
    featCall Moth.Costume setPose 4
  ]]
]]
when Moth centerTouches TreeFoliage [[
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2) }} [[
    // color matches, fade away and set un-visionable
    prop alpha setMin 0.1
    featProp Moth.Vision visionable setTo false
  ]]
  ifExpr {{ !Moth.prop.isInert.value }} [[
    // show wings folded pose (when not inert)
    featCall Moth.Costume setPose 4
  ]]
  ifExpr {{ Moth.prop.energyLevel.value < 60 }} [[
    // go search for new tree if energyLevel is low
    // featCall Moth.Movement setMovementType wander
  ]]
]]
when Moth lastTouches TreeFoliage [[
  // seek foliage again after you wander off the old foliage
  // featCall Moth.Movement wanderUntilInside TreeFoliage
]]
// overide all
ifExpr {{ agent.getFeatProp('Movement', 'isMoving').value }} [[
  // visible when moving
  prop alpha setMin 1
  prop alpha add 0.25
  featProp Vision visionable setTo true
  featCall Costume setPose 0
]]
ifExpr {{ agent.getProp('isInert').value }} [[
  // always faded if inert
  prop alpha setMin 0.1
]]
  `,
  expect: `[[{"directive":"#"},{"identifier":"BLUEPRINT"},{"identifier":"Moth"}],[{"directive":"#"},{"identifier":"PROGRAM"},{"identifier":"DEFINE"}],[{"identifier":"useFeature"},{"identifier":"Costume"}],[{"identifier":"featCall"},{"identifier":"Costume"},{"identifier":"setCostume"},{"string":"bee.json"},{"value":0}],[{"line":""}],[{"comment":"COLOR"}],[{"identifier":"featCall"},{"identifier":"Costume"},{"identifier":"initHSVColorScale"},{"value":0},{"value":0},{"value":1},{"string":"value"},{"value":11}],[{"identifier":"featProp"},{"identifier":"Costume"},{"identifier":"colorScaleIndex"},{"identifier":"setTo"},{"value":9}],[{"line":""}],[{"comment":"Fully visible"}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setTo"},{"value":1}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setMin"},{"value":1}],[{"line":""}],[{"identifier":"useFeature"},{"identifier":"Movement"}],[{"identifier":"featProp"},{"identifier":"Movement"},{"identifier":"useAutoOrientation"},{"identifier":"setTo"},{"identifier":true}],[{"identifier":"featProp"},{"identifier":"Movement"},{"identifier":"distance"},{"identifier":"setTo"},{"value":3}],[{"comment":"featCall Movement wanderUntilInside TreeFoliage"}],[{"line":""}],[{"identifier":"useFeature"},{"identifier":"Physics"}],[{"identifier":"featProp"},{"identifier":"Physics"},{"identifier":"scale"},{"identifier":"setTo"},{"value":0.5}],[{"line":""}],[{"identifier":"useFeature"},{"identifier":"Touches"}],[{"identifier":"featCall"},{"identifier":"Touches"},{"identifier":"monitor"},{"identifier":"TreeTrunk"},{"identifier":"c2b"}],[{"identifier":"featCall"},{"identifier":"Touches"},{"identifier":"monitor"},{"identifier":"TreeFoliage"},{"identifier":"c2c"},{"identifier":"c2b"},{"identifier":"b2b"},{"identifier":"binb"}],[{"line":""}],[{"comment":"allow removal by  Predator"}],[{"comment":"allow spawning"}],[{"identifier":"useFeature"},{"identifier":"Population"}],[{"line":""}],[{"comment":"allow Predator to see us"}],[{"identifier":"useFeature"},{"identifier":"Vision"}],[{"line":""}],[{"identifier":"addProp"},{"identifier":"energyLevel"},{"identifier":"Number"},{"value":50}],[{"identifier":"prop"},{"identifier":"energyLevel"},{"identifier":"setMax"},{"value":100}],[{"identifier":"prop"},{"identifier":"energyLevel"},{"identifier":"setMin"},{"value":0}],[{"line":""}],[{"identifier":"useFeature"},{"identifier":"AgentWidgets"}],[{"identifier":"featCall"},{"identifier":"AgentWidgets"},{"identifier":"bindMeterTo"},{"identifier":"energyLevel"}],[{"comment":"hide text"}],[{"identifier":"featProp"},{"identifier":"AgentWidgets"},{"identifier":"text"},{"identifier":"setTo"},{"string":""}],[{"comment":"Plot energy level"}],[{"identifier":"featCall"},{"identifier":"AgentWidgets"},{"identifier":"bindGraphTo"},{"identifier":"energyLevel"},{"value":30}],[{"line":""}],[{"comment":"// random color: shift hue and value"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"line":""}],[{"comment":"random start position"}],[{"comment":"featCall Movement setRandomStart"}],[{"line":""}],[{"comment":"allow access to global darkMoths/lightMoths values"}],[{"identifier":"useFeature"},{"identifier":"Global"}],[{"line":""}],[{"identifier":"useFeature"},{"identifier":"Cursor"}],[{"line":""}],[{"directive":"#"},{"identifier":"PROGRAM"},{"identifier":"INIT"}],[{"comment":"Don't randomize here or we'll keep getting new colors"}],[{"comment":"Set randomize in # PROGRAM DEFINE"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"comment":"featCall Movement setRandomStart"}],[{"line":""}],[{"directive":"#"},{"identifier":"PROGRAM"},{"identifier":"UPDATE"}],[{"identifier":"every"},{"value":0.25},{"block":[[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"sub"},{"value":0.1}],[{"identifier":"prop"},{"identifier":"energyLevel"},{"identifier":"sub"},{"value":2}]]}],[{"identifier":"every"},{"value":1},{"block":[[{"comment":"Blink every second if invisible"}],[{"identifier":"ifExpr"},{"expr":"!agent.prop.Vision.visionable.value"},{"block":[[{"identifier":"featCall"},{"identifier":"Costume"},{"identifier":"setGlow"},{"value":0.05}]]}]]}],[{"identifier":"when"},{"identifier":"Moth"},{"identifier":"centerFirstTouches"},{"identifier":"TreeTrunk"},{"block":[[{"identifier":"featCall"},{"objref":["Moth","Costume"]},{"identifier":"setGlow"},{"value":2}],[{"identifier":"prop"},{"objref":["Moth","energyLevel"]},{"identifier":"add"},{"value":50}]]}],[{"identifier":"when"},{"identifier":"Moth"},{"identifier":"centerTouches"},{"identifier":"TreeTrunk"},{"block":[[{"identifier":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2 )"},{"block":[[{"comment":"color matches trunk, fade away and set un-visionable"}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setMin"},{"value":0.1}],[{"identifier":"featProp"},{"identifier":"Vision"},{"identifier":"visionable"},{"identifier":"setTo"},{"identifier":false}]]}],[{"identifier":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose"}],[{"identifier":"featCall"},{"objref":["Moth","Costume"]},{"identifier":"setPose"},{"value":4}]]}],[{"identifier":"every"},{"value":1},{"block":[[{"identifier":"ifExpr"},{"expr":"agent.getProp('energyLevel').value > 90 && !agent.isInert"},{"block":[[{"comment":"dbgOut 'SPAWN!'"}],[{"identifier":"featCall"},{"identifier":"Population"},{"identifier":"spawnChild"},{"block":[[{"comment":"new spawn init script (not current agent)"}],[{"comment":"spawn randomly darker"}],[{"identifier":"featProp"},{"identifier":"Costume"},{"identifier":"colorValue"},{"identifier":"subRnd"},{"value":0.5}],[{"identifier":"prop"},{"identifier":"x"},{"identifier":"addRnd"},{"value":-20},{"value":20}],[{"identifier":"prop"},{"identifier":"y"},{"identifier":"addRnd"},{"value":-20},{"value":20}],[],[{"comment":"add point to global graphs"}],[{"identifier":"ifExpr"},{"expr":"agent.prop.Costume.colorValue.value < 0.5"},{"block":[[{"identifier":"featCall"},{"identifier":"Global"},{"identifier":"globalProp"},{"identifier":"lightMoths"},{"identifier":"add"},{"value":0}],[{"identifier":"featCall"},{"identifier":"Global"},{"identifier":"globalProp"},{"identifier":"darkMoths"},{"identifier":"add"},{"value":1}]]},{"block":[[{"identifier":"featCall"},{"identifier":"Global"},{"identifier":"globalProp"},{"identifier":"lightMoths"},{"identifier":"add"},{"value":1}],[{"identifier":"featCall"},{"identifier":"Global"},{"identifier":"globalProp"},{"identifier":"darkMoths"},{"identifier":"add"},{"value":0}]]}]]}],[{"identifier":"prop"},{"identifier":"energyLevel"},{"identifier":"sub"},{"value":50}]]}]]}]]}],[{"identifier":"when"},{"identifier":"Moth"},{"identifier":"centerFirstTouches"},{"identifier":"TreeFoliage"},{"block":[[{"identifier":"featCall"},{"objref":["Moth","Costume"]},{"identifier":"setGlow"},{"value":2}],[{"identifier":"prop"},{"objref":["Moth","energyLevel"]},{"identifier":"add"},{"value":80}],[{"identifier":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose"}],[{"identifier":"featCall"},{"objref":["Moth","Costume"]},{"identifier":"setPose"},{"value":4}]]}]]}],[{"identifier":"when"},{"identifier":"Moth"},{"identifier":"centerTouches"},{"identifier":"TreeFoliage"},{"block":[[{"identifier":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2)"},{"block":[[{"comment":"color matches, fade away and set un-visionable"}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setMin"},{"value":0.1}],[{"identifier":"featProp"},{"objref":["Moth","Vision"]},{"identifier":"visionable"},{"identifier":"setTo"},{"identifier":false}]]}],[{"identifier":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose (when not inert)"}],[{"identifier":"featCall"},{"objref":["Moth","Costume"]},{"identifier":"setPose"},{"value":4}]]}],[{"identifier":"ifExpr"},{"expr":"Moth.prop.energyLevel.value < 60"},{"block":[[{"comment":"go search for new tree if energyLevel is low"}],[{"comment":"featCall Moth.Movement setMovementType wander"}]]}]]}],[{"identifier":"when"},{"identifier":"Moth"},{"identifier":"lastTouches"},{"identifier":"TreeFoliage"},{"block":[[{"comment":"seek foliage again after you wander off the old foliage"}],[{"comment":"featCall Moth.Movement wanderUntilInside TreeFoliage"}]]}],[{"comment":"overide all"}],[{"identifier":"ifExpr"},{"expr":"agent.getFeatProp('Movement', 'isMoving').value"},{"block":[[{"comment":"visible when moving"}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setMin"},{"value":1}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"add"},{"value":0.25}],[{"identifier":"featProp"},{"identifier":"Vision"},{"identifier":"visionable"},{"identifier":"setTo"},{"identifier":true}],[{"identifier":"featCall"},{"identifier":"Costume"},{"identifier":"setPose"},{"value":0}]]}],[{"identifier":"ifExpr"},{"expr":"agent.getProp('isInert').value"},{"block":[[{"comment":"always faded if inert"}],[{"identifier":"prop"},{"identifier":"alpha"},{"identifier":"setMin"},{"value":0.1}]]}]]`
};

export default Moth;
