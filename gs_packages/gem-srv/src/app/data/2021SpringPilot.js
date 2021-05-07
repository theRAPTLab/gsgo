export const MODEL = {
  label: 'Aquatic Ecosystem',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [true, true],
    bounce: false,
    bgcolor: 0x000066
  },
  scripts: [
    {
      id: 'Fish',
      label: 'Fish',
      isControllable: true,
      script: `# BLUEPRINT Fish
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featCall Costume setCostume 'fish.json' 0

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp energyUse Number 1

// turns on the feature that allows the fish to grow if this is 1
addProp grows Boolean 0

addProp startDirection Number 0

useFeature Physics
featCall Physics init
featCall Physics setSize 90

// set Touches
useFeature Touches
featCall Touches monitorTouchesWith Algae

// show meter immediately
exprPush {{ agent.getProp('energyLevel').value / 100 }}
propPop meter

// set name
exprPush {{ agent.name }}
propPop text

# PROGRAM EVENT
onEvent Start [[
  // start at normal size unless you eat
  featCall Physics setSize 90

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

    exprPush {{ agent.getProp('energyLevel').value / 100 }}
    propPop meter

    // set name + energyLevel
    exprPush {{ agent.name }}
    propPop text

]]
# PROGRAM UPDATE
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
      featCall Physics setSize 150
      prop Fish.energyUse setTo 2

    ]]

    ifExpr {{Algae.getProp('energyLevel').value <= 0}} [[
      prop Algae.alpha setTo 0.3
      prop Algae.isInert setTo true
      prop Algae.text setTo 'xx'
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
    // Green = 0x00FF00
    prop meterClr setTo 65280
  ]]
  // could eat
  ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
    featCall Costume setPose 1
    // Orange = 0xFF6600
    prop meterClr setTo 16737792
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
    featCall Costume setPose 1
    // Red = 0xFF0000
    prop meterClr setTo 16711680
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    featCall Costume setPose 2
    featCall Movement setMovementType 'float'
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]

  // set meter
  exprPush {{ agent.getProp('energyLevel').value / 100 }}
  propPop meter

]]
`
    },
    {
      id: 'Algae',
      label: 'Algae',
      isControllable: true,
      script: `# BLUEPRINT Algae
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featCall Costume setCostume 'algae.json' 0

addProp energyLevel Number 100
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp energyUse Number 0

useFeature Physics
featCall Physics init
//featProp Physics.radius setTo 16

useFeature Touches
featCall Touches monitorTouchesWith 'Fish'
featCall Touches monitorTouchesWith 'Sunbeam'

// This is so that the numbers don't suddenly change at start and confusing things
prop text setTo '##'

// disabled algae wander because the hack of putting algae off to the side is wonky with it
featCall Movement setMovementType 'wander' 0.2

# PROGRAM INIT
//exprPush {{ agent.getProp('energyLevel').value }}
//propPop text

//exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
//featPropPop Physics scale

# PROGRAM UPDATE
when Algae touches Sunbeam [[
  every 1 [[
      featCall Algae.Costume setGlow 1
      exprPush {{Algae.getProp('energyLevel').value + Sunbeam.getProp('energyRate').value}}
      propPop energyLevel

      // update name
      exprPush {{ agent.getProp('energyLevel').value }}
      propPop text
  ]]
]]
every 1 runAtStart [[

  // decrease energy each tick, using the energyUse varable to determine how much
  ifExpr {{ agent.getProp('energyLevel').value > 0 }} [[
  exprPush {{ agent.getProp('energyLevel').value - agent.getProp('energyUse').value}}
  propPop agent.energyLevel
  ]]

  // update name to reflect the new energy level if it is above 0
  ifExpr {{ agent.getProp('energyLevel').value > 0 }} [[
  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text
]]

// if the energy level is 0, change name to xx
ifExpr {{ agent.getProp('energyLevel').value == 0 }} [[
  prop text setTo 'xx'
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
featCall Costume setCostume 'lightbeam.json' 0
addProp speed Number 10
addProp energyRate Number 5
addProp direction Number 1

useFeature Physics
featCall Physics init
featProp Physics scale setTo 0.4
featProp Physics scaleY setTo 2.5


useFeature Touches

prop agent.skin setTo 'lightbeam.json'
prop agent.alpha setTo 0.5



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
//exprPush {{ agent.getProp('reportSubject').value + ' meter'}}
//propPop text
prop text setTo 'Algae avg'

// Make skin invisible
prop skin setTo 'onexone'

// Show meter on start.
prop meterLarge setTo true
exprPush {{ 1 }}
propPop meter

# PROGRAM INIT
prop x setTo 75
prop y setTo 320
prop reportSubject setTo Algae
prop alpha setTo 0.3
prop meterClr setTo 65280

# PROGRAM EVENT

onEvent Tick [[

    // Algae meter display
    featCall Population countAgentProp 'Algae' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
    propPop meter

    exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getFeatProp('Population', 'avg').value}}
    propPop text
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
prop text setTo 'Fish max'

// Make skin invisible
prop skin setTo 'onexone'

// Show meter on start.
prop meterLarge setTo true
exprPush {{ 1 }}
propPop meter

# PROGRAM INIT
prop x setTo -75
prop y setTo 320
prop reportSubject setTo Fish
prop alpha setTo 0.3
prop meterClr setTo 3120383

# PROGRAM EVENT

onEvent Tick [[

  // setup meter for max value
  featCall Population maxAgentProp 'Fish' 'energyLevel'
  exprPush {{ agent.getFeatProp('Population', 'max').value * 0.01 }}

  // setup meter for avg value
  // featCall Population countAgentProp 'Fish' 'energyLevel'
  //   exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}


    propPop meter

    // text for max value
    exprPush {{ agent.getProp('reportSubject').value + ' max: ' + (agent.getFeatProp('Population', 'max').value > 0 ? agent.getFeatProp('Population', 'max').value : 0 )}}

    // text for avg value
    // exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getFeatProp('Population', 'avg').value}}

    propPop text
]]
`
    },
    {
      id: 'Timer',
      label: 'Timer',
      script: `# BLUEPRINT Timer
      # PROGRAM DEFINE
      prop skin setTo 'onexone'
      addProp time Number 0
      prop text setTo 'Time: 0'
      # PROGRAM EVENT
      onEvent Tick [[
        prop time add 1
        exprPush {{ 'Time: ' + agent.getProp('time').value }}
        propPop text

      ]]
      # PROGRAM UPDATE
      // when xxx touches yyy [[ ]]
`
    },
    {
      id: 'DecorationRed',
      label: 'Decoration Red',
      script: `# BLUEPRINT DecorationRed
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 1
      `
    },
    {
      id: 'DecorationYellow',
      label: 'Decoration Yellow',
      script: `# BLUEPRINT DecorationYellow
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 0
      `
    },
    {
      id: 'DecorationBlue',
      label: 'Decoration Blue',
      script: `# BLUEPRINT DecorationBlue
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'flower.json' 2
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
      initScript: `prop x setTo -150
prop y setTo -120
prop energyLevel setTo 50`
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
