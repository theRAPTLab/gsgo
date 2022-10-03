//STUDENTS_MAY_CHANGE
/*
Goals for Parameters for students to change in this activity are:
* Color of the tree trunks
* Number of moths
* Range of colors the moths begin at

Currently, these area all done by INSTANCES.
Algorithmically generating the instances would be great, but it didnt seem possible (i forget the barrier i ran into).
Of course, making these changes will be possible (if laborious) via Map editing.
*/
//STUDENTS_MAY_CHANGE

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

        //get the predators out of the way - they're controlled by people, so need to make them inert first.
        featCall Population agentsForEach Predator [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 -400
        ]]

        //move the living moths to top of screen and sort horizontally by color shade
        featCall Population agentsForEach Moth [[
          ifExpr {{ !agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo -200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
        ]]

        //move the markers for eaten moths to bottom of screen and sort horizontally by color shade
        featCall Population agentsForEach Moth [[
          ifExpr {{ agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo 200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
        ]]

        //make sure that the moths are aligned and stopped.
        featCall Population agentsForEachActive Moth [[
          featCall Movement setMovementType 'static'
          prop orientation setTo 3.14
          featProp Movement useAutoOrientation setTo false
          prop alpha setTo 1
        ]]

        //move the TreeTrunks out of the way
        //NOTE:  It would be better if we could change size here, but Physics doesn't work in this scripting context
        featCall Population agentsForEach TreeTrunk [[
          featProp Physics scale setTo 0.01
          prop alpha setTo 0.01
          featCall Movement queuePosition -400 400
        ]]

        //move the Foliage out of the way
        //NOTE:  It would be better if we could change size here, but Physics doesn't work in this scripting context
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
      isCharControllable: false,
      isPozyxControllable: false, // use Cursor instead
      script: `# BLUEPRINT Moth

# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'moth.json' 0

// COLOR SCALE FOR MOTHS.
// NOTE:  Intention with this scale is to map onto the [0,1] interval Value, wiht 0->0, 10->1.  But I think the indices are 1-11 not 0-10
featProp Costume colorScaleHue setTo 0
featProp Costume colorScaleSaturation setTo 0
featProp Costume colorScaleValue setTo 1
featProp Costume colorScaleType setTo 'value'
featProp Costume colorScaleSteps setTo 11
featCall Costume initHSVColorScale

// Start out visible
prop alpha setTo 1
prop alpha setMin 1
prop alpha setMax 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3

useFeature Physics
featProp Physics scale setTo 0.3

useFeature Touches
featCall Touches monitor TreeTrunk c2c c2b b2b binb

useFeature Population
useFeature Vision

//used to ensure that colorIndex is not lost, as it is in spawning.
addProp colorIndx Number 5
prop colorIndx setMax 11
prop colorIndx setMin 0

addProp energyLevel Number 0
prop energyLevel addRnd 0 10
prop energyLevel setMax 100
prop energyLevel setMin 0

//agent prop to shadow calculated visible
addProp vulnerable Number 1
prop vulnerable setMax 1
prop vulnerable setMin 0

//agent prop to shadow feature call that seems broken
addProp moving Number 1
prop moving setMax 1
prop moving setMin 0

//for by-hand animation
addProp frame Number 0
prop frame setMax 1000
prop frame setMin 0


useFeature AgentWidgets

//debugging tool - make the color scale index the text.  remove in real use.
//featPropPush Costume colorScaleIndex
//featPropPop AgentWidgets text

useFeature Global


# PROGRAM EVENT
onEvent Start [[
  propPush colorIndx
  featPropPop Costume colorScaleIndex
  featCall Movement setRandomDirection
  featCall Movement wanderUntilInside TreeTrunk
  prop vulnerable setTo 1
  prop moving setTo 1
  featProp AgentWidgets text setTo ''
  featProp Vision visionable setTo true
]]


# PROGRAM UPDATE

every 0.1 [[
  prop frame add 1
  ifExpr {{agent.getProp('frame').value > 2}} [[
    prop frame setTo 0
  ]]
  propPush frame
  featPropPop Costume currentFrame
]]


every 1 [[
   ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    prop moving setTo 1
    featCall Movement setMovementType 'wander' 3
    prop alpha setMin 1
    prop alpha add 1
   ]]
]]


when Moth centerFirstTouches TreeTrunk [[
  //featCall Moth.Costume setGlow 2
  //featCall Movement setMovementType 'static'  //this works, but the moths don't get fully inside
  featCall Moth.Costume setPose 2
  prop Moth.energyLevel setTo 70
  prop Moth.energyLevel addRnd 0 20
  prop Moth.moving setTo 0
]]

when Moth centerTouches TreeTrunk [[
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 2
  ]]

  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
    prop alpha setMin 0.1
    prop alpha setTo 0.1
    prop vulnerable setTo 0
    featProp Vision visionable setTo false
  ]] [[
    prop alpha setMin 1
    prop alpha setTo 1
    prop vulnerable setTo 1
    featProp Vision visionable setTo true
  ]]

  every 0.1 [[
    prop energyLevel sub 2
    prop alpha sub 0.1
  ]]

  ifExpr {{ Moth.prop.energyLevel.value < 1 }} [[
    prop moving setTo 1
    featCall Moth.Costume setPose 0
    //NOTE:  we'd really like to use featCall Moth.Movement wanderUntilInside TreeTrunk  -- but it doesn't work since we're ON a tree trunk
    featCall Movement setMovementType 'wander' 3
    prop alpha setMin 1
    prop alpha add 1
  ]]
]]

//this seems to fail in a not-fatal way, as moths always pass up the first tree trunk they hit, and go on to the second.
when Moth lastTouches TreeTrunk [[
  featCall Moth.Movement wanderUntilInside TreeTrunk
  prop Moth.vulnerable setTo 1
  prop Moth.alpha setMin 1
  prop Moth.alpha setTo 1
  featCall Moth.Costume setPose 0
  prop Moth.moving setTo 1
]]

// Costume overide all
// NOTE: putting a debug in here, shows that it is NOT called after very early in the simulationa.  Something broken.
ifExpr {{ agent.getFeatProp('Movement', 'isMoving').value }} [[
  featCall Costume setPose 0
  prop alpha setMin 1
  prop alpha add 1
  featProp Vision visionable setTo true
  prop moving setTo 1
]]

//double logic to ensure that post-its are invisible.
ifExpr {{ agent.getProp('isInert').value }} [[
  featCall Costume setPose 0
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
featCall Costume setCostume 'predator.json' 0

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

featProp Physics scale setTo 0.75

addProp kills Number 0
prop kills setMax 100
prop kills setMin 0

useFeature AgentWidgets
featProp AgentWidgets text setTo '0'

useFeature Population
useFeature Global
useFeature Timer

//for by-hand animation
addProp frame Number 0
prop frame setMax 1000
prop frame setMin 0

# PROGRAM UPDATE

every 0.1 [[
  prop frame add 1
  ifExpr {{agent.getProp('frame').value > 3}} [[
    prop frame setTo 0
  ]]
  propPush frame
  featPropPop Costume currentFrame
]]

when Predator centerTouchesCenter Moth [[
  // Only if Moth is not camouflaged-- NOTE: using the shadowing variable since there were bugs in the feature prop way.
  ifExpr {{ Moth.getProp('vulnerable').value  > 0 }} [[
    featCall Moth.Costume setGlow 0.2
    every 0.2 [[
      prop Moth.orientation setTo 3.14
      prop Moth.isInert setTo true
      featCall Moth.Costume setCostume 'smallsquare.json' 0
      prop Moth.alpha setMin 0.1
      prop Moth.alpha sub 1
      featProp Moth.AgentWidgets text setTo ''
      prop Predator.kills add 1
      propPush Predator.kills
      featPropPop Predator.AgentWidgets text setTo 'hello'
      // Stop sim if half of the moths have been eaten
      ifExpr {{ Moth.callFeatMethod('Population', 'getActiveAgentsCount', 'Moth') < 15 }} [[
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
      // MUST Initialize color before changing Value, overriden by treeColorIndex and colorValue below
      featCall Costume setColorizeHSV 0 0 0

      useFeature Physics
      useFeature AgentWidgets
      useFeature Movement

      featProp AgentWidgets text setTo ''

      // STUDENTS_CAN_CHANGE -- Set this value here or in initScript
      addProp treeColorIndex Number 7.0
      // Force update to show color immediately
      exprPush {{ agent.getProp('treeColorIndex').value / 10 }}
      featPropPop Costume colorValue

      # PROGRAM INIT
      prop zIndex setTo -200

      # PROGRAM UPDATE
      // Automatically set color based on treeColorIndex.
      // Has to be in PROGRAM UPDATE because PROGRAM INIT runs before instance initScript
      exprPush {{ agent.getProp('treeColorIndex').value / 10 }}
      featPropPop Costume colorValue
`
    },
    {
      id: 'TreeFoliage',
      label: 'TreeFoliage',
      script: `# BLUEPRINT TreeFoliage
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'circle.json' 0
      featCall Costume setColorizeHSV 0 .8 0.5

      useFeature Physics
      useFeature AgentWidgets
      useFeature Movement

      featProp AgentWidgets text setTo ''


      # PROGRAM INIT
      prop zIndex setTo -199

      # PROGRAM UPDATE
`
    }
  ],
  instances: [
    {
      id: 1102,
      name: 'TreeTrunk1',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition -250 50
// Override default color -- NOTE this will not show up until after Run starts because the color update is in PROGRAM UPDATE
prop treeColorIndex setTo 8.5
// Set in TreeTrunk INIT
// featCall Costume setColorizeHSV 0 0 0.66
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 2.7`
    },
    {
      id: 1103,
      name: 'TreeFoliage1',
      blueprint: 'TreeFoliage',
      initScript: `
     featCall Movement queuePosition -250 -342
     featCall Costume setColorize 0.3 0.9 0.2
     featProp Physics scale setTo 1.1
     featProp Physics scaleY setTo 0.4
     `
    },
    {
      id: 1104,
      name: 'TreeTrunk2',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition 50 50
// Set in TreeTrunk INIT
// featCall Costume setColorizeHSV 0 0 0.68
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 2.7`
    },
    {
      id: 1105,
      name: 'TreeFoliage2',
      blueprint: 'TreeFoliage',
      initScript: `
     featCall Movement queuePosition 50 -342
     featCall Costume setColorize 0.3 0.9 0.2
     featProp Physics scale setTo 1.1
     featProp Physics scaleY setTo 0.4
     `
    },
    {
      id: 1106,
      name: 'TreeTrunk3',
      blueprint: 'TreeTrunk',
      initScript: `
    featCall Movement queuePosition 250 50
// Set in TreeTrunk INIT
// featCall Costume setColorizeHSV 0 0 0.67
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 2.7`
    },

    {
      id: 1107,
      name: 'TreeFoliage3',
      blueprint: 'TreeFoliage',
      initScript: `
     featCall Movement queuePosition 250 -342
     featCall Costume setColorize 0.3 0.9 0.2
     featProp Physics scale setTo 1.1
     featProp Physics scaleY setTo 0.4
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
