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
  expect: `[[{"directive":"#"},{"token":"BLUEPRINT"},{"token":"Moth"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"DEFINE"}],[{"token":"useFeature"},{"token":"Costume"}],[{"token":"featCall"},{"token":"Costume"},{"token":"setCostume"},{"string":"bee.json"},{"value":0}],[{"line":""}],[{"comment":"COLOR"}],[{"token":"featCall"},{"token":"Costume"},{"token":"initHSVColorScale"},{"value":0},{"value":0},{"value":1},{"string":"value"},{"value":11}],[{"token":"featProp"},{"token":"Costume"},{"token":"colorScaleIndex"},{"token":"setTo"},{"value":9}],[{"line":""}],[{"comment":"Fully visible"}],[{"token":"prop"},{"token":"alpha"},{"token":"setTo"},{"value":1}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":1}],[{"line":""}],[{"token":"useFeature"},{"token":"Movement"}],[{"token":"featProp"},{"token":"Movement"},{"token":"useAutoOrientation"},{"token":"setTo"},{"token":true}],[{"token":"featProp"},{"token":"Movement"},{"token":"distance"},{"token":"setTo"},{"value":3}],[{"comment":"featCall Movement wanderUntilInside TreeFoliage"}],[{"line":""}],[{"token":"useFeature"},{"token":"Physics"}],[{"token":"featProp"},{"token":"Physics"},{"token":"scale"},{"token":"setTo"},{"value":0.5}],[{"line":""}],[{"token":"useFeature"},{"token":"Touches"}],[{"token":"featCall"},{"token":"Touches"},{"token":"monitor"},{"token":"TreeTrunk"},{"token":"c2b"}],[{"token":"featCall"},{"token":"Touches"},{"token":"monitor"},{"token":"TreeFoliage"},{"token":"c2c"},{"token":"c2b"},{"token":"b2b"},{"token":"binb"}],[{"line":""}],[{"comment":"allow removal by  Predator"}],[{"comment":"allow spawning"}],[{"token":"useFeature"},{"token":"Population"}],[{"line":""}],[{"comment":"allow Predator to see us"}],[{"token":"useFeature"},{"token":"Vision"}],[{"line":""}],[{"token":"addProp"},{"token":"energyLevel"},{"token":"Number"},{"value":50}],[{"token":"prop"},{"token":"energyLevel"},{"token":"setMax"},{"value":100}],[{"token":"prop"},{"token":"energyLevel"},{"token":"setMin"},{"value":0}],[{"line":""}],[{"token":"useFeature"},{"token":"AgentWidgets"}],[{"token":"featCall"},{"token":"AgentWidgets"},{"token":"bindMeterTo"},{"token":"energyLevel"}],[{"comment":"hide text"}],[{"token":"featProp"},{"token":"AgentWidgets"},{"token":"text"},{"token":"setTo"},{"string":""}],[{"comment":"Plot energy level"}],[{"token":"featCall"},{"token":"AgentWidgets"},{"token":"bindGraphTo"},{"token":"energyLevel"},{"value":30}],[{"line":""}],[{"comment":"// random color: shift hue and value"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"line":""}],[{"comment":"random start position"}],[{"comment":"featCall Movement setRandomStart"}],[{"line":""}],[{"comment":"allow access to global darkMoths/lightMoths values"}],[{"token":"useFeature"},{"token":"Global"}],[{"line":""}],[{"token":"useFeature"},{"token":"Cursor"}],[{"line":""}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"INIT"}],[{"comment":"Don't randomize here or we'll keep getting new colors"}],[{"comment":"Set randomize in # PROGRAM DEFINE"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"comment":"featCall Movement setRandomStart"}],[{"line":""}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"UPDATE"}],[{"token":"every"},{"value":0.25},{"block":[[{"token":"prop"},{"token":"alpha"},{"token":"sub"},{"value":0.1}],[{"token":"prop"},{"token":"energyLevel"},{"token":"sub"},{"value":2}]]}],[{"token":"every"},{"value":1},{"block":[[{"comment":"Blink every second if invisible"}],[{"token":"ifExpr"},{"expr":"!agent.prop.Vision.visionable.value"},{"block":[[{"token":"featCall"},{"token":"Costume"},{"token":"setGlow"},{"value":0.05}]]}]]}],[{"token":"when"},{"token":"Moth"},{"token":"centerFirstTouches"},{"token":"TreeTrunk"},{"block":[[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setGlow"},{"value":2}],[{"token":"prop"},{"objref":["Moth","energyLevel"]},{"token":"add"},{"value":50}]]}],[{"token":"when"},{"token":"Moth"},{"token":"centerTouches"},{"token":"TreeTrunk"},{"block":[[{"token":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2 )"},{"block":[[{"comment":"color matches trunk, fade away and set un-visionable"}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}],[{"token":"featProp"},{"token":"Vision"},{"token":"visionable"},{"token":"setTo"},{"token":false}]]}],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose"}],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]}],[{"token":"every"},{"value":1},{"block":[[{"token":"ifExpr"},{"expr":"agent.getProp('energyLevel').value > 90 && !agent.isInert"},{"block":[[{"comment":"dbgOut 'SPAWN!'"}],[{"token":"featCall"},{"token":"Population"},{"token":"spawnChild"},{"block":[[{"comment":"new spawn init script (not current agent)"}],[{"comment":"spawn randomly darker"}],[{"token":"featProp"},{"token":"Costume"},{"token":"colorValue"},{"token":"subRnd"},{"value":0.5}],[{"token":"prop"},{"token":"x"},{"token":"addRnd"},{"value":-20},{"value":20}],[{"token":"prop"},{"token":"y"},{"token":"addRnd"},{"value":-20},{"value":20}],[],[{"comment":"add point to global graphs"}],[{"token":"ifExpr"},{"expr":"agent.prop.Costume.colorValue.value < 0.5"},{"block":[[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"lightMoths"},{"token":"add"},{"value":0}],[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"darkMoths"},{"token":"add"},{"value":1}]]},{"block":[[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"lightMoths"},{"token":"add"},{"value":1}],[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"darkMoths"},{"token":"add"},{"value":0}]]}]]}],[{"token":"prop"},{"token":"energyLevel"},{"token":"sub"},{"value":50}]]}]]}]]}],[{"token":"when"},{"token":"Moth"},{"token":"centerFirstTouches"},{"token":"TreeFoliage"},{"block":[[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setGlow"},{"value":2}],[{"token":"prop"},{"objref":["Moth","energyLevel"]},{"token":"add"},{"value":80}],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose"}],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]}]]}],[{"token":"when"},{"token":"Moth"},{"token":"centerTouches"},{"token":"TreeFoliage"},{"block":[[{"token":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2)"},{"block":[[{"comment":"color matches, fade away and set un-visionable"}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}],[{"token":"featProp"},{"objref":["Moth","Vision"]},{"token":"visionable"},{"token":"setTo"},{"token":false}]]}],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},{"block":[[{"comment":"show wings folded pose (when not inert)"}],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]}],[{"token":"ifExpr"},{"expr":"Moth.prop.energyLevel.value < 60"},{"block":[[{"comment":"go search for new tree if energyLevel is low"}],[{"comment":"featCall Moth.Movement setMovementType wander"}]]}]]}],[{"token":"when"},{"token":"Moth"},{"token":"lastTouches"},{"token":"TreeFoliage"},{"block":[[{"comment":"seek foliage again after you wander off the old foliage"}],[{"comment":"featCall Moth.Movement wanderUntilInside TreeFoliage"}]]}],[{"comment":"overide all"}],[{"token":"ifExpr"},{"expr":"agent.getFeatProp('Movement', 'isMoving').value"},{"block":[[{"comment":"visible when moving"}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":1}],[{"token":"prop"},{"token":"alpha"},{"token":"add"},{"value":0.25}],[{"token":"featProp"},{"token":"Vision"},{"token":"visionable"},{"token":"setTo"},{"token":true}],[{"token":"featCall"},{"token":"Costume"},{"token":"setPose"},{"value":0}]]}],[{"token":"ifExpr"},{"expr":"agent.getProp('isInert').value"},{"block":[[{"comment":"always faded if inert"}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}]]}]]`
};

export default Moth;
