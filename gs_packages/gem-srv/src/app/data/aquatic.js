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

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp type String 'change'

// STUDENTS_MAY_CHANGE - set as consumer or producer
prop type setTo 'change'

addProp energyUse Number 0

// STUDENTS_MAY_CHANGE - to change how quickly Fish use up energy and get hungry
prop energyUse setTo 1

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
    // ** pick a movement below:
    // this line for wandering:
    // featCall Movement setMovementType 'wander' 0.5

    // this line for edge to edge, 0 == straight right, change to 90 to go up, 180 left, etc.
    // featCall Movement setMovementType 'edgeToEdge' 1 0

    // this line to pick a random direction and go until you hit the edge then reverse ... add 'rand' if you want to pick starting directions randomly
    // in this example it will be ignored anyhow because I am setting  the startDirection just below:
    featCall Movement setMovementType 'edgeToEdge' 1 0 180

    exprPush {{ agent.getProp('startDirection').value }}
    featPropPop agent.Movement direction

    // STUDENTS_MAY_CHANGE to make fish move faster when they are automatic
    featProp Movement distance setTo 2

    featCall AgentWidgets bindMeterTo energyLevel

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
    featCall Fish.Costume setGlow 0.5

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

exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
featPropPop Physics scale

# PROGRAM UPDATE
when Algae touches Sunbeam [[
  every 1 [[
      featCall Algae.Costume setGlow 1
      exprPush {{Algae.getProp('energyLevel').value + Sunbeam.getProp('energyRate').value}}
      propPop energyLevel

    // if Spawning is active, create more algae when we hit 100
    ifExpr {{ agent.getProp('spawns').value }} [[
      ifExpr {{ agent.getProp('energyLevel').value == 100 }} [[
        prop energyLevel sub 50
        featCall Population createAgent Algae [[
          // STUDENTS_MAY_CHANGE - maybe change the new energy level (currently 40) or the threshold (from 100) or the new position or other things
           prop energyLevel setTo 40
           featCall Costume setGlow 1
           prop x add 25
           prop y add 25
        ]]
      ]]
    ]] // if spawning

  ]]
]]
  every 1 runAtStart [[

    // decrease energy each tick, using the energyUse varable to determine how much
    ifExpr {{ agent.getProp('energyLevel').value > 0 }} [[
    exprPush {{ agent.getProp('energyLevel').value - agent.getProp('energyUse').value}}
    propPop agent.energyLevel
    ]]

    // re-scale the algae based on its energy level
  exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
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
      label: 'Algae avg meter',
      script: `# BLUEPRINT AlgaeAvgMeter
# PROGRAM DEFINE
addProp reportSubject String 'Algae'

useFeature Population
useFeature AgentWidgets

exprPush {{ 'Algae avg' }}
featPropPop AgentWidgets text

// Make skin invisible
prop skin setTo 'onexone'

// Show meter on start.
featProp AgentWidgets isLargeGraphic setTo true
exprPush {{ 1 }}
featPropPop AgentWidgets meter

# PROGRAM INIT
prop x setTo 75
prop y setTo 320
prop reportSubject setTo Algae
prop alpha setTo 0.3
featProp AgentWidgets meterColor setTo 65280

# PROGRAM EVENT

onEvent Tick [[

    // TEAM_MAY_CHANGE - change the character, variable, and possible countTypeto a different name as needed

    // Algae meter display
    featCall Population countAgentProp 'Algae' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
    featPropPop AgentWidgets meter

    exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getFeatProp('Population', 'avg').value}}
    featPropPop AgentWidgets text
]]
`
    },
    {
      id: 'FishMaxMeter',
      label: 'Fish max meter',
      script: `# BLUEPRINT FishMaxMeter
# PROGRAM DEFINE
addProp reportSubject String 'Fish'

useFeature Population
useFeature AgentWidgets

exprPush {{ 'Fish max' }}
featPropPop AgentWidgets text

// Make skin invisible
prop skin setTo 'onexone'

// Show meter on start.
featProp AgentWidgets isLargeGraphic setTo true
 exprPush {{ 1 }}
 featPropPop AgentWidgets meter

# PROGRAM INIT
prop x setTo -75
prop y setTo 320
prop reportSubject setTo Fish
prop alpha setTo 0.3
featProp AgentWidgets meterColor setTo 3120383

# PROGRAM EVENT

onEvent Tick [[

  // TEAM_MAY_CHANGE - change the character, variable, and possible countTypeto a different name as needed

  // setup meter for max value
  featCall Population maxAgentProp 'Fish' 'energyLevel'
  exprPush {{ agent.getFeatProp('Population', 'max').value * 0.01 }}

  // setup meter for avg value
  // featCall Population countAgentProp 'Fish' 'energyLevel'
  //  exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}

  featPropPop AgentWidgets meter

  // text for max value
  exprPush {{ agent.getProp('reportSubject').value + ' max: ' + (agent.getFeatProp('Population', 'max').value > 0 ? agent.getFeatProp('Population', 'max').value : 0 )}}

  // text for avg value
  // exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getFeatProp('Population', 'avg').value}}

  featPropPop AgentWidgets text]]
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
    }
  ],
  instances: [
    {
      id: 501,
      name: 'Algae 1',
      blueprint: 'Algae',
      initScript: `prop x setTo 120
       prop y setTo 120`
    },
    {
      id: 502,
      name: 'Algae 2',
      blueprint: 'Algae',
      initScript: `prop energyLevel setTo 50
 prop x setTo -150
 prop y setTo -120
`
    },
    {
      id: 503,
      name: 'Algae 3',
      blueprint: 'Algae',
      initScript: `prop x setTo -120
prop y setTo -90`
    },
    {
      id: 504,
      name: 'Timer',
      blueprint: 'Timer',
      initScript: `prop x setTo 0
prop y setTo 350`
    },
    {
      id: 505,
      name: 'Rock1',
      blueprint: 'Rock',
      initScript: `prop x setTo -350
prop y setTo 368
featProp Physics scale setTo 1.3
prop zIndex setTo 210`
    },
    {
      id: 506,
      name: 'Rock2',
      blueprint: 'Rock',
      initScript: `prop x setTo 350
prop y setTo 378
featProp Costume flipX setTo true
prop zIndex setTo 210`
    }
  ]
};
