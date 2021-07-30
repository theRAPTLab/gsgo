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
      noloop: true // stop after last round
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

addProp energyUse Number 1

// **** OPTIONS TO CHANGE BEHAVIOR ****
// turns on the feature that allows the fish to grow if this is 1
addProp grows Boolean 0

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

    // grow if above 80% energy
    ifExpr {{(Fish.getProp('grows').value) && (Fish.getProp('energyLevel').value > 90) }} [[
      featProp Physics scale setTo 2
      prop Fish.energyUse setTo 2

    ]]

    ifExpr {{Algae.getProp('energyLevel').value <= 0}} [[
      prop Algae.alpha setTo 0.3
      prop Algae.isInert setTo true

      //exprPush {{ 'xx' }}
      //featPropPop AgentWidgets text
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
useFeature AgentWidgets
useFeature Population

// **** OPTIONS TO CHANGE BEHAVIOR ****
// default to 0 (false) but once turned on (1) algae will reproduce if they get to full energy from the sun (so any that start at full won't spawn)
addProp spawns Boolean 0

featCall Costume setCostume 'algae.json' 0

// show meter immediately
featCall AgentWidgets bindMeterTo energyLevel

addProp energyLevel Number 100
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp energyUse Number 0

useFeature Physics
featCall Physics init

useFeature Touches
featCall Touches monitor Fish b2b
featCall Touches monitor Sunbeam b2b

// This is so that the numbers don't suddenly change at start and confusing things
// exprPush {{ '##' }}
// featPropPop AgentWidgets text
//featCall AgentWidgets bindTextTo energyLevel

// disabled algae wander because the hack of putting algae off to the side is wonky with it
featCall Movement setMovementType 'wander' 0.2

exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
featPropPop Physics scale

# PROGRAM UPDATE


when Algae touches Sunbeam [[
  every 1 [[
      featCall Algae.Costume setGlow 1
      exprPush {{Algae.getProp('energyLevel').value + Sunbeam.getProp('energyRate').value}}
      propPop energyLevel

    // update name
    // exprPush {{ agent.getProp('energyLevel').value }}
   // featPropPop AgentWidgets text

    // if Spawning is active, create more algae when we hit 100
    ifExpr {{ agent.getProp('spawns').value }} [[
      ifExpr {{ agent.getProp('energyLevel').value == 100 }} [[
         featCall Population createAgent Algae [[
           prop energyLevel setTo 40
           featCall Costume setGlow 1
           prop x add 25
           prop y add 25
        ]]
        prop energyLevel sub 50
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

  // update name to reflect the new energy level if it is above 0
 // ifExpr {{ agent.getProp('energyLevel').value > 0 }} [[
 // exprPush {{ agent.getProp('energyLevel').value }}
 // featPropPop AgentWidgets text]]

// if the energy level is 0, change name to xx
ifExpr {{ agent.getProp('energyLevel').value == 0 }} [[
  // exprPush {{ 'xx' }}
  // eatPropPop AgentWidgets text
  prop agent.alpha setTo 0.3
  prop isInert setTo true
]]

exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
featPropPop agent.Physics scale

]]
`
    },
    {
      id: 'Sunbeam',
      label: 'Sunbeam',
      script: `# BLUEPRINT Sunbeam
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featCall Costume setCostume 'circle.json' 0
featCall Costume setColorize 1 1 0
prop agent.alpha setTo 0.5

addProp speed Number 20
addProp energyRate Number 5
addProp direction Number 1

useFeature Physics
featCall Physics init
featProp Physics scale setTo 0.4
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

  // **** OPTIONS TO CHANGE BEHAVIOR ****
  // uncomment avg and re-comment max here and below to make this work

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
      //// prop text setTo 'Time: 0'
      # PROGRAM EVENT
      onEvent Tick [[
        prop time add 1
        exprPush {{ 'Time: ' + agent.getProp('time').value }}
        featPropPop AgentWidgets text
      ]]
`
    },
    {
      id: 'DecorationRed',
      label: 'Decoration Red',
      script: `# BLUEPRINT DecorationRed

      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 1

      useFeature Physics
      `
    },
    {
      id: 'DecorationYellow',
      label: 'Decoration Yellow',
      script: `# BLUEPRINT DecorationYellow

      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 0

      useFeature Physics
      `
    },
    {
      id: 'DecorationBlue',
      label: 'Decoration Blue',
      script: `# BLUEPRINT DecorationBlue

      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 2

      useFeature Physics      `
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
      name: 'DecorationYellow1',
      blueprint: 'DecorationYellow',
      initScript: `prop x setTo -384
prop y setTo 362
prop zIndex setTo 200`
    },
    {
      id: 506,
      name: 'DecorationRed1',
      blueprint: 'DecorationRed',
      initScript: `prop x setTo -308
prop y setTo 384
prop zIndex setTo 220`
    },
    {
      id: 507,
      name: 'DecorationBlue1',
      blueprint: 'DecorationBlue',
      initScript: `prop x setTo -350
prop y setTo 378
prop zIndex setTo 210`
    }
  ]
};
