export const MODEL = {
  label: 'Aquatic Ecosystem',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: false,
    bgcolor: 0x000066
  },
  rounds: {
    options: {
      allowResetStage: true,
      noloop: false // loop because why not
    }
  },
  scripts: [
    {
      id: 'Fish',
      label: 'Fish',
      isCharControllable: true,
      isPozyxControllable: true,
      script: `# BLUEPRINT Fish
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
useFeature AgentWidgets

featCall Costume setCostume 'fish.json' 0

addProp energyLevel Number 30
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp type String 'change'
addProp movementType String 'edgeToEdge'

// STUDENTS_MAY_CHANGE - set to edgeToEdge or wander - note other options below for speed and direction
prop movementType setTo 'edgeToEdge'

// STUDENTS_MAY_CHANGE - set as consumer or producer
prop type setTo 'change'

addProp energyUse Number 0

// STUDENTS_MAY_CHANGE - to change how quickly Fish use up energy and get hungry
prop energyUse setTo 3

addProp grows Boolean false

// STUDENTS_MAY_CHANGE - change to 1 (true) turns on the feature that allows the fish to grow if this is 1
prop grows setTo false

addProp startDirection Number 0

useFeature Physics
featCall Physics init
featProp Physics scale setTo 1


// set Touches
useFeature Touches
featCall Touches monitor Algae b2b

// show meter immediately
featCall AgentWidgets bindMeterTo energyLevel

// set name
exprPush {{ agent.name }}
featPropPop AgentWidgets text


# PROGRAM EVENT
onEvent Start [[
  // start at normal size unless you eat
  featProp Physics scale setTo 1

    // **** OPTIONS TO CHANGE BEHAVIOR ****

    // if the movementType is wander
    ifExpr {{ agent.getProp('movementType').value == 'wander' }} [[
      featCall Movement setMovementType 'wander' 0.5
    ]]

    // if it is edgetoedge
    ifExpr {{ agent.getProp('movementType').value == 'edgeToEdge' }} [[
      featCall Movement setMovementType 'edgeToEdge' 1 0 180
      exprPush {{ agent.getProp('startDirection').value }}
      featPropPop agent.Movement direction
    ]]

    // STUDENTS_MAY_CHANGE to make fish move faster when they are automatic
    featProp Movement distance setTo 2

    // set name + energyLevel
    exprPush {{ agent.name }}
    featPropPop AgentWidgets text

]]
# PROGRAM UPDATE

ifExpr {{ agent.prop.Movement.compassDirection.value === 'E' }} [[
  featProp Costume flipX setTo false
]]
ifExpr {{ agent.prop.Movement.compassDirection.value === 'W' }} [[
  featProp Costume flipX setTo true
]]

when Fish touches Algae [[
  every 1 runAtStart [[
    // always glow to show the interaction
    featCall Fish.Costume setGlow 4

    // only eat if the algae is above 0
    ifExpr {{Algae.getProp('energyLevel').value > 0}} [[
      prop Fish.energyLevel add 10
      prop Algae.energyLevel sub 10
    ]]

    // grow if above 90% energy
    ifExpr {{(Fish.getProp('grows').value) && (Fish.getProp('energyLevel').value > 90) }} [[

      // STUDENTS_MAY_CHANGE - this is the logic that makes large fish use more energy, so changing the energyUse in here is something we might want to do
      featProp Physics scale setTo 2
      prop Fish.energyUse setTo 2
    ]]

    ifExpr {{Algae.getProp('energyLevel').value <= 0}} [[
      prop Algae.alpha setTo 0.3
      prop Algae.isInert setTo true
    ]]

  ]]
]]

when Fish lastTouches Algae [[
  featCall Costume setGlow 0
]]


every 1 runAtStart [[
  // foodLevel goes down every n seconds
  exprPush {{ agent.getProp('energyLevel').value - agent.getProp('energyUse').value}}
  propPop agent.energyLevel

  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
    featCall Costume setPose 0
    // Green
    featProp AgentWidgets meterColor setTo 65280
  ]]
  // could eat
  ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
    featCall Costume setPose 1
    // Orange
    featProp AgentWidgets meterColor setTo 16737792
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
    featCall Costume setPose 1
    // Red
    featProp AgentWidgets meterColor setTo 16711680
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    featCall Costume setPose 2
    featCall Movement setMovementType 'float'
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]

  // set meter to mirror energyLevel
  featCall AgentWidgets bindMeterTo energyLevel

]]
`
    },
    {
      id: 'Algae',
      label: 'Algae',
      isCharControllable: true,
      isPozyxControllable: false,
      script: `# BLUEPRINT Algae
# PROGRAM DEFINE

useFeature Costume
useFeature Movement
useFeature Population
useFeature AgentWidgets

// STUDENTS_MAY_CHANGE - set as consumer or producer
addProp type String 'change'
prop type setTo 'change'

// default to false but once turned on (true) algae will reproduce if they get to full energy from the sun (so any that start at full won't spawn)
addProp spawns Boolean false

// STUDENTS_MAY_CHANGE - if we want to see what happens when algae reproduce
prop spawns setTo false

featCall Costume setCostume 'algae.json' 0

// show meter immediately
featCall AgentWidgets bindMeterTo energyLevel

// setup energyLevel variablee
addProp energyLevel Number 100
prop energyLevel setMax 100
prop energyLevel setMin 0

// set algae energy meter color for start
    ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
      featProp AgentWidgets meterColor setTo 65280
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
      featProp AgentWidgets meterColor setTo 16737792
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
      featProp AgentWidgets meterColor setTo 16711680
    ]]

addProp energyUse Number 0

// STUDENTS_MAY_CHANGE - this makes the algae lose energy over time (by default they do not)
prop energyUse setTo 0

useFeature Physics
featCall Physics init

useFeature Touches
featCall Touches monitor Fish b2b
featCall Touches monitor Sunbeam b2b

featProp AgentWidgets text setTo ''

// STUDENTS_MAY_CHANGE - to set the type of movement and / or the amount it will wander
featProp Movement movementType setTo 'wander'
featProp Movement distance setTo 0.2

exprPush {{ (agent.getProp('energyLevel').value / 100)* 3}}
featPropPop Physics scale

prop zIndex setTo -110

# PROGRAM UPDATE
when Algae touches Sunbeam [[
  every 1 [[
      featCall Algae.Costume setGlow 4
      exprPush {{Algae.getProp('energyLevel').value + Sunbeam.getProp('energyRate').value}}
      propPop energyLevel

    // if Spawning is active, create more algae when we hit 100
    ifExpr {{ agent.getProp('spawns').value }} [[
      // Only spawn more if we are under 200 total ... to avoid crashing the system
      ifExpr {{ Algae.callFeatMethod('Population', 'getActiveAgentsCount', 'Algae') < 200 }} [[
        ifExpr {{ agent.getProp('energyLevel').value == 100 }} [[
          prop energyLevel sub 50
          featCall Population createAgent Algae [[
            // STUDENTS_MAY_CHANGE - maybe change the new energy level (currently 40) or the threshold (from 100) or the new position or other things
            prop energyLevel setTo 40
            prop x add 25
            prop y add 25
          ]]
        ]]
      ]]
    ]] // if spawning
  ]]
]]

when Algae lastTouches Sunbeam [[
  featCall Costume setGlow 0
]]

  every 1 runAtStart [[

    // decrease energy each tick, using the energyUse varable to determine how much
    ifExpr {{ agent.getProp('energyLevel').value > 0 }} [[
    exprPush {{ agent.getProp('energyLevel').value - agent.getProp('energyUse').value}}
    propPop agent.energyLevel
    ]]

    // re-scale the algae based on its energy level
  exprPush {{ (agent.getProp('energyLevel').value / 100)* 3}}
  featPropPop agent.Physics scale

    // set algae energy meter color
    // doing great
    ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
      // Green
      featProp AgentWidgets meterColor setTo 65280
    ]]
    // needs some energy
    ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
      // Orange
      featProp AgentWidgets meterColor setTo 16737792
    ]]
    // in trouble
    ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
      // Red
      featProp AgentWidgets meterColor setTo 16711680
    ]]


  ]]
`
    },
    {
      id: 'Sunbeam',
      label: 'Sunbeam',
      script: `# BLUEPRINT Sunbeam
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'circle.json' 0
featCall Costume setColorize 1 1 0
prop agent.alpha setTo 0.3
prop zIndex setTo 100

addProp speed Number 20
// STUDENTS_MAY_CHANGE - to set the speed of the sunbeam
prop speed setTo 20

addProp energyRate Number 5
// STUDENTS_MAY_CHANGE - to set the amount of energy the sunbeam gives to algae
prop energyRate setTo 5

addProp direction Number 1
// STUDENTS_MAY_CHANGE - to set which direction the sunbeam moves (right: 1, left: -1)
prop direction setTo 1

useFeature Physics
featCall Physics init
// STUDENTS_MAY_CHANGE - how wide the sunbeam is
featProp Physics scale setTo 0.4
// STUDENTS_MAY_CHANGE - how tall the sunbeam is
featProp Physics scaleY setTo 2.5

useFeature Touches

# PROGRAM INIT
// default position for moving across the top
prop x setTo -400
prop y setTo -180

# PROGRAM EVENT
onEvent Tick [[
  exprPush {{agent.x + agent.getProp('direction').value * (agent.getProp('speed').value); }}
  propPop x

  ifExpr {{ ((agent.getProp('direction').value == 1) && (agent.x > 400)) || ((agent.getProp('direction').value == -1) && (agent.x < -400))}} [[
      exprPush {{400 * agent.getProp('direction').value * -1}}
      propPop x
  ]]
]]
`
    },
    {
      id: 'AlgaeAvgMeter',
      label: 'Algae Energy Meter',
      script: `# BLUEPRINT AlgaeAvgMeter
# PROGRAM DEFINE
addProp reportSubject String Algae
addProp energyLevel Number 100

useFeature Population
useFeature AgentWidgets

// setup the meter title
exprPush {{ 'Algae avg energy' }}
featPropPop AgentWidgets text

// Make costume an invisible dot
prop skin setTo 'onexone'

// Show meter on start.
featProp AgentWidgets isLargeGraphic setTo true
featProp AgentWidgets meterColor setTo 65280
// set to 1 so we can see something at start
// I tried binding and it wasn't working so sticking with this hack for now
featProp AgentWidgets meter setTo 1


# PROGRAM INIT
// default placement for the algae meter
prop x setTo 75
prop y setTo 320
prop alpha setTo 0.3

# PROGRAM EVENT

onEvent Tick [[

    // Algae meter display
    featCall Population countAgentProp 'Algae' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'avg').value }}
    propPop energyLevel

    exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
    featPropPop AgentWidgets meter

    exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getProp('energyLevel').value}}
    featPropPop AgentWidgets text

    // set meter color for average energy
    ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
      featProp AgentWidgets meterColor setTo 65280
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
      featProp AgentWidgets meterColor setTo 16737792
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
      featProp AgentWidgets meterColor setTo 16711680
    ]]

]]
`
    },
    {
      id: 'FishAvgMeter',
      label: 'Fish Energy Meter',
      script: `# BLUEPRINT FishAvgMeter
# PROGRAM DEFINE
addProp reportSubject String Fish
addProp energyLevel Number 100

useFeature Population
useFeature AgentWidgets

// setup the meter title
exprPush {{ 'Fish avg energy' }}
featPropPop AgentWidgets text

// Make costume an invisible dot
prop skin setTo 'onexone'

// Show meter on start.
featProp AgentWidgets isLargeGraphic setTo true
featProp AgentWidgets meterColor setTo 65280
// set to 1 so we can see something at start
// I tried binding and it wasn't working so sticking with this hack for now
featProp AgentWidgets meter setTo 1


# PROGRAM INIT
// default placement for the fish meter
prop x setTo -83
prop y setTo 320
prop alpha setTo 0.3

# PROGRAM EVENT

onEvent Tick [[

    // Fish meter display
    featCall Population countAgentProp 'Fish' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'avg').value }}
    propPop energyLevel

    exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
    featPropPop AgentWidgets meter

    exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getProp('energyLevel').value}}
    featPropPop AgentWidgets text

    // set meter color for average energy
    ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
      featProp AgentWidgets meterColor setTo 65280
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
      featProp AgentWidgets meterColor setTo 16737792
    ]]
    ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
      featProp AgentWidgets meterColor setTo 16711680
    ]]

]]
`
    },
    {
      id: 'Timer',
      label: 'Timer',
      script: `# BLUEPRINT Timer
      # PROGRAM DEFINE
      useFeature AgentWidgets
      prop skin setTo 'onexone'
      addProp time Number 0

      featProp AgentWidgets text setTo 'Time: 0'

      # PROGRAM EVENT
      onEvent Tick [[
        prop time add 1
        exprPush {{ 'Time: ' + agent.getProp('time').value }}
        featPropPop AgentWidgets text
      ]]
`
    },
    {
      id: 'Rock',
      label: 'Rock Blue',
      script: `# BLUEPRINT Rock

      # PROGRAM DEFINE
      useFeature Costume

      featCall Costume setCostume 'boulder.json' 0

      useFeature Physics
`
    },
    {
      id: 'Graph1',
      label: 'Graph1',
      script: `# BLUEPRINT Graph1
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            addProp characterType String 'Fish'
            addProp countType String 'avg'
            addProp variableToGraph String 'energyLevel'
            addProp labelText String 'Fish energyLevel'

            // STUDENTS_MAY_CHANGE - change the character, variable, and possible countTypeto a different name as needed
            // -- Character options: Fish, Algae
            // -- Variable options: energyLevel
            // -- Population options: sum, avg, min, max
            prop characterType setTo 'Fish'
            prop countType setTo 'avg'
            prop variableToGraph setTo 'energyLevel'
            prop labelText setTo 'Fish energyLevel'

            useFeature AgentWidgets
            useFeature Population
            featProp AgentWidgets isLargeGraphic setTo true

            // using a generic name so that it is easier to change later
            addProp graphValue Number 0
            prop graphValue setMax 1000
            prop graphValue setMin 0

           featCall AgentWidgets bindGraphTo graphValue 30

            # PROGRAM INIT
            // make sure something displays with some initial text, on bottom right at first
            prop x setTo 510
            prop y setTo 230
            prop zIndex setTo 300

            exprPush {{agent.getProp('characterType').value + ' ' + agent.getProp('countType').value + ' ' + agent.getProp('variableToGraph').value}}
            propPop labelText

            exprPush {{agent.getProp('labelText').value}}
            featPropPop AgentWidgets text

            # PROGRAM EVENT

            onEvent Tick [[

              exprPush {{agent.getProp('characterType').value}}
              featPropPop Population monitoredAgent

              exprPush {{agent.getProp('variableToGraph').value}}
              featPropPop Population monitoredAgentProp

              featCall Population countAgentProp

              exprPush {{ agent.getFeatProp('Population', agent.prop.countType.value).value }}
              propPop graphValue
            ]]

            `
    },
    {
      id: 'Graph2',
      label: 'Graph2',
      script: `# BLUEPRINT Graph2
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            addProp characterType String 'Fish'
            addProp countType String 'avg'
            addProp variableToGraph String 'energyLevel'
            addProp labelText String 'Fish energyLevel'

            // STUDENTS_MAY_CHANGE - change the character, variable, and possible countTypeto a different name as needed
            // -- Character options: Fish, Algae
            // -- Variable options: energyLevel
            // -- Population options: sum, avg, min, max
            prop characterType setTo 'Fish'
            prop countType setTo 'avg'
            prop variableToGraph setTo 'energyLevel'
            prop labelText setTo 'Fish energyLevel'

            useFeature AgentWidgets
            useFeature Population
            featProp AgentWidgets isLargeGraphic setTo true

            // using a generic name so that it is easier to change later
            addProp graphValue Number 0
            prop graphValue setMax 1000
            prop graphValue setMin 0

           featCall AgentWidgets bindGraphTo graphValue 30

            # PROGRAM INIT
            // make sure something displays with some initial text, on bottom right at first
            prop x setTo 510
            prop y setTo 370
            prop zIndex setTo 300

            exprPush {{agent.getProp('characterType').value + ' ' + agent.getProp('countType').value + ' ' + agent.getProp('variableToGraph').value}}
            propPop labelText

            exprPush {{agent.getProp('labelText').value}}
            featPropPop AgentWidgets text

            # PROGRAM EVENT

            onEvent Tick [[

              exprPush {{agent.getProp('characterType').value}}
              featPropPop Population monitoredAgent

              exprPush {{agent.getProp('variableToGraph').value}}
              featPropPop Population monitoredAgentProp

              featCall Population countAgentProp

              exprPush {{ agent.getFeatProp('Population', agent.prop.countType.value).value }}
              propPop graphValue
            ]]

            `
    },
    {
      id: 'TextLabel',
      label: 'TextLabel',
      script: `# BLUEPRINT TextLabel
      # PROGRAM DEFINE
      useFeature AgentWidgets
      prop skin setTo 'onexone'
`
    },
    {
      id: 'ColorChip',
      label: 'ColorChip',
      script: `# BLUEPRINT ColorChip
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'square.json' 0

      useFeature Physics`
    }
  ],
  instances: [
    {
      id: 501,
      name: 'Algae 1',
      blueprint: 'Algae',
      initScript: `prop x setTo 300
       prop y setTo 220`
    },
    {
      id: 502,
      name: 'Algae 2',
      blueprint: 'Algae',
      initScript: `prop energyLevel setTo 50
 prop x setTo -250
 prop y setTo -200
`
    },
    {
      id: 503,
      name: 'Algae 3',
      blueprint: 'Algae',
      initScript: `prop x setTo -220
prop y setTo -290`
    },
    {
      id: 504,
      name: 'Algae 4',
      blueprint: 'Algae',
      initScript: `prop x setTo -220
prop y setTo -230`
    },
    {
      id: 505,
      name: 'Algae 5',
      blueprint: 'Algae',
      initScript: `prop x setTo 220
prop y setTo 230`
    },
    {
      id: 506,
      name: 'Algae 6',
      blueprint: 'Algae',
      initScript: `prop x setTo 240
prop y setTo 250`
    },
    {
      id: 507,
      name: 'Algae 7',
      blueprint: 'Algae',
      initScript: `prop x setTo 260
prop y setTo 280`
    },
    {
      id: 520,
      name: 'Timer',
      blueprint: 'Timer',
      initScript: `prop x setTo 0
prop y setTo -350`
    },
    {
      id: 521,
      name: 'Rock1',
      blueprint: 'Rock',
      initScript: `prop x setTo -350
prop y setTo 368
featProp Physics scale setTo 1.3
prop zIndex setTo 210`
    },
    {
      id: 522,
      name: 'Rock2',
      blueprint: 'Rock',
      initScript: `prop x setTo 350
prop y setTo 378
featProp Costume flipX setTo true
prop zIndex setTo 210`
    },
    {
      id: 1700,
      name: 'LegendLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -400
    featProp AgentWidgets text setTo 'Energy Key:'
    `
    },
    {
      id: 1701,
      name: 'HighLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -370
    featProp AgentWidgets text setTo 'High'
    prop zIndex setTo 100
    `
    },
    {
      id: 1702,
      name: 'MediumLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -340
    featProp AgentWidgets text setTo 'Medium'
    prop zIndex setTo 100
    `
    },
    {
      id: 1703,
      name: 'LowLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -308
    featProp AgentWidgets text setTo 'Low'
    prop zIndex setTo 100
    `
    },
    {
      id: 1704,
      name: 'HighChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -351
    featCall Costume setColorize 0 255 0
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    },
    {
      id: 1705,
      name: 'MediumChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -322
    featCall Costume setColorize 210 140 0
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    },
    {
      id: 1706,
      name: 'LowChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -292
    featCall Costume setColorize 255 0 0
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    }
  ]
};
