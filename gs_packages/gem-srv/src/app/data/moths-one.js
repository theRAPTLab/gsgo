export const MODEL = {
  label: 'Moths Activity One',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
    bgcolor: 0x4444ff
  },
  rounds: {
    options: {
      allowResetStage: false,
      noloop: true // if true, stop after last round
    },
    roundDefs: [
      {
        id: 'r1',
        label: 'Predation Round',
        time: 60,
        intro:
          'A population of moths is in the forest. They are delicious food for birds (predators)',
        outtro: 'Did moths of some colors survive better than others?',
        initScript: `dbgOut 'roundDef: Round1'
`,

        endScript: `dbgOut 'END Round!'

        featCall Population agentsForEach Moth [[
          prop alpha setTo 1
          dbgOut {{ -350 + ( agent.getProp('colorIndx').value  * 70 ) }}
          featCall Movement queuePosition 0 0
          exprPush {{ -350 + ( agent.getProp('colorIndx').value  * 70 ) }}
          propPop x
          prop y setTo 0
          prop y addRnd -300 300
          featCall Movement jitterPos -2 2
        ]]

        featCall Population agentsForEachActive Moth [[
          featCall Movement setMovementType 'static'
          prop orientation setTo 3.14
          featProp Movement useAutoOrientation setTo false
          prop alpha setTo 1
        ]]

        featCall Population agentsForEach TreeTrunk [[
          featProp Physics scale setTo 0.01
          prop alpha setTo 0
          featCall Movement queuePosition -400 400
        ]]
`
      }
    ]
  },
  scripts: [
    {
      id: 'Moth',
      label: 'Moth',
      isCharControllable: false,
      isPozyxControllable: false, // use Cursor instead
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'moth.json' 0

// COLOR
featCall Costume initHSVColorScale 0 0 1 'value' 11


// Start out visible so costumes can be picked up
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3

useFeature Physics
featProp Physics scale setTo 0.4

useFeature Touches
featCall Touches monitor TreeTrunk c2c c2b b2b binb

useFeature Population
useFeature Vision

addProp colorIndx Number 5
prop colorIndx setMax 11
prop colorIndx setMin 0

addProp energyLevel Number 30
prop energyLevel addRnd 10 30
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp living Number 1
prop living setMax 1
prop living setMin 0

addProp vulnerable Number 1
prop vulnerable setMax 1
prop vulnerable setMin 0

addProp moving Number 1
prop moving setMax 1
prop moving setMin 0


useFeature AgentWidgets
featPropPush Costume colorScaleIndex
featPropPop AgentWidgets text

useFeature Global

# PROGRAM EVENT
onEvent Start [[
  propPush colorIndx
  featPropPop Costume colorScaleIndex
  featCall Movement setRandomDirection
  featCall Movement wanderUntilInside TreeTrunk
  prop vulnerable setTo 1
  prop moving setTo 1
]]


# PROGRAM UPDATE

every 1 [[
   ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    prop moving setTo 1
    featCall Movement setMovementType 'wander' 3
    prop alpha setMin 1
    prop alpha add 1
   ]]
]]


when Moth centerFirstTouches TreeTrunk [[
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel setTo 50
  prop Moth.energyLevel addRnd 0 20
  prop Moth.moving setTo 0
]]

when Moth centerTouches TreeTrunk [[
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 4
  ]]

  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
    prop alpha setMin 0.1
    prop vulnerable setTo 0
  ]] [[
    prop alpha setMin 1
    prop vulnerable setTo 1
  ]]

  every 0.1 [[
    prop energyLevel sub 2
    prop alpha sub 0.1
  ]]

  ifExpr {{ Moth.prop.energyLevel.value < 1 }} [[
    prop moving setTo 1
    featCall Movement setMovementType 'wander' 3
    prop alpha setMin 1
    prop alpha add 1
  ]]
]]

when Moth lastTouches TreeTrunk [[
  featCall Moth.Movement wanderUntilInside TreeTrunk
  prop Moth.vulnerable setTo 1
  prop Moth.moving setTo 1
]]

// Costume overide all
ifExpr {{ agent.getFeatProp('Movement', 'isMoving').value }} [[
  featCall Costume setPose 0
  prop alpha setMin 1
  prop alpha add 1
  featProp Vision visionable setTo true
  prop moving setTo 1
]]

ifExpr {{ agent.getProp('isInert').value }} [[
  prop alpha setMin 0.1
  prop alpha sub 1
  prop orientation setTo 3.14
  featProp AgentWidgets text setTo ''
]]
`
    },
    {
      id: 'Predator',
      label: 'Predator',
      isCharControllable: true,
      isPozyxControllable: true,
      script: `# BLUEPRINT Predator

# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

useFeature Physics
useFeature Touches
featCall Touches monitor Moth c2c

// needed for Seek
useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Vision
featCall Vision monitor Moth
featProp Vision viewDistance setTo 250
featProp Vision viewAngle setTo 90
featProp Vision colorHueDetectionThreshold setTo 0.2
featProp Vision colorValueDetectionThreshold setTo 0.2

useFeature Global
useFeature Timer

# PROGRAM UPDATE

when Predator centerTouchesCenter Moth [[

  // Only if Moth is not camouflaged
  ifExpr {{ Moth.getProp('vulnerable').value  > 0 }} [[
    featCall Moth.Costume setGlow 1
    prop Moth.orientation setTo 3.14
    //featCall Moth.Movement jitterRotate
    every 0.2 [[
      prop Moth.isInert setTo true
      featCall Moth.Costume setCostume 'smallsquare.json' 0
      prop Moth.alpha setMin 0.1
      prop Moth.alpha sub 1
      prop Moth.orientation setTo 3.14
      featProp Moth.AgentWidgets text setTo ''

      // Stop sim if half eaten
      ifExpr {{ Moth.callFeatMethod('Population', 'getActiveAgentsCount', 'Moth') < 16 }} [[


        featCall Predator.Timer stopRound

        // This will be added to the end of round message
        featCall Moth.AgentWidgets showMessage 'You have eaten half of the Moth population!'
    ]]
  ]]
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
      featCall Costume setCostume 'square.json' 0
      featCall Costume setColorize 0 0 0.9

      useFeature Physics
      useFeature AgentWidgets
      useFeature Movement


      # PROGRAM INIT
      prop zIndex setTo -200

      # PROGRAM UPDATE
`
    }
  ],
  instances: [
    {
      id: 1102,
      name: 'TreeTrunk1',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo -200
     prop y setTo -150
     featCall Costume setColorizeHSV 0 0 0.7
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 3`
    },
    {
      id: 1106,
      name: 'TreeTrunk2',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo 250
     prop y setTo -150
     featCall Costume setColorizeHSV 0 0 0.6
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 3`
    },
    {
      id: 1104,
      name: 'TreeTrunk3',
      blueprint: 'TreeTrunk',
      initScript: `prop x setTo 100
      prop y setTo -150
      featCall Costume setColorizeHSV 0 0 0.8
      featProp Physics scale setTo 0.5
      featProp Physics scaleY setTo 3`
    },

    {
      id: 1202,
      name: 'Moth2a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -280 0
      featProp Costume colorScaleIndex setTo 2
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 2
`
    },
    {
      id: 1203,
      name: 'Moth3a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -210 0
      featProp Costume colorScaleIndex setTo 3
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 3
`
    },
    {
      id: 1204,
      name: 'Moth4a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 0
      featProp Costume colorScaleIndex setTo 4
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 1205,
      name: 'Moth5a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -70 0
      featProp Costume colorScaleIndex setTo 5
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 1206,
      name: 'Moth6a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 0 0
      featProp Costume colorScaleIndex setTo 6
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 1207,
      name: 'Moth7a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 70 0
      featProp Costume colorScaleIndex setTo 7
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 1208,
      name: 'Moth8',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 140 0
      featProp Costume colorScaleIndex setTo 8
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 1209,
      name: 'Moth9a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 210 0
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12021,
      name: 'Moth2b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -280 -100
      featProp Costume colorScaleIndex setTo 2
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 2
`
    },
    {
      id: 12031,
      name: 'Moth3b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -210 -100
      featProp Costume colorScaleIndex setTo 3
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 3
`
    },
    {
      id: 12041,
      name: 'Moth4b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 -100
      featProp Costume colorScaleIndex setTo 4
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 12051,
      name: 'Moth5b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -70 -100
      featProp Costume colorScaleIndex setTo 5
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 12061,
      name: 'Moth6b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 0 -100
      featProp Costume colorScaleIndex setTo 6
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 12071,
      name: 'Moth7b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 70 -100
      featProp Costume colorScaleIndex setTo 7
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 12081,
      name: 'Moth8b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 140 -100
      featProp Costume colorScaleIndex setTo 8
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 12091,
      name: 'Moth9b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 210 -100
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12022,
      name: 'Moth2c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -280 100
      featProp Costume colorScaleIndex setTo 2
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 2
`
    },
    {
      id: 12032,
      name: 'Moth3c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -210 100
      featProp Costume colorScaleIndex setTo 3
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 3
`
    },
    {
      id: 12042,
      name: 'Moth4c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 100
      featProp Costume colorScaleIndex setTo 4
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 12052,
      name: 'Moth5c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -70 100
      featProp Costume colorScaleIndex setTo 5
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 12062,
      name: 'Moth6c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 0 100
      featProp Costume colorScaleIndex setTo 6
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 12072,
      name: 'Moth7c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 70 100
      featProp Costume colorScaleIndex setTo 7
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 12082,
      name: 'Moth8c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 140 100
      featProp Costume colorScaleIndex setTo 8
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 12092,
      name: 'Moth9c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 210 100
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12023,
      name: 'Moth2d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -280 200
      featProp Costume colorScaleIndex setTo 2
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 2
`
    },
    {
      id: 12033,
      name: 'Moth3d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -210 200
      featProp Costume colorScaleIndex setTo 3
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 3
`
    },
    {
      id: 12043,
      name: 'Moth4d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 200
      featProp Costume colorScaleIndex setTo 4
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 12053,
      name: 'Moth5d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -70 200
      featProp Costume colorScaleIndex setTo 5
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 12063,
      name: 'Moth6d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 0 200
      featProp Costume colorScaleIndex setTo 6
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 12073,
      name: 'Moth7d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 70 200
      featProp Costume colorScaleIndex setTo 7
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 12083,
      name: 'Moth8d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 140 200
      featProp Costume colorScaleIndex setTo 8
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 12093,
      name: 'Moth9d',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 210 200
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    }
  ]
};