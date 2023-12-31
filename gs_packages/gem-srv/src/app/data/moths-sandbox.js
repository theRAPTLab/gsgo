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
  rounds: {
    options: {
      allowResetStage: false,
      noloop: false // if true, stop after last round
    },
    roundDefs: [
      {
        id: 'r1',
        label: 'Round 1: PopulateBySpawning',
        time: 10,
        intro: 'PopulateBySpawning 2',
        outtro: 'What happened?',
        initScript: `dbgOut 'roundDef: Round1!'
// Spawn New Moths
featProp Population spawnMutationProp setTo 'colorScaleIndex'
featProp Population spawnMutationPropFeature setTo 'Costume'
featProp Population spawnMutationMaxAdd setTo 1
featProp Population spawnMutationMaxSubtract setTo 3

featProp Population targetPopulationSize setTo 10
featCall Population populateBySpawning Moth [[
  prop x addRnd -64 64
  prop y addRnd -64 64
  // update color index label
  featPropPush Costume colorScaleIndex
  featPropPop AgentWidgets text
]]
`,
        endScript: `dbgOut 'END Round1!'
prop y setTo 100`
      },
      {
        id: 'r2',
        label: 'Round 2: oneAgentReproduce',
        time: 60,
        intro: 'Spawn one VERY dark',
        outtro: 'What happened to spawn?',
        initScript: `dbgOut 'roundDef: Round2'
// Release Cursors from All Moths
featCall Population releaseAllAgents
// Remove Dead Moths
featCall Population removeInertAgents

// Spawn New Moths
featProp Population spawnMutationProp setTo 'colorScaleIndex'
featProp Population spawnMutationPropFeature setTo 'Costume'
featProp Population spawnMutationMaxAdd setTo 0
featProp Population spawnMutationMaxSubtract setTo 10

featProp Population targetPopulationSize setTo 2
featCall Population oneAgentReproduce Moth [[
  prop x addRnd -64 64
  prop y addRnd -64 64
  featProp Costume colorScaleIndex addRndInt -1 1
  // update color index label
  featPropPush Costume colorScaleIndex
  featPropPop AgentWidgets text
]]

featCall Population agentsForEachActive TreeFoliage [[
  // Darken Trees each round
  featProp Costume colorValue subFloat2 0.025
  // update color index label
  // featPropPush Costume colorValue
  exprPush {{ agent.prop.Costume.colorValue.value * 10 }}
  featPropPop AgentWidgets text
]]

// Update Graph
featCall Population setAgentsByFeatPropTypeKeys 0 1 2 3 4 5 6 7 8 9 10 11
featCall Population countExistingAgentsByFeatPropType Moth Costume colorScaleIndex true
`,
        endScript: `dbgOut 'END Round2!'
// Update Graph
featCall Population countExistingAgentsByFeatPropType Moth Costume colorScaleIndex true
// Update Moths
featCall Population agentsForEach Moth [[
  // Reshow Moth Label
  featPropPush Costume colorScaleIndex
  featPropPop AgentWidgets text
  // Make visible
  prop alpha setTo 1
  // Rotate
  prop orientation setTo 0
]]`
      },
      {
        id: 'r3',
        label: 'Round 3: agentsReproduce',
        time: 10,
        intro: 'agentsReproduce generally darker',
        outtro: 'What happened?',
        initScript: `dbgOut 'roundDef: Round3!'
// Spawn New Moths
featProp Population spawnMutationProp setTo 'colorScaleIndex'
featProp Population spawnMutationPropFeature setTo 'Costume'
featProp Population spawnMutationMaxAdd setTo 1
featProp Population spawnMutationMaxSubtract setTo 3

featCall Population agentsReproduce Moth [[
  prop x addRnd -64 64
  prop y addRnd -64 64
  // update color index label
  featPropPush Costume colorScaleIndex
  featPropPop AgentWidgets text
]]
`,
        endScript: `dbgOut 'END Round1!'
prop y setTo 100`
      }
    ]
  },
  scripts: [
    {
      id: 'Test',
      label: 'Test',
      isCharControllable: false,
      isPozyxControllable: false, // use Cursor instead
      script: `# BLUEPRINT Test
# PROGRAM DEFINE
useFeature Population
useFeature Movement
useFeature AgentWidgets

// top level prop update test
prop alpha setTo 1
// test strings
addProp label String 'foo'
prop label setTo 'bar'
featProp AgentWidgets text setTo 'joe'
// test methods
prop alpha addRnd -20 20

// test prop editing (see instance)
addProp energyLevel Number 0

// Testing nested scriptifying
ifExpr {{ agent.prop.alpha.value < 1 }} [[
  prop alpha setTo 1
  prop alpha setTo 2
]] [[
  // alternate
  prop alpha setTo 3
]]

// Testing implicit/explicit agent reference
featCall Population agentsForEach Moth [[
  featProp Movement direction setTo 88
  // this line breaks compilation
  // featProp Moth.Movement direction setTo 99
]]

when Test dies [[
  prop alpha setTo 4
  prop Test.alpha setTo 99
  featProp Movement direction setTo 91
  // as does this
  // featProp Test.Movement direction setTo 92
  // double nest
  ifExpr {{ agent.prop.alpha.value < 1 }} [[
    prop alpha setTo 99
    // triple nest
    ifExpr {{ agent.prop.alpha.value < 1 }} [[
      prop alpha setTo 11
    ]]
  ]]
]]

every 1 [[
  prop alpha setTo 5
]]
every 1 runAtStart [[
  prop alpha setTo 6
  ifExpr {{ agent.prop.alpha.value < 1 }} [[
    prop alpha setTo 99
  ]]
]]

onEvent Start [[
  prop alpha setTo 7
  ifExpr {{ agent.prop.alpha.value < 1 }} [[
    prop alpha setTo 77
  ]]
]]
`
    },
    {
      id: 'Moth',
      label: 'Moth',
      isCharControllable: false,
      isPozyxControllable: false, // use Cursor instead
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

// COLOR
featCall Costume initHSVColorScale 0 0 1 'value' 11
// starting color is 2 steps away from tree color
featProp Costume colorScaleIndex setTo 8

// Start out mostly invisible
// prop alpha setTo 0.1
// prop alpha setMin 0.1

// Start out visible so costumes can be picked up
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3
featCall Movement wanderUntilInside TreeFoliage

useFeature Physics
featProp Physics scale setTo 0.4

useFeature Touches
featCall Touches monitor TreeTrunk c2c c2b b2b binb
featCall Touches monitor TreeFoliage c2c c2b b2b binb

// allow removal by Predator
// allow spawning
useFeature Population

// allow Predator to see us
useFeature Vision

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature AgentWidgets
// Show Color Index
featPropPush Costume colorScaleIndex
featPropPop AgentWidgets text

// hide text
// featProp AgentWidgets text setTo ''

// Plot energy level
featCall AgentWidgets bindMeterTo energyLevel
// featCall AgentWidgets bindGraphTo energyLevel 30

// // random color: shift hue and value
// featCall Costume randomizeColorHSV 0.1 0 0.2

// allow access to global darkMoths/lightMoths values
useFeature Global

// allow pozyx control via cursors
useFeature Cursor

# PROGRAM EVENT
onEvent Start [[
  // hide label once sim starts
  featProp AgentWidgets text setTo ''

  // label is restored by round endScript
  // because 'onEvent RoundStop' will not run after
  // the sim stops
]]

# PROGRAM UPDATE
every 0.1 [[
  // fade to minimal alpha value (will "disappear" when camouflaged on tree)
  prop alpha sub 0.1
  prop energyLevel sub 2
]]
every 1 [[
  // *** HACK: THIS DOES NOT PROPERLY USE PREDATOR VISION TO DETERMINE BLINKING
  //     FIX: SHould only blink if predator can see.  Might need to hack the difference.
  // Blink every second if invisible

  ifExpr {{ agent.getProp('alpha').value < 1 && !agent.prop.isInert.value}} [[
    featCall Costume setGlow 0.05
  ]]
]]


// TREE FOLIAGE
when Moth centerFirstTouches TreeTrunk [[
  // Show vfx when moth gets energy from treetrunk
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel add 50
]]

when Moth centerTouches TreeTrunk [[
  // show wings folded pose
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 4
  ]]

  // Fade Moth if it's camouflaged
  // HACKISH
  // This needs to use the same values as Predator detection
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 0.2, 1, 0.2)}} [[
    // color matches trunk, fade away and set un-visionable
    prop alpha setMin 0.1

    // don't set visionable -- use isCamouflaged instead
    // featProp Vision visionable setTo false
  ]]

]]
when Moth lastTouches TreeTrunk [[
  // seek foliage again after you wander off the old foliage
  featCall Moth.Movement wanderUntilInside TreeFoliage
]]


// TREE TRUNK
when Moth centerFirstTouches TreeFoliage [[
  // Show vfx when moth gets energy from treetrunk
  featCall Moth.Costume setGlow 2
  prop Moth.energyLevel add 80
]]
when Moth centerTouches TreeFoliage [[
  // show wings folded pose
  ifExpr {{ !Moth.prop.isInert.value }} [[
    featCall Moth.Costume setPose 4
  ]]

  // Fade Moth if it's camouflaged
  // HACKISH
  // This needs to use the same values as Predator detection
  ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeFoliage.prop.color.value, 0.2, 1, 0.2)}} [[
    // color matches, fade away and set un-visionable
    prop alpha setMin 0.1

    // don't set visionalbe, use camouflage instead
    // featProp Moth.Vision visionable setTo false
  ]]

  // go search for new tree if energyLevel is low
  ifExpr {{ Moth.prop.energyLevel.value < 60 }} [[
    featCall Moth.Movement setMovementType wander
  ]]
]]
when Moth lastTouches TreeFoliage [[
  // seek foliage again after you wander off the old foliage
  featCall Moth.Movement wanderUntilInside TreeFoliage
]]
// Costume overide all
ifExpr {{ agent.getFeatProp('Movement', 'isMoving').value }} [[
  // show wings out
  featCall Costume setPose 0

  // visible when moving
  prop alpha setMin 1
  prop alpha add 0.25
  featProp Vision visionable setTo true
]] [[
  // DON'T ALWAYS FADE -- ONLY WHEN ON TREE
  // always fade
  // prop alpha setMin 0.1
]]
ifExpr {{ agent.getProp('isInert').value }} [[
  // always faded if inert
  prop alpha setMin 0
  // clear label
  featProp AgentWidgets text setTo ''
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
featCall Movement seekNearestVisibleColor Moth
featProp Movement distance setTo 4
// Alternative seek based on visionCone and not color
// featCall Movement seekNearestVisibleCone Moth

// To update graphs
useFeature Global

// Students control predators via charcontrol, not pozyx
// useFeature Cursor

// Allow Predator to stop round when Moths are all eaten
useFeature Timer

# PROGRAM UPDATE
when Predator seesCamouflaged Moth [[
  // When Moth is spotted, make it glow and visible
  // //    Enable visionable so Moth will stop blinking
  // featProp Moth Vision visionable setTo true
  prop Moth.alpha setMin 1
  featCall Moth.Costume setGlow 1
]]

// Old 'sees'
// when Predator sees Moth [[
//   prop Moth.alpha setMin 1
//   featCall Moth.Costume setGlow 0.1
// ]]
// when Predator doesNotSee Moth [[
//   // Moth should naturally go back to 0.1 no need for this call
//   // prop Moth.alpha setMin 0.1
// ]]

when Predator centerTouchesCenter Moth [[

  // Only if Moth is not camouflaged
  ifExpr {{ Predator.callFeatMethod('Vision', 'canSeeColorOfAgent', Moth) }} [[
    featCall Moth.Costume setGlow 1
    featCall Moth.Movement jitterRotate

    // EAT RIGHT AWAY
    // every 2 [[
      // featCall Moth.Population removeAgent
      prop Moth.isInert setTo true
      featCall Moth.Costume setCostume 'square.json' 0
      // this breaks
      // featProp Moth.Physics scale setTo 0.1
      featCall Predator.Costume setGlow 1

      // release cursor of eaten Moth
      featCall Moth.Cursor releaseCursor


      // Stop sim if no more agents
      ifExpr {{ Moth.callFeatMethod('Population', 'getActiveAgentsCount', 'Moth') < 1 }} [[
        featCall Predator.Timer stopRound

        // This will be added to the end of round message
        featCall Moth.AgentWidgets showMessage 'No more moths!'
      ]]

    // EAT RIGHT AWAY
    // ]]
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
featCall Costume setCostume 'circle.json' 0

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
featCall Costume setColorize 0 0 0.9

useFeature Physics
useFeature AgentWidgets

# PROGRAM INIT
prop zIndex setTo -200

# PROGRAM UPDATE
exprPush {{ agent.name }}
dbgStack

`
    },
    {
      id: 'Histogram',
      label: 'Histogram',
      script: `# BLUEPRINT Histogram
# PROGRAM DEFINE
useFeature Population
useFeature AgentWidgets

# PROGRAM EVENT
onEvent Start [[
  dbgOut 'Starting Round!  Update Histogram'
  featCall Population countExistingAgentsByFeatPropType
]]
`
    },
    {
      id: 'LineGraphHistogram', // used by Histogra
      label: 'LineGraphHistogram',
      script: `# BLUEPRINT LineGraphHistogram
# PROGRAM DEFINE
// prop skin setTo 'onexone'
// intentionally left blank for testing

useFeature Population
useFeature Global
useFeature AgentWidgets
featProp AgentWidgets isLargeGraphic setTo true
`
    },
    {
      id: 'CountAgent', // does nothing but count numbers for graph
      label: 'CountAgent',
      script: `# BLUEPRINT CountAgent
# PROGRAM DEFINE
useFeature Global
useFeature Population

// Define graphs
featCall Global addGlobalProp darkMoths Number 0
featCall Global globalProp darkMoths setMin 0

featCall Global addGlobalProp medMoths Number 0
featCall Global globalProp medMoths setMin 0

featCall Global addGlobalProp lightMoths Number 0
featCall Global globalProp lightMoths setMin 0
featCall Global globalProp lightMoths setMax Infinity

# PROGRAM EVENT
onEvent Start [[
  // Set Max Count to even graphs
  featCall Global globalProp lightMoths setTo 10
  featCall Global globalProp medMoths setTo 10
  featCall Global globalProp darkMoths setTo 10
]]

# PROGRAM UPDATE
every 1 [[
  // RESET Count
  featCall Global globalProp lightMoths setTo 0
  featCall Global globalProp medMoths setTo 0
  featCall Global globalProp darkMoths setTo 0

  // HACKY COUNTING LOOP -- count number of light/med/dark moths for graphs
  featCall Population agentsForEachActive Moth [[
    ifExpr {{ agent.prop.Costume.colorValue.value > 0.6 }} [[
      featCall Global globalProp lightMoths add 1
    ]]
    ifExpr {{ agent.prop.Costume.colorValue.value > 0.3 && agent.prop.Costume.colorValue.value <= 0.6 }} [[
      featCall Global globalProp medMoths add 1
    ]]
    ifExpr {{ agent.prop.Costume.colorValue.value <= 0.3 }} [[
      featCall Global globalProp darkMoths add 1
    ]]
  ]]
]]
`
    },
    {
      id: 'ColorGraph',
      label: 'ColorGraph',
      script: `# BLUEPRINT ColorGraph
# PROGRAM DEFINE
useFeature Population
// for setting GlobalProp
useFeature Global
useFeature AgentWidgets
featProp AgentWidgets isLargeGraphic setTo true

# PROGRAM EVENT
onEvent Start [[
  dbgOut 'Round Start'
]]
onEvent RoundStop [[
  dbgOut 'Round Stop'
]]
`
    }
    //     {
    //       id: 'Counter',
    //       label: 'Counter',
    //       script: `# BLUEPRINT Counter
    // # PROGRAM DEFINE
    // prop skin setTo 'onexone'
    // useFeature Population
    // useFeature Global
    // useFeature AgentWidgets
    // featProp AgentWidgets isLargeGraphic setTo true

    // # PROGRAM UPDATE
    // // every 1 runAtStart [[
    // //   featCall Population countAgents Moth
    // //   featPropPush Population count
    // //   featPropPop AgentWidgets meter

    // //   featPropPush Population count
    // //   featPropPop AgentWidgets text
    // // ]]
    // `
    //     }
  ],
  instances: [
    //     {
    //       id: 1100,
    //       name: 'Test1',
    //       blueprint: 'Test',
    //       initScript: `// tests minimized/lined formatting for all keywords
    // featCall Population agentsForEach Moth [[
    //   prop energyLevel setTo 77
    //   prop Moth.energyLevel setTo 88
    //   featProp Moth.Movement direction setTo 99
    // ]]
    // every 5 runAtStart [[
    //   dbgOut 'unlikely'
    //   // second line
    // ]]
    // every 10 [[
    //   addProp junk Number 11
    // ]]
    // exprPush {{ 10 * 10 }}
    // ifExpr {{ 1 < 10 }} [[
    //   featPropPush Movement direction
    //   featPropPop Movement direction
    // ]] [[
    //   //
    // ]]
    // onEvent Start [[
    //   // This really should not ever be in an initScript
    //   prop agent.energyLevel setTo 44
    // ]]
    // propPop energyLevel
    // when Test dies [[
    //   // three lines here
    //   prop energyLevel setTo 22
    //   prop Test.energyLevel setTo 33
    // ]]
    // useFeature Costume
    // `
    //     },
    {
      id: 1101,
      name: 'Histogram1',
      blueprint: 'Histogram',
      initScript: `prop x setTo -290
prop y setTo 370
featCall Population setAgentsByFeatPropTypeKeys 0 1 2 3 4 5 6 7 8 9 10 11
featProp Population monitoredAgent setTo 'Moth'
featProp Population monitoredAgentPropFeature setTo 'Costume'
featProp Population monitoredAgentProp setTo 'colorScaleIndex'
featProp AgentWidgets barGraphProp setTo '_countsByProp'
featProp AgentWidgets barGraphPropFeature setTo 'Population'
featProp AgentWidgets text setTo 'colorScaleIndex'`

      // featProp Histogram targetCharacter setTo 'Moth'
      // featProp Histogram targetCharacterProp setTo 'colorScaleIndex'
      // featProp Histogram targetCharacterPropFeature setTo 'Costume'
    },
    // {
    //   id: 1101,
    //   name: 'Tree1',
    //   blueprint: 'TreeTrunk',
    //   initScript: `prop x setTo -200
    // prop y setTo 200
    // featCall Costume setColorizeHSV 0.3 0 0.9
    // featProp Physics scale setTo 0.3
    // featProp Physics scaleY setTo 2`
    // },
    //     {
    //       id: 1102,
    //       name: 'TreeFoliage1',
    //       blueprint: 'TreeFoliage',
    //       initScript: `prop x setTo -200
    // prop y setTo -150
    // featCall Costume setColorizeHSV 0 0 0.6
    // featProp Physics scale setTo 2
    // featProp Physics scaleY setTo 1.5`
    //     },
    //     {
    //       id: 1105,
    //       name: 'Tree3',
    //       blueprint: 'TreeTrunk',
    //       initScript: `prop x setTo 250
    // prop y setTo 200
    // featCall Costume setColorizeHSV 0 0 0.8
    // featProp Physics scale setTo 0.4
    // featProp Physics scaleY setTo 2`
    //     },
    //     {
    //       id: 1106,
    //       name: 'TreeFoliage3',
    //       blueprint: 'TreeFoliage',
    //       initScript: `prop x setTo 250
    // prop y setTo -150
    // featCall Costume setColorizeHSV 0 0 0.75
    // //  featCall Costume setColorize 0.8 0.7 0
    // featProp Physics scale setTo 1.2
    // featProp Physics scaleY setTo 2`
    //     },
    //     {
    //       id: 1103,
    //       name: 'Tree2',
    //       blueprint: 'TreeTrunk',
    //       initScript: `prop x setTo 0
    // prop y setTo 200
    // featCall Costume setColorizeHSV 0 0 1
    // featProp Physics scale setTo 0.6
    // featProp Physics scaleY setTo 2`
    //     },
    //     {
    //       id: 1104,
    //       name: 'TreeFoliage',
    //       blueprint: 'TreeFoliage',
    //       initScript: `prop x setTo 0
    // prop y setTo -150
    // featCall Costume setColorizeHSV 0 0 0.65
    // featProp Physics scale setTo 2.5
    // featProp Physics scaleY setTo 2`
    //     },
    {
      id: 1201,
      name: 'Moth1',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 100 0
featProp Movement useAutoOrientation setTo true
prop energyLevel setTo 100
    // featPropPush Costume colorScaleIndex
    // featPropPop AgentWidgets text
    `
    },
    {
      id: 1202,
      name: 'Moth2',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -50 -100`
    },
    {
      id: 1203,
      name: 'Moth3',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -150 200`
    },
    {
      id: 1204,
      name: 'Moth4',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -300 -225`
    },
    {
      id: 1205,
      name: 'Moth5',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -275 -120`
    },
    {
      id: 1206,
      name: 'Moth6',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition -100 140`
    },
    {
      id: 1207,
      name: 'Moth7',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 50 225`
    },
    {
      id: 1208,
      name: 'Moth8',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 150 100`
    },
    {
      id: 1209,
      name: 'Moth9',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 250 40`
    },
    {
      id: 1210,
      name: 'Moth10',
      blueprint: 'Moth',
      initScript: `featCall Movement queuePosition 350 200`
    }
    //     {
    //       id: 1301,
    //       name: 'Predator1',
    //       blueprint: 'Predator',
    //       initScript: `prop x setTo 250
    // prop y setTo -100`
    //     },
    //     {
    //       id: 1302,
    //       name: 'Predator2',
    //       blueprint: 'Predator',
    //       initScript: `prop x setTo -250
    // prop y setTo -100`
    //     },
    //     {
    //       id: 1400,
    //       name: 'Histogram',
    //       blueprint: 'Histogram',
    //       initScript: `prop x setTo 460
    // prop y setTo -300
    // featCall AgentWidgets bindHistogramToFeatProp Population _countsByProp`
    //     },
    //     //     {
    //     //       id: 1401,
    //     //       name: 'Counter',
    //     //       blueprint: 'Counter',
    //     //       initScript: `prop x setTo 460
    //     // prop y setTo 300`
    //     //     }
    //     {
    //       id: 1401,
    //       name: 'Count Agent',
    //       blueprint: 'CountAgent',
    //       initScript: ``
    //     },
    //     {
    //       id: 1402,
    //       name: 'Dark Moths',
    //       blueprint: 'ColorGraph',
    //       initScript: `prop x setTo 460
    // prop y setTo 300
    // featCall AgentWidgets bindGraphToGlobalProp darkMoths 30
    // `
    //     },
    //     {
    //       id: 1403,
    //       name: 'Medium Moths',
    //       blueprint: 'ColorGraph',
    //       initScript: `prop x setTo 460
    // prop y setTo 100
    // featCall AgentWidgets bindGraphToGlobalProp medMoths 30
    // `
    //     },
    //     {
    //       id: 1404,
    //       name: 'Light Moths',
    //       blueprint: 'ColorGraph',
    //       initScript: `prop x setTo 460
    // prop y setTo -100
    // featCall AgentWidgets bindGraphToGlobalProp lightMoths 30
    // `
    //     }
  ]
};
