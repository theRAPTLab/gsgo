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
  ctx: {},
  stack: []
};
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
  ctx: {},
  stack: []
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const Script = {
  simpleIfExpr,
  bee
  // moth
};
