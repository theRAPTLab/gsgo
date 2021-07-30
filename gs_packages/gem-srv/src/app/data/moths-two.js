export const MODEL = {
  label: 'Moths Test Act Two',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
    bgcolor: 0x4444ee
  },
  rounds: {
    options: {
      allowResetStage: false,
      noloop: true // DON'T stop after last round
    },
    roundDefs: [
      {
        id: 'r1',
        label: 'Predation Round',
        time: 100,
        intro:
          'You have 60 seconds to hide your moths.  Then the predators will come....',
        initScript: `

        `,
        outtro:
          'Could you pick up a moth?  In next round, you will make them a distribution representation?',
        endScript: `dbgOut 'END Round!'


          featCall Population agentsForEach Predator [[

            prop agent.isInert setTo true
            featCall Movement queuePosition -400 -400
          ]]

          featCall Population agentsForEach Moth [[
            featCall agent.Costume setPose 0
            prop alpha setTo 1
            //dbgOut {{ -350 + ( agent.getProp('colorIndx').value  * 70 ) }}
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
            featProp AgentWidgets text setTo ''
          ]]

          featCall Population agentsForEach TreeTrunk [[
            featProp Physics scale setTo 0.01
            prop alpha setTo 0.01
            featCall Movement queuePosition -400 400
          ]]

          featCall Population agentsForEach TreeFoliage [[
            featProp Physics scale setTo 0.01
            prop alpha setTo 0.01
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
      //isCharControllable: true,
      //isPozyxControllable: true,
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'moth.json' 0

// COLOR
featCall Costume initHSVColorScale 0 0 0 'value' 10

// Fully visible
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Physics
featProp Physics scale setTo 0.4

useFeature Touches
featCall Touches monitor TreeTrunk c2c c2b b2b binb

useFeature Population

// allow Predator to see us
useFeature Vision

addProp energyLevel Number 15
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp colorTest Number 128
prop colorTest setMax 255
prop colorTest setMin -255
prop colorTest setTo 255

addProp colorIndx Number 5
prop colorIndx setMax 11
prop colorIndx setMin 0


addProp vulnerable Number 1
prop vulnerable setMin 0
prop vulnerable setMax 1
prop vulnerable setTo 1

// allow access to global darkMoths/lightMoths values
useFeature Global

useFeature Cursor

useFeature AgentWidgets
featPropPush Costume colorScaleIndex
featPropPop AgentWidgets text

# PROGRAM INIT

# PROGRAM EVENT
onEvent Start [[
  featProp AgentWidgets text setTo ''
]]

# PROGRAM UPDATE



when Moth centerFirstTouches TreeTrunk [[
ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
  dbgOut {{ Moth.name + " will be hidden " }}
  dbgOut {{  ( Moth.prop.color.value )  }}
]] [[
  dbgOut {{ Moth.name + " will be visible " }}
]]
//dbgOut {{  ( (( Moth.prop.color.value ) % 256) - ((TreeTrunk.prop.color.value) % 256 )).toString(16) }}
exprPush {{  ( ( Moth.prop.color.value ) % 256) - ((TreeTrunk.prop.color.value) % 256 ) }}
propPop colorTest
prop Moth.energyLevel setTo 21
prop vulnerable setTo 1
]]



when Moth centerTouches TreeTrunk [[
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 2
  ]]

  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
    prop alpha setMin 0.1
    prop alpha sub 0.1
    featProp Vision visionable setTo false
    prop vulnerable setTo 0
  ]]
  [[
    prop alpha setMin 1
    prop alpha add 1
    featProp Vision visionable setTo true
    prop vulnerable setTo 1
  ]]
  prop energyLevel sub 3
  //dbgOut {{ Moth.prop.energyLevel.value }}
  ifExpr {{ Moth.prop.energyLevel.value < 1 }} [[
    featCall Moth.Cursor releaseCursor
  ]]
]]

ifExpr {{ agent.getProp('isInert').value }} [[
  featCall Costume setPose 0
  prop alpha setMin 0.1
  prop alpha setTo 0.1
  prop orientation setTo 3.14
  featProp AgentWidgets text setTo ''
]]


`
    },
    {
      id: 'Predator',
      label: 'Predator',
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

// AI Movement
featProp Movement distance setTo 4

useFeature Population
useFeature Global
useFeature Timer

# PROGRAM UPDATE


every 2 [[
  featProp Movement distance setTo 4
  featCall Movement seekNearestVisibleColor Moth
]]


when Predator centerTouchesCenter Moth [[

  // Only if Moth is not camouflaged
  ifExpr {{ Moth.getProp('vulnerable').value  > 0 }} [[
    featCall Moth.Costume setGlow 1
    prop Moth.orientation setTo 3.14
    every 0.2 [[
      prop Moth.isInert setTo true
      featCall Moth.Costume setCostume 'smallsquare.json' 0
      prop Moth.alpha setMin 0.1
      prop Moth.alpha setTo 0.1
      prop Moth.orientation setTo 3.14
      featProp Moth.AgentWidgets text setTo ''

      // Stop sim if half eaten
      ifExpr {{ Moth.callFeatMethod('Population', 'getActiveAgentsCount', 'Moth') < 8 }} [[


        featCall Predator.Timer stopRound

        // This will be added to the end of round message
        featCall Moth.AgentWidgets showMessage 'Predators have eaten over half of the Moth population!'
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

          useFeature Physics
          useFeature Population
          useFeature Movement

          # PROGRAM INIT
          prop zIndex setTo -200

          # PROGRAM UPDATE

        `
    },
    {
      id: 'Grass',
      label: 'Grass',
      script: `# BLUEPRINT Grass
          # PROGRAM DEFINE
          useFeature Costume
          featCall Costume setCostume 'square.json' 0

          useFeature Physics
          useFeature Population
          useFeature Movement

          # PROGRAM INIT
          prop zIndex setTo -300

          # PROGRAM UPDATE
          //prop agent.isInert setTo true
        `
    }
  ],
  instances: [
    {
      id: 1100,
      name: 'Grass',
      blueprint: 'Grass',
      initScript: `
    featCall Movement queuePosition 0 250
     featCall Costume setColorize 0.1 0.8 0
     featProp Physics scale setTo 3.1
     featProp Physics scaleY setTo 2`
    },
    {
      id: 1102,
      name: 'TreeTrunk1',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition -250 -140
     featCall Costume setColorizeHSV 0 0 0.75
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 2`
    },
    {
      id: 1104,
      name: 'TreeTrunk2',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition 50 -140
      featCall Costume setColorizeHSV 0 0 0.8
      featProp Physics scale setTo 0.5
      featProp Physics scaleY setTo 2`
    },
    {
      id: 1106,
      name: 'TreeTrunk3',
      blueprint: 'TreeTrunk',
      initScript: `
    featCall Movement queuePosition 250 -140
     featCall Costume setColorizeHSV 0 0 0.7
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 2`
    },

    {
      id: 1204,
      name: 'Moth4a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 300
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
      initScript: `featCall Movement queuePosition -70 300
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
      initScript: `featCall Movement queuePosition 0 300
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
      initScript: `featCall Movement queuePosition 70 300
      featProp Costume colorScaleIndex setTo 7
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 1208,
      name: 'Moth8a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 140 300
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
      initScript: `featCall Movement queuePosition 210 300
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12041,
      name: 'Moth4b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -150 300
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
      initScript: `featCall Movement queuePosition -80 300
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
      initScript: `featCall Movement queuePosition -10 300
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
      initScript: `featCall Movement queuePosition 60 300
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
      initScript: `featCall Movement queuePosition 130 300
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
      initScript: `featCall Movement queuePosition 200 300
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12042,
      name: 'Moth4c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -160 300
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
      initScript: `featCall Movement queuePosition -90 300
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
      initScript: `featCall Movement queuePosition -20 300
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
      initScript: `featCall Movement queuePosition 50 300
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
      initScript: `featCall Movement queuePosition 120 300
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
      initScript: `featCall Movement queuePosition 190 300
      featProp Costume colorScaleIndex setTo 9
      featPropPush Costume colorScaleIndex
      featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 1301,
      name: 'Predator1',
      blueprint: 'Predator',
      initScript: `
      featCall Movement queuePosition -300 -300
      prop orientation setTo 7.28
      `
    },
    {
      id: 1302,
      name: 'Predator2',
      blueprint: 'Predator',
      initScript: `
      featCall Movement queuePosition 300 -300
      prop orientation setTo 2.14
      `
    }
  ]
};
