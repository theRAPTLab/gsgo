export const MODEL = {
  label: 'Moths',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
    bgcolor: 0x000066
  },
  scripts: [
    {
      id: 'Moth',
      label: 'Moth',
      isCharControllable: true,
      isPozyxControllable: true,
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0
featCall Costume setColorize 0 1 0
// featCall Costume setColorizeHSV 0.5 1 1
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3
featCall Movement wanderUntilInside TreeFoliage

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

// random color
featCall Costume randomizeColorHSV 0.1 0 0.2

// random start position
featCall Movement setRandomStart


# PROGRAM INIT
// Don't randomize here or we'll keep getting new colorsl
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
  prop Moth.energyLevel add 100
]]
when Moth centerTouches TreeTrunk [[
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
    // color matches, fade away and set un-visionable
    prop alpha setMin 0.1
    featProp Vision visionable setTo false
  ]]
  ifExpr {{ !Moth.prop.isInert.value }} [[
    // show wings folded pose
    featCall Moth.Costume setPose 4
  ]]
  every 1 [[
    prop agent.energyLevel add 10
    ifExpr {{ agent.getProp('energyLevel').value > 99 && !agent.isInert }} [[
      dbgOut 'SPAWN!'
      featCall Population spawnChild [[
        // new spawn init script (not current agent)
        // spawn randomly darker
        featProp Costume colorValue subRnd 0.5
        prop x addRnd -50 50
        prop y addRnd -50 50
      ]]
      prop energyLevel sub 50
    ]]
  ]]
]]
when Moth centerFirstTouches TreeFoliage [[
  featProp TreeFoliage.AgentWidgets graphValue add 1
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel add 100
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
  ifExpr {{ Moth.prop.energyLevel.value < 50 }} [[
    // go search for new tree if energyLevel is low
    featCall Moth.Movement setMovementType wander
  ]]
]]
when Moth lastTouches TreeFoliage [[
  featCall Moth.Movement wanderUntilInside TreeFoliage
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
`
    },
    {
      id: 'Predator',
      label: 'Predator',
      isCharControllable: true,
      isPozyxControllable: false,
      script: `# BLUEPRINT Predator
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

useFeature Physics
useFeature Touches
featCall Touches monitor Moth c2c
featCall Touches monitor TreeFoliage binb

// needed for Seek
useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Vision
featCall Vision monitor Moth
featCall Vision setViewDistance 500
featCall Vision setViewAngle 45

// featCall Movement seekNearestVisible Moth
featProp Movement distance setTo 4

# PROGRAM UPDATE
when Predator isInside TreeFoliage [[
  featCall Predator.Costume setGlow 1
]]
when Predator sees Moth [[
  prop Moth.alpha setMin 1
  featCall Moth.Costume setGlow 0.1
]]
when Predator doesNotSee Moth [[
  // Moth should naturally go back to 0.1 no need for this call
  // prop Moth.alpha setMin 0.1
]]
when Predator centerTouchesCenter Moth [[
  featCall Moth.Costume setGlow 1
  featCall Moth.Movement jitterRotate
  every 2 [[
    // featCall Moth.Population removeAgent
    prop Moth.isInert setTo true
    featCall Moth.Costume setCostume 'flower.json' 0
    featCall Predator.Costume setGlow 1
  ]]
]]
`
    },
    {
      id: 'TreeTrunk',
      label: 'TreeTrunk',
      script: `# BLUEPRINT TreeTrunk
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'lightbeam.json' 0
featCall Costume setColorize 0.2 0.3 0

useFeature Physics

# PROGRAM INIT
prop zIndex setTo -200
`
    },
    {
      id: 'TreeFoliage',
      label: 'TreeFoliage',
      script: `# BLUEPRINT TreeFoliage
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'circle.json' 0
featCall Costume setColorize 0 1 0

useFeature Physics
useFeature AgentWidgets

# PROGRAM INIT
prop zIndex setTo -200
`
    },
    {
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
# PROGRAM DEFINE
prop skin setTo 'onexone'
useFeature Population
useFeature AgentWidgets
featProp AgentWidgets text setTo 'Num Dark Moths'


`
    }
  ],
  instances: [
    //     {
    //       id: 1101,
    //       name: 'Tree1',
    //       blueprint: 'TreeTrunk',
    //       initScript: `prop x setTo -200
    // prop y setTo 200
    // featCall Costume setColorize 0.3 0.2 0
    // featProp Physics scale setTo 0.3
    // featProp Physics scaleY setTo 2`
    //     },
    {
      id: 1102,
      name: 'TreeFoliage1',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo -200
prop y setTo -150
featCall Costume setColorize 0.1 0.3 0
featProp Physics scale setTo 1
featProp Physics scaleY setTo 1.2`
    },
    //     {
    //       id: 1105,
    //       name: 'Tree3',
    //       blueprint: 'TreeTrunk',
    //       initScript: `prop x setTo 250
    // prop y setTo 200
    // featCall Costume setColorize 0.4 0.3 0
    // featProp Physics scale setTo 0.4
    // featProp Physics scaleY setTo 2`
    //     },
    {
      id: 1106,
      name: 'TreeFoliage3',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo 250
  prop y setTo -150
  featCall Costume setColorize 0.8 0.7 0
  featProp Physics scale setTo 0.8
  featProp Physics scaleY setTo 1.4`
    },
    //     {
    //       id: 1103,
    //       name: 'Tree2',
    //       blueprint: 'TreeTrunk',
    //       initScript: `prop x setTo 0
    // prop y setTo 200
    // featCall Costume setColorize 0.2 0.2 0
    // featProp Physics scale setTo 0.6
    // featProp Physics scaleY setTo 2`
    //     },
    {
      id: 1104,
      name: 'TreeFoliage2',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo 0
prop y setTo -150
featCall Costume setColorize 0.2 0.7 0
featProp Physics scale setTo 1
featProp Physics scaleY setTo 1`
    },
    {
      id: 1201,
      name: 'Moth1',
      blueprint: 'Moth',
      initScript: `//prop x setTo 0
//    prop y setTo -400
featCall Movement queuePosition 100 0
prop alpha setTo 0.02`
    },
    //     {
    //       id: 1202,
    //       name: 'Moth2',
    //       blueprint: 'Moth',
    //       initScript: `//prop x setTo 0
    // //    prop y setTo -100
    // featCall Movement queuePosition -200 -400
    // prop alpha setTo 1`
    //     },
    //     {
    //       id: 1301,
    //       name: 'Predator1',
    //       blueprint: 'Predator',
    //       initScript: `prop x setTo 250
    // prop y setTo -100
    // prop alpha setTo 1`
    //     }
    {
      id: 1401,
      name: 'Reporter1',
      blueprint: 'Reporter',
      initScript: `prop x setTo 450
prop y setTo 300`
    }
  ]
};
