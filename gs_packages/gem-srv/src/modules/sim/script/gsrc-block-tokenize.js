/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script parsing without keyword generation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

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
const bee = {
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
ifExpr {{true}} [[
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const moth = {
  text: `
# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

// COLOR
featCall Costume initHSVColorScale 0 0 1 'value' 11
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
featProp AgentWidgets text setTo ''
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
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
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
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2)}} [[
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
  expect: `[[{"directive":"#"},{"token":"BLUEPRINT"},{"token":"Moth"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"DEFINE"}],[{"token":"useFeature"},{"token":"Costume"}],[{"token":"featCall"},{"token":"Costume"},{"token":"setCostume"},{"string":"bee.json"},{"value":0}],[{"comment":"blank"}],[{"comment":"COLOR"}],[{"token":"featCall"},{"token":"Costume"},{"token":"initHSVColorScale"},{"value":0},{"value":0},{"value":1},{"string":"value"},{"value":11}],[{"token":"featProp"},{"token":"Costume"},{"token":"colorScaleIndex"},{"token":"setTo"},{"value":9}],[{"comment":"blank"}],[{"comment":"Fully visible"}],[{"token":"prop"},{"token":"alpha"},{"token":"setTo"},{"value":1}],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":1}],[{"comment":"blank"}],[{"token":"useFeature"},{"token":"Movement"}],[{"token":"featProp"},{"token":"Movement"},{"token":"useAutoOrientation"},{"token":"setTo"},{"token":true}],[{"token":"featProp"},{"token":"Movement"},{"token":"distance"},{"token":"setTo"},{"value":3}],[{"comment":"featCall Movement wanderUntilInside TreeFoliage"}],[{"comment":"blank"}],[{"token":"useFeature"},{"token":"Physics"}],[{"token":"featProp"},{"token":"Physics"},{"token":"scale"},{"token":"setTo"},{"value":0.5}],[{"comment":"blank"}],[{"token":"useFeature"},{"token":"Touches"}],[{"token":"featCall"},{"token":"Touches"},{"token":"monitor"},{"token":"TreeTrunk"},{"token":"c2b"}],[{"token":"featCall"},{"token":"Touches"},{"token":"monitor"},{"token":"TreeFoliage"},{"token":"c2c"},{"token":"c2b"},{"token":"b2b"},{"token":"binb"}],[{"comment":"blank"}],[{"comment":"allow removal by  Predator"}],[{"comment":"allow spawning"}],[{"token":"useFeature"},{"token":"Population"}],[{"comment":"blank"}],[{"comment":"allow Predator to see us"}],[{"token":"useFeature"},{"token":"Vision"}],[{"comment":"blank"}],[{"token":"addProp"},{"token":"energyLevel"},{"token":"Number"},{"value":50}],[{"token":"prop"},{"token":"energyLevel"},{"token":"setMax"},{"value":100}],[{"token":"prop"},{"token":"energyLevel"},{"token":"setMin"},{"value":0}],[{"comment":"blank"}],[{"token":"useFeature"},{"token":"AgentWidgets"}],[{"token":"featCall"},{"token":"AgentWidgets"},{"token":"bindMeterTo"},{"token":"energyLevel"}],[{"comment":"hide text"}],[{"token":"featProp"},{"token":"AgentWidgets"},{"token":"text"},{"token":"setTo"},{"string":""}],[{"comment":"Plot energy level"}],[{"token":"featCall"},{"token":"AgentWidgets"},{"token":"bindGraphTo"},{"token":"energyLevel"},{"value":30}],[{"comment":"blank"}],[{"comment":"// random color: shift hue and value"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"comment":"blank"}],[{"comment":"random start position"}],[{"comment":"featCall Movement setRandomStart"}],[{"comment":"blank"}],[{"comment":"allow access to global darkMoths/lightMoths values"}],[{"token":"useFeature"},{"token":"Global"}],[{"comment":"blank"}],[{"token":"useFeature"},{"token":"Cursor"}],[{"comment":"blank"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"INIT"}],[{"comment":"Don't randomize here or we'll keep getting new colors"}],[{"comment":"Set randomize in # PROGRAM DEFINE"}],[{"comment":"featCall Costume randomizeColorHSV 0.1 0 0.2"}],[{"comment":"featCall Movement setRandomStart"}],[{"comment":"blank"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"UPDATE"}],[{"token":"every"},{"value":0.25},[[{"token":"prop"},{"token":"alpha"},{"token":"sub"},{"value":0.1}],[{"token":"prop"},{"token":"energyLevel"},{"token":"sub"},{"value":2}]]],[{"token":"every"},{"value":1},[[[{"comment":"Blink every second if invisible"}]],[{"token":"ifExpr"},{"expr":"!agent.prop.Vision.visionable.value"},[[{"token":"featCall"},{"token":"Costume"},{"token":"setGlow"},{"value":0.05}]]]]],[{"token":"when"},{"token":"Moth"},{"token":"centerFirstTouches"},{"token":"TreeTrunk"},[[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setGlow"},{"value":2}],[{"token":"prop"},{"objref":["Moth","energyLevel"]},{"token":"add"},{"value":50}]]],[{"token":"when"},{"token":"Moth"},{"token":"centerTouches"},{"token":"TreeTrunk"},[[{"token":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)"},[[[{"comment":"color matches trunk, fade away and set un-visionable"}]],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}],[{"token":"featProp"},{"token":"Vision"},{"token":"visionable"},{"token":"setTo"},{"token":false}]]],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},[[[{"comment":"show wings folded pose"}]],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]],[{"token":"every"},{"value":1},[[{"token":"ifExpr"},{"expr":"agent.getProp('energyLevel').value > 90 && !agent.isInert"},[[[{"comment":"dbgOut 'SPAWN!'"}]],[{"token":"featCall"},{"token":"Population"},{"token":"spawnChild"},[[[{"comment":"new spawn init script (not current agent)"}]],[[{"comment":"spawn randomly darker"}]],[{"token":"featProp"},{"token":"Costume"},{"token":"colorValue"},{"token":"subRnd"},{"value":0.5}],[{"token":"prop"},{"token":"x"},{"token":"addRnd"},{"value":-20},{"value":20}],[{"token":"prop"},{"token":"y"},{"token":"addRnd"},{"value":-20},{"value":20}],[],[[{"comment":"add point to global graphs"}]],[{"token":"ifExpr"},{"expr":"agent.prop.Costume.colorValue.value < 0.5"},[[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"lightMoths"},{"token":"add"},{"value":0}],[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"darkMoths"},{"token":"add"},{"value":1}]],[[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"lightMoths"},{"token":"add"},{"value":1}],[{"token":"featCall"},{"token":"Global"},{"token":"globalProp"},{"token":"darkMoths"},{"token":"add"},{"value":0}]]]]],[{"token":"prop"},{"token":"energyLevel"},{"token":"sub"},{"value":50}]]]]]]],[{"token":"when"},{"token":"Moth"},{"token":"centerFirstTouches"},{"token":"TreeFoliage"},[[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setGlow"},{"value":2}],[{"token":"prop"},{"objref":["Moth","energyLevel"]},{"token":"add"},{"value":80}],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},[[[{"comment":"show wings folded pose"}]],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]]]],[{"token":"when"},{"token":"Moth"},{"token":"centerTouches"},{"token":"TreeFoliage"},[[{"token":"ifExpr"},{"expr":"Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2)"},[[[{"comment":"color matches, fade away and set un-visionable"}]],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}],[{"token":"featProp"},{"objref":["Moth","Vision"]},{"token":"visionable"},{"token":"setTo"},{"token":false}]]],[{"token":"ifExpr"},{"expr":"!Moth.prop.isInert.value"},[[[{"comment":"show wings folded pose (when not inert)"}]],[{"token":"featCall"},{"objref":["Moth","Costume"]},{"token":"setPose"},{"value":4}]]],[{"token":"ifExpr"},{"expr":"Moth.prop.energyLevel.value < 60"},[[[{"comment":"go search for new tree if energyLevel is low"}]],[[{"comment":"featCall Moth.Movement setMovementType wander"}]]]]]],[{"token":"when"},{"token":"Moth"},{"token":"lastTouches"},{"token":"TreeFoliage"},[[[{"comment":"seek foliage again after you wander off the old foliage"}]],[[{"comment":"featCall Moth.Movement wanderUntilInside TreeFoliage"}]]]],[{"comment":"overide all"}],[{"token":"ifExpr"},{"expr":"agent.getFeatProp('Movement', 'isMoving').value"},[[[{"comment":"visible when moving"}]],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":1}],[{"token":"prop"},{"token":"alpha"},{"token":"add"},{"value":0.25}],[{"token":"featProp"},{"token":"Vision"},{"token":"visionable"},{"token":"setTo"},{"token":true}],[{"token":"featCall"},{"token":"Costume"},{"token":"setPose"},{"value":0}]]],[{"token":"ifExpr"},{"expr":"agent.getProp('isInert').value"},[[[{"comment":"always faded if inert"}]],[{"token":"prop"},{"token":"alpha"},{"token":"setMin"},{"value":0.1}]]]]`
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
    '[[{"token":"ifExpr"},{"expr":"A"},{"block":[[[{"comment":"comment A"}]],[{"token":"prop"},{"token":"A"},{"token":"setTo"},{"value":1}],[{"token":"ifExpr"},{"expr":"B"},{"block":[[[{"comment":"comment B"}]],[{"token":"prop"},{"token":"B"},{"token":"setTo"},{"value":2}]]}]]}]]'
};
let a = [
  [
    { 'token': 'ifExpr' },
    { 'expr': 'A' },
    {
      'block': [
        [[{ 'comment': 'comment A' }]],
        [
          { 'token': 'prop' },
          { 'token': 'A' },
          { 'token': 'setTo' },
          { 'value': 1 }
        ],
        [
          { 'token': 'ifExpr' },
          { 'expr': 'B' },
          {
            'block': [
              [[{ 'comment': 'comment B' }]],
              [
                { 'token': 'prop' },
                { 'token': 'B' },
                { 'token': 'setTo' },
                { 'value': 2 }
              ]
            ]
          }
        ]
      ]
    }
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const Blocks = {
  block,
  blockblock,
  nblock,
  tnblock,
  nblockblock,
  ifExpr,
  bee,
  comment
  // moth
};
