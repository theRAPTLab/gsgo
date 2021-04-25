export const MODEL = {
  id: 'Aquatic',
  label: 'Aquatic Ecosystem',
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

// turns on the feature that allows the fish to grow if this is 1
addProp grows Boolean 0

addProp startDirection Number 0

useFeature Physics
featCall Physics init
featCall Physics setSize 90

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
    featPropPop agent.Movement.direction

    exprPush {{ agent.getProp('energyLevel').value / 100 }}
    propPop meter

]]
# PROGRAM UPDATE
when Fish touches Algae [[
  every 1 runAtStart [[
    prop Fish.energyLevel add 10
    prop Algae.energyLevel sub 10
    featCall Fish.Costume setGlow 0.5

    // grow if above 80% energy
    ifExpr {{(Fish.getProp('grows').value) && (Fish.getProp('energyLevel').value > 90) }} [[
      featCall Physics setSize 150

    ]]

    ifExpr {{Algae.getProp('energyLevel').value <= 0}} [[
      prop Algae.alpha setTo 0.3
      prop Algae.isInert setTo true
    ]]




  ]]
]]
every 1 runAtStart [[
  // foodLevel goes down every n seconds
  prop agent.energyLevel sub 1

  // if fish is bigger than 1, use even more energy
  ifExpr {{(agent.getProp('scale').value > 1.5)}} [[
    prop agent.energyLevel sub 1
  ]]

  // set name + energyLevel
  exprPush {{ agent.name + ' ' + agent.getProp('energyLevel').value }}
  propPop text

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
// keep scale above 0.3 so it remains visible
// prop scale setMin 0.3

addProp energyLevel Number 100
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature Physics
featProp Physics.radius setTo 16

// show initial level (otherwise level is not shown until run)
//exprPush {{ agent.getProp('energyLevel').value }}
//propPop text
prop text setTo '##'

# PROGRAM INIT
// put new algae into bottom left for the farming setup if needed
prop x setTo -430
prop y setTo 370

# PROGRAM EVENT
onEvent Start [[

  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text

  exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
  propPop agent.scale
]]

# PROGRAM UPDATE
when Algae touches Sunbeam [[
  every 1 [[
    featCall Algae.Costume setGlow 1
    exprPush {{Algae.getProp('energyLevel').value + Sunbeam.getProp('energyRate').value}}
    propPop energyLevel
  ]]

  // update name
  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text
]]
every 1 [[
  prop energyLevel sub 1
  // update name
  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text

]]

every 0.5 [[
  exprPush {{ (agent.getProp('energyLevel').value / 100)* 2}}
  propPop agent.scale
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
featCall Physics setShape 'rectangle'
featCall Physics setSize 100 500

prop agent.skin setTo 'lightbeam.json'
prop agent.alpha setTo 0.3

# PROGRAM EVENT
onEvent Tick [[
  // featPropPush Physics.radius
  // dbgStack
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
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
# PROGRAM DEFINE
addProp reportSubject String ''

useFeature Population
//exprPush {{ agent.getProp('reportSubject').value + ' meter'}}
//propPop text
prop text setTo 'meter'


// Make skin invisible
prop skin setTo '1x1'

// Show meter on start.
prop meterLarge setTo true
exprPush {{ 1 }}
propPop meter

# PROGRAM EVENT
onEvent Tick [[
  // count of agents by type
  // featCall Population countAgents 'Algae'
  // exprPush {{ agent.getFeatProp('Population', 'count').value }}
  // propPop text

  // count, sum, avg of agent property
  // featCall Population countAgentProp 'Algae' 'energyLevel'
  // exprPush {{ "Algae: " + agent.getFeatProp('Population', 'count').value + ' ' + agent.getFeatProp('Population', 'sum').value + ' ' + agent.getFeatProp('Population', 'avg').value }}
  // propPop text


  // Algae meter
  ifExpr {{ agent.getProp('reportSubject').value == 'Algae' }} [[
    featCall Population countAgentProp 'Algae' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
    propPop meter

    exprPush {{ agent.getProp('reportSubject').value + ' avg: ' + agent.getFeatProp('Population', 'avg').value}}
    propPop text

    prop meterClr setTo 65280
  ]]

  // Fish meter
  ifExpr {{ agent.getProp('reportSubject').value == 'Fish' }} [[
    featCall Population maxAgentProp 'Fish' 'energyLevel'
    exprPush {{ agent.getFeatProp('Population', 'max').value * 0.01 }}
    propPop meter

    exprPush {{ agent.getProp('reportSubject').value + ' max: ' + agent.getFeatProp('Population', 'max').value}}
    propPop text

    prop meterClr setTo 3120383
  ]]

  // min
  // featCall Population minAgentProp 'Algae' 'energyLevel'
  // exprPush {{ agent.getFeatProp('Population', 'min').value }}
  // propPop text

  // max
  // featCall Population maxAgentProp 'Algae' 'energyLevel'
  // exprPush {{ agent.getFeatProp('Population', 'max').value }}
  // propPop text
]]
`
    },
    {
      id: 'Timer',
      label: 'Timer',
      script: `# BLUEPRINT Timer
      # PROGRAM DEFINE
      // useFeature Costume
      // useFeature Movement
      prop skin setTo '1x1'
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
    }
  ],
  instances: [
    //    {
    //      id: 501,
    //      name: 'Nathan Fish',
    //      blueprint: 'Fish',
    //      // object test      initScript: `prop x setTo {{ x + -220 }}
    //      initScript: `prop x setTo 0
    //prop y setTo 0
    //prop energyLevel setTo 54
    //prop startDirection setTo 160`
    //    },
    //    {
    //      id: 502,
    //      name: 'Kalani Fish',
    //      blueprint: 'Fish',
    //      initScript: `prop x setTo 100
    //prop y setTo 100
    //prop energyLevel setTo 100
    //prop startDirection setTo 90` // extra property test
    //   },
    //   {
    //     id: 503,
    //     name: 'Sara Fish',
    //     blueprint: 'Fish',
    //     initScript: `prop x setTo 200
    //     prop startDirection setTo 0` // missing y test
    //   },
    {
      id: 504,
      name: 'Algae 1',
      blueprint: 'Algae',
      initScript: `prop x setTo 120
prop y setTo 120`
    },
    {
      id: 505,
      name: 'Algae 2',
      blueprint: 'Algae',
      initScript: `prop x setTo -150
prop y setTo -120
prop energyLevel setTo 50`
    },
    {
      id: 506,
      name: 'Algae 3',
      blueprint: 'Algae',
      initScript: `prop x setTo -120
prop y setTo -90`
    },
    {
      id: 507,
      name: 'Sunbeam 1',
      blueprint: 'Sunbeam',
      initScript: `prop x setTo -400
prop y setTo -180`
    },
    {
      id: 510,
      name: 'Avg Algae Health',
      blueprint: 'Reporter',
      initScript: `prop x setTo 50
prop y setTo 320
prop reportSubject setTo 'Algae'
prop alpha setTo 0.3
prop meterClr setTo 65280`
    },
    {
      id: 511,
      name: 'Max Fish  Health',
      blueprint: 'Reporter',
      initScript: `prop x setTo -50
prop y setTo 320
prop reportSubject setTo 'Fish'
prop alpha setTo 0.3
prop meterClr setTo 3120383`
    },
    {
      id: 512,
      name: 'Timer',
      blueprint: 'Timer',
      initScript: `prop x setTo 0
prop y setTo 350`
    }
  ]
};
