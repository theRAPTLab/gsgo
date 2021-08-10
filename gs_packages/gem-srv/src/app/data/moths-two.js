//STUDENTS_MAY_CHANGE
/*
Our golals on Parameters for kids to change in this activity:
* Color of the tree trunks
* Number of moths
* Range of colors the moths begin at
* Mutation rate of the offspring
The first 3 are done by instances - see comment at top of Act 1.
For the last one I think it's sufficient to have 0, 1, 2 for +/- independently.
    To do this, I need to be able to feed in TWO 'push-ed' values to the addRnd somehow.
    //I THINK I COULD JUST DO THIS IN TWO STEPS GETTING AT THE UNDERLYING VARIABLE, but it would require working in two javascript exprPush {{}} blocks.
*/
//STUDENTS_MAY_CHANGE

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
      noloop: true //stop after last round.
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
          'How did the colors of the moths that survived compare to the colors of the moths that were eaten?',

        endScript: `

          featCall Population agentsForEach Predator [[
            prop agent.isInert setTo true
            featCall Movement queuePosition -400 -400
          ]]

          featCall Population agentsForEach Myth [[
            prop agent.isInert setTo true
            featCall Movement queuePosition -400 400
          ]]

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

          featCall Population agentsForEachActive Moth [[
            featCall Movement setMovementType 'static'
            prop orientation setTo 3.14
            featProp Movement useAutoOrientation setTo false
            prop alpha setTo 1
            featProp AgentWidgets text setTo ''
            prop costumenum setTo 0
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
      },
      {
        id: 'r2',
        label: 'Reproduction Round',
        time: 100,
        intro:
          'You have 60 seconds to hide your moths.  Then the predators will come....',
        initScript: `

          featCall Population agentsForEach Predator [[
            prop agent.isInert setTo false
            prop orientation setTo 0.1
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
            featProp Movement distance setTo 4
            featCall Movement setMovementType 'static'
          ]]

          featCall Population agentsForEach Myth [[
            prop agent.isInert setTo false
          ]]


          featCall Population agentsForEach TreeTrunk [[
            prop agent.isInert setTo false
            featProp Physics scale setTo 0.5
            featProp Physics scaleY setTo 2
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
          ]]


          featCall Population removeInertAgents
          featProp Population targetPopulationSize setTo 21
          featCall Population populateBySpawning Moth [[
            prop y setTo 280
            prop x setTo 0
            prop x addRnd -360 360 true
            prop y addRnd -60 60 true
            featCall Movement jitterPos -2 2
            prop colorIndx addRnd -1 1 true
            propPush colorIndx
            featPropPop Costume colorScaleIndex
            propPush colorIndx
            featPropPop AgentWidgets text
            prop costumenum setTo 0

            //featProp Costume colorScaleIndex addRnd -1 1 true
            //dbgOut {{ featProp Costume colorScaleIndex }}
            // update color index label
            featPropPush Costume colorScaleIndex
            featPropPop AgentWidgets text
            prop vulnerable setTo 1
          ]]

        `,
        outtro:
          'How did the colors of the moths that survived compare to the colors of the moths that were eaten?',
        endScript: `
        featCall Population agentsForEach Predator [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 -400
        ]]

        featCall Population agentsForEach Myth [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 400
        ]]

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
            prop costumenum setTo 0
          ]]
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo 200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
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
      },
      {
        id: 'r3',
        label: 'Reproduction Round',
        time: 100,
        intro:
          'You have 60 seconds to hide your moths.  Then the predators will come....',
        initScript: `

          featCall Population agentsForEach Predator [[
            prop agent.isInert setTo false
            prop orientation setTo 0.1
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
            featProp Movement distance setTo 4
            featCall Movement setMovementType 'static'
          ]]


          featCall Population agentsForEach TreeTrunk [[
            prop agent.isInert setTo false
            featProp Physics scale setTo 0.5
            featProp Physics scaleY setTo 2
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
          ]]


          featCall Population removeInertAgents
          featProp Population targetPopulationSize setTo 21
          featCall Population populateBySpawning Moth [[
            prop y setTo 280
            prop x setTo 0
            prop x addRnd -360 360 true
            prop y addRnd -60 60 true
            featCall Movement jitterPos -2 2
            prop colorIndx addRnd -1 1 true
            propPush colorIndx
            featPropPop Costume colorScaleIndex
            propPush colorIndx
            featPropPop AgentWidgets text

            //featProp Costume colorScaleIndex addRnd -1 1 true
            //dbgOut {{ featProp Costume colorScaleIndex }}
            // update color index label
            featPropPush Costume colorScaleIndex
            featPropPop AgentWidgets text
            prop vulnerable setTo 1
            prop costumenum setTo 0
          ]]

        `,
        outtro:
          'How did the colors of the moths that survived compare to the colors of the moths that were eaten?',
        endScript: `
        featCall Population agentsForEach Predator [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 -400
        ]]

        featCall Population agentsForEach Myth [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 400
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ !agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo -200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo 200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
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
      },
      {
        id: 'r4',
        label: 'Reproduction Round',
        time: 100,
        intro:
          'You have 60 seconds to hide your moths.  Then the predators will come....',
        initScript: `

          featCall Population agentsForEach Predator [[
            prop agent.isInert setTo false
            prop orientation setTo 0.1
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
            featProp Movement distance setTo 4
            featCall Movement setMovementType 'static'
          ]]

          featCall Population agentsForEach TreeTrunk [[
            prop agent.isInert setTo false
            featProp Physics scale setTo 0.5
            featProp Physics scaleY setTo 2
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
          ]]


          featCall Population removeInertAgents
          featProp Population targetPopulationSize setTo 21
          featCall Population populateBySpawning Moth [[
            prop y setTo 280
            prop x setTo 0
            prop x addRnd -360 360 true
            prop y addRnd -60 60 true
            featCall Movement jitterPos -2 2
            prop colorIndx addRnd -1 1 true
            propPush colorIndx
            featPropPop Costume colorScaleIndex
            propPush colorIndx
            featPropPop AgentWidgets text

            //featProp Costume colorScaleIndex addRnd -1 1 true
            //dbgOut {{ featProp Costume colorScaleIndex }}
            // update color index label
            featPropPush Costume colorScaleIndex
            featPropPop AgentWidgets text
            prop vulnerable setTo 1
            prop costumenum setTo 0
          ]]

        `,
        outtro:
          'How did the colors of the moths that survived compare to the colors of the moths that were eaten?',
        endScript: `
        featCall Population agentsForEach Predator [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 -400
        ]]

        featCall Population agentsForEach Myth [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 400
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ !agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo -200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo 200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
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
      },
      {
        id: 'r5',
        label: 'Reproduction Round',
        time: 100,
        intro:
          'You have 60 seconds to hide your moths.  Then the predators will come....',
        initScript: `

          featCall Population agentsForEach Predator [[
            prop agent.isInert setTo false
            prop orientation setTo 0.1
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
            featProp Movement distance setTo 4
            featCall Movement setMovementType 'static'
          ]]


          featCall Population agentsForEach TreeTrunk [[
            prop agent.isInert setTo false
            featProp Physics scale setTo 0.5
            featProp Physics scaleY setTo 2
            prop alpha setTo 1
            propPush initx
            propPop x
            propPush inity
            propPop y
            featCall Movement jitterPos -2 2
          ]]


          featCall Population removeInertAgents
          featProp Population targetPopulationSize setTo 21
          featCall Population populateBySpawning Moth [[
            prop y setTo 280
            prop x setTo 0
            prop x addRnd -360 360 true
            prop y addRnd -60 60 true
            featCall Movement jitterPos -2 2
            prop colorIndx addRnd -1 1 true
            propPush colorIndx
            featPropPop Costume colorScaleIndex
            propPush colorIndx
            featPropPop AgentWidgets text

            //featProp Costume colorScaleIndex addRnd -1 1 true
            //dbgOut {{ featProp Costume colorScaleIndex }}
            // update color index label
            featPropPush Costume colorScaleIndex
            featPropPop AgentWidgets text
            prop vulnerable setTo 1
            prop costumenum setTo 0
          ]]

        `,
        outtro:
          'How did the colors of the moths that survived compare to the colors of the moths that were eaten?',
        endScript: `
        featCall Population agentsForEach Predator [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 -400
        ]]

        featCall Population agentsForEach Myth [[
          prop agent.isInert setTo true
          featCall Movement queuePosition -400 400
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ !agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo -200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
        ]]

        featCall Population agentsForEach Moth [[
          ifExpr {{ agent.getProp('isInert').value }} [[
            featCall agent.Costume setPose 0
            prop costumenum setTo 0
            prop alpha setTo 1
            featCall Movement queuePosition 0 0
            exprPush {{ -420 + ( agent.getProp('colorIndx').value  * 70 ) }}
            propPop x
            prop y setTo 200
            prop y addRnd -150 150
            featCall Movement jitterPos -2 2
          ]]
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
      id: 'Myth',
      label: 'Myth',
      isCharControllable: true,
      isPozyxControllable: true,
      script: `# BLUEPRINT Myth

# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'moth.json' 0

useFeature Physics
useFeature Touches
useFeature Population

featProp Physics scale setTo 0.6

//for shoving them off to the side during data representation work.
addProp initx Number 0
prop initx setMax 400
prop initx setMin -400

addProp inity Number 0
prop inity setMax 400
prop inity setMin -400

featCall Touches monitor Moth c2c
featCall Touches monitor TreeTrunk c2c c2b b2b binb

// needed for orientation to be nice for pozyx or finger puppet.
useFeature Movement
featProp Movement useAutoOrientation setTo true

useFeature Global
useFeature Timer

//for knowing whether they can attract/pick up a baby moth.
addProp carrying Number 0
prop carrying setMin 0
prop carrying setMax 10

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

when Myth centerTouchesCenter Moth [[
  ifExpr {{ Myth.prop.carrying.value < 1 }} [[
    ifExpr {{ Moth.prop.costumenum.value < 2 }} [[
      featCall Moth.Costume setGlow 1
      featProp Moth.Movement distance setTo 10
      featCall Moth.Movement seekNearest Myth
      prop Myth.carrying setTo 1
    ]]
  ]]
]]

when Myth centerTouches TreeTrunk [[
  prop carrying setTo 0
]]

`
    },

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
featProp Costume colorScaleHue setTo 0
featProp Costume colorScaleSaturation setTo 0
featProp Costume colorScaleValue setTo 0
featProp Costume colorScaleType setTo 'value'
featProp Costume colorScaleSteps setTo 10
featCall Costume initHSVColorScale

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

addProp colorIndx Number 5
prop colorIndx setMax 11
prop colorIndx setMin 0

addProp costumenum Number 0
prop costumenum setMin 0
prop costumenum setMax 4
prop costumenum setTo 0

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
  featProp Vision visionable setTo true
  prop vulnerable setTo 1
]]

# PROGRAM UPDATE



when Moth centerFirstTouches TreeTrunk [[
ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
  dbgOut {{ Moth.name + " will be hidden " }}
  dbgOut {{  ( Moth.prop.color.value )  }}
]] [[
  dbgOut {{ Moth.name + " will be visible " }}
]]
//timer for dropping
prop Moth.energyLevel setTo 21
prop vulnerable setTo 1
]]



when Moth centerTouches TreeTrunk [[
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 2
    prop Moth.costumenum setTo 2
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
  ifExpr {{ Moth.prop.energyLevel.value < 1 }} [[
     featCall Movement setMovementType 'static'
  ]]
]]

//eaten moths become postit-markers
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

//for getting them out of the way during data representation work
addProp initx Number 0
prop initx setMax 400
prop initx setMin -400

addProp inity Number 0
prop inity setMax 400
prop inity setMin -400

//for by-hand animation
addProp frame Number 0
prop frame setMax 1000
prop frame setMin 0



// AI Movement
featProp Movement distance setTo 4
useFeature Population

useFeature Global
useFeature Timer

# PROGRAM UPDATE


every 60 [[
  featProp Movement distance setTo 4
  featCall Movement seekNearestVisibleCone Moth
]]

every 0.1 [[
  prop frame add 1
  ifExpr {{agent.getProp('frame').value > 3}} [[
    prop frame setTo 0
  ]]
  propPush frame
  featPropPop Costume currentFrame
]]

when Predator centerTouchesCenter Moth [[
  // Only if Moth is not camouflaged
  ifExpr {{ Moth.getProp('vulnerable').value  > 0 }} [[
    featCall Moth.Costume setGlow 1
    every 0.2 [[
      prop Moth.isInert setTo true
      featCall Moth.Costume setCostume 'smallsquare.json' 0
      prop Moth.alpha setMin 0.1
      prop Moth.alpha setTo 0.1
      prop Moth.orientation setTo 3.14
      featProp Moth.AgentWidgets text setTo ''

      // Stop sim if half of the moths are eaten
      ifExpr {{ Moth.callFeatMethod('Population', 'getActiveAgentsCount', 'Moth') < 10 }} [[
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

          addProp initx Number 0
          prop initx setMax 400
          prop initx setMin -400

          addProp inity Number 0
          prop inity setMax 400
          prop inity setMin -400

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
        `
    }
  ],
  instances: [
    {
      id: 1100,
      name: 'Grass',
      blueprint: 'Grass',
      initScript: `
    featCall Movement queuePosition 0 265
     featCall Costume setColorize 0.1 0.8 0
     featProp Physics scale setTo 3.13
     featProp Physics scaleY setTo 1.8`
    },
    {
      id: 1102,
      name: 'TreeTrunk1',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition -250 -145
     featCall Costume setColorizeHSV 0 0 0.66
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 2
     prop initx setTo -250
     prop inity setTo -145
     `
    },
    {
      id: 1104,
      name: 'TreeTrunk2',
      blueprint: 'TreeTrunk',
      initScript: `
      featCall Movement queuePosition 50 -145
      featCall Costume setColorizeHSV 0 0 0.67
      featProp Physics scale setTo 0.5
      featProp Physics scaleY setTo 2
      prop initx setTo -50
      prop inity setTo -145
     `
    },
    {
      id: 1106,
      name: 'TreeTrunk3',
      blueprint: 'TreeTrunk',
      initScript: `
    featCall Movement queuePosition 250 -145
     featCall Costume setColorizeHSV 0 0 0.68
     featProp Physics scale setTo 0.5
     featProp Physics scaleY setTo 2
     prop initx setTo 250
     prop inity setTo -145
     `
    },

    {
      id: 1203,
      name: 'Moth3a',
      blueprint: 'Moth',
      initScript: `
      featCall Movement queuePosition -340 320
      featProp Costume colorScaleIndex setTo 3
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 3

`
    },
    {
      id: 12031,
      name: 'Moth3b',
      blueprint: 'Moth',
      initScript: `
      featCall Movement queuePosition -40 320
      featProp Costume colorScaleIndex setTo 3
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 3

`
    },
    {
      id: 12032,
      name: 'Moth3c',
      blueprint: 'Moth',
      initScript: `
      featCall Movement queuePosition 320 320
      featProp Costume colorScaleIndex setTo 3
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 3

`
    },
    {
      id: 1204,
      name: 'Moth4a',
      blueprint: 'Moth',
      initScript: `
      featCall Movement queuePosition 125 250
      featProp Costume colorScaleIndex setTo 4
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 4

`
    },
    {
      id: 1205,
      name: 'Moth5a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -180 320
      featProp Costume colorScaleIndex setTo 5
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 1206,
      name: 'Moth6a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -300 280
      featProp Costume colorScaleIndex setTo 6
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 1207,
      name: 'Moth7a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 200 260
      featProp Costume colorScaleIndex setTo 7
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 1208,
      name: 'Moth8a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -140 280
      featProp Costume colorScaleIndex setTo 8
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 1209,
      name: 'Moth9a',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -260 240
      featProp Costume colorScaleIndex setTo 9
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12041,
      name: 'Moth4b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -210 240
      featProp Costume colorScaleIndex setTo 4
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 12051,
      name: 'Moth5b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -10 240
      featProp Costume colorScaleIndex setTo 5
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
     prop colorIndx setTo 5
`
    },
    {
      id: 12061,
      name: 'Moth6b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 60 240
      featProp Costume colorScaleIndex setTo 6
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 12071,
      name: 'Moth7b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -60 240
      featProp Costume colorScaleIndex setTo 7
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 12081,
      name: 'Moth8b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 290 240
      featProp Costume colorScaleIndex setTo 8
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 12091,
      name: 'Moth9b',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 0 320
      featProp Costume colorScaleIndex setTo 9
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 9
`
    },
    {
      id: 12042,
      name: 'Moth4c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 40 320
      featProp Costume colorScaleIndex setTo 4
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 4
`
    },
    {
      id: 12052,
      name: 'Moth5c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -90 320
      featProp Costume colorScaleIndex setTo 5
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 5
`
    },
    {
      id: 12062,
      name: 'Moth6c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 90 320
      featProp Costume colorScaleIndex setTo 6
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 6
`
    },
    {
      id: 12072,
      name: 'Moth7c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 160 320
      featProp Costume colorScaleIndex setTo 7
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 7
`
    },
    {
      id: 12082,
      name: 'Moth8c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -240 320
      featProp Costume colorScaleIndex setTo 8
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
      prop colorIndx setTo 8
`
    },
    {
      id: 12092,
      name: 'Moth9c',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 240 320
      featProp Costume colorScaleIndex setTo 9
      //featPropPush Costume colorScaleIndex
      //featPropPop AgentWidgets text
     prop colorIndx setTo 9
`
    },
    {
      id: 1301,
      name: 'Predator1',
      blueprint: 'Predator',
      initScript: `
      featCall Movement queuePosition -300 -300
      prop initx setTo -300
      prop inity setTo -300
      prop frame setTo 0
      `
    },
    {
      id: 1302,
      name: 'Predator2',
      blueprint: 'Predator',
      initScript: `
      featCall Movement queuePosition 300 -300
      prop initx setTo 300
      prop inity setTo -300
      prop frame setTo 1
      `
    }
  ]
};
