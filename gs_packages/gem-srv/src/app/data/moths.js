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
prop alpha setTo 1

useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Physics
featProp Physics scale setTo 0.5

useFeature Touches
featCall Touches monitorTouchesWith TreeTrunk
featCall Touches monitorTouchesWith TreeFoliage

// allow removal by  Predator
useFeature Population

# PROGRAM INIT
featCall Costume randomizeColor 0.1 0.3 0.1
featCall Movement setRandomStart

# PROGRAM UPDATE
ifExpr {{ agent.getFeatProp('Movement', 'isMoving').value }} [[
  prop alpha add 0.25
]]
every 0.25 [[
  prop alpha sub 0.1
]]
when Moth isCenteredOn TreeTrunk [[
  ifExpr {{ Moth.getFeatProp('Movement', 'isMoving').value }} [[
    prop alpha setMin 1
    featCall Moth.Costume setPose 0
  ]] [[
    prop alpha setMin 0.1
    featCall Moth.Costume setPose 4
  ]]
]]
when Moth isCenteredOn TreeFoliage [[
  ifExpr {{ Moth.getFeatProp('Movement', 'isMoving').value }} [[
    prop alpha setMin 1
    featCall Moth.Costume setPose 0
  ]] [[
    prop alpha setMin 0.1
    featCall Moth.Costume setPose 4
  ]]
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
featCall Touches monitorTouchesWith Moth

// needed for Seek
useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Vision
featCall Vision monitor Moth
featCall Vision setViewDistance 500
featCall Vision setViewAngle 45

# PROGRAM UPDATE
when Predator sees Moth [[
  prop Moth.alpha setMin 1
  featCall Moth.Costume setGlow 0.1
]]
when Predator doesNotSee Moth [[
  prop Moth.alpha setMin 0.1
]]
when Predator isCenteredOn Moth [[
  featCall Moth.Costume setGlow 1
  featCall Moth.Movement jitterRotate
  every 2 [[
    // featCall Moth.Population removeAgent
    prop Moth.isInert setTo true
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

# PROGRAM INIT
prop zIndex setTo -200
`
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Tree1',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo -200
prop y setTo 200
featCall Costume setColorize 0.3 0.2 0
featProp Physics scale setTo 0.3
featProp Physics scaleY setTo 2`
    },
    {
      id: 1102,
      name: 'TreeFoliage1',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo -200
prop y setTo -150
featCall Costume setColorize 0.2 0.8 0
featProp Physics scale setTo 1.8
featProp Physics scaleY setTo 1.7`
    },
    {
      id: 1105,
      name: 'Tree3',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo 250
prop y setTo 200
featCall Costume setColorize 0.4 0.2 0
featProp Physics scale setTo 0.4
featProp Physics scaleY setTo 2`
    },
    {
      id: 1106,
      name: 'TreeFoliage3',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo 250
prop y setTo -150
featCall Costume setColorize 0.3 0.7 0
featProp Physics scale setTo 1.4
featProp Physics scaleY setTo 1.8`
    },
    {
      id: 1103,
      name: 'Tree2',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo 0
prop y setTo 200
featCall Costume setColorize 0.2 0.2 0
featProp Physics scale setTo 0.6
featProp Physics scaleY setTo 2`
    },
    {
      id: 1104,
      name: 'TreeFoliage2',
      blueprint: 'TreeFoliage',
      initScript: `prop x setTo 0
prop y setTo -150
featCall Costume setColorize 0.2 0.7 0
featProp Physics scale setTo 2
featProp Physics scaleY setTo 2`
    },
    {
      id: 1201,
      name: 'Moth1',
      blueprint: 'Moth',
      initScript: `prop x setTo 0
prop y setTo 0
prop alpha setTo 0.02`
    },
    {
      id: 1202,
      name: 'Moth2',
      blueprint: 'Moth',
      initScript: `prop x setTo 0
prop y setTo -100
prop alpha setTo 1`
    },
    {
      id: 1301,
      name: 'Predator1',
      blueprint: 'Predator',
      initScript: `prop x setTo 250
prop y setTo -100
featCall Movement seekNearestVisible Moth
featProp Movement distance setTo 1
prop alpha setTo 1`
    }
  ]
};
