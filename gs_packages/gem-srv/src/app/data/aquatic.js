export const MODEL = {
  label: 'Aquatic Ecosystem',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
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
featCall Movement setMovementType 'wander' 10

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature Physics

// set Touches
useFeature Touches
featCall Touches monitorTouchesWith Algae

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo energyLevel

# PROGRAM EVENT
# PROGRAM UPDATE
when Fish touches Algae [[
  every 1 runAtStart [[
    prop Fish.energyLevel add 10
    prop Algae.energyLevel sub 10
    featCall Fish.Costume setGlow 0.5
  ]]
]]
every 1 runAtStart [[
  // foodLevel goes down every n seconds
  prop agent.energyLevel sub 1

  // // touching Algae test using featMethod
  // ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Algae', 1) }} [[
  //   prop energyLevel add 10
  //   featCall agent.Costume setGlow 0.5
  // ]]

  // set name + energyLevel
  exprPush {{ agent.name + ' ' + agent.getProp('energyLevel').value }}
  featPropPop AgentWidgets text

  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 50 }} [[
    featCall Costume setPose 0
    // Green = 0x00FF00
    featProp AgentWidgets meterColor setTo 65280
  ]]
  // could eat
  ifExpr {{ agent.getProp('energyLevel').value < 50 }} [[
    featCall Costume setPose 1
    // Orange = 0xFF6600
    featProp AgentWidgets meterColor setTo 16737792
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 20 }} [[
    featCall Costume setPose 1
    // Red = 0xFF0000
    featProp AgentWidgets meterColor setTo 16711680
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    featCall Costume setPose 2
    featCall Movement setMovementType 'float'
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]

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

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature AgentWidgets
featCall AgentWidgets bindTextTo energyLevel

useFeature Physics
featCall Physics setSize 32 64
// start scale at 50% to match energyLevel (scale is not set until run)
featProp Physics scale setTo 0.5

// touches
useFeature Touches
featCall Touches monitorTouchesWith 'Fish'
featCall Touches monitorTouchesWith 'Lightbeam'

useFeature Population

# PROGRAM INIT
prop x setTo -430
featCall Movement setRandomPositionY

# PROGRAM EVENT

# PROGRAM UPDATE
when Algae touches Lightbeam [[
  every 1 [[
    featCall Algae.Costume setGlow 0.5
    prop Algae.energyLevel add 10
  ]]
]]
every 1 runAtStart [[
  prop energyLevel sub 1

  // update size
  // This only runs after "GO" is pushed
  exprPush {{ agent.getProp('energyLevel').value / 100}}
  featPropPop agent.Physics scale

  // spawn
  ifExpr {{ agent.getProp('energyLevel').value > 90 }} [[
    featCall Population createAgent Algae [[
      prop energyLevel setTo 40
      featCall Costume setGlow 1
      prop x add 25
      prop y add 25
    ]]
    prop energyLevel sub 50
  ]]
]]

// every ... when
// every 1 [[
//   featCall Touches touchedWithin Lightbeam 0.1
//   when Algae wasTouchedWithin Lightbeam [[
//     featCall Algae.Costume setGlow 0.5
//     prop Algae.energyLevel add 10
//   ]]

//   // update name
//   exprPush {{ agent.getProp('energyLevel').value }}
//   propPop text
// ]]

// every 1 [[
//   // energyLevel dec
//   prop energyLevel sub 1

//   // touching fish?
//   ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Fish', 1) }} [[
//     prop energyLevel sub 10
//   ]]

//   // touching lightbeam?
//   ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Lightbeam', 1) }} [[
//     prop energyLevel add 6
//     featCall agent.Costume setGlow 0.5
//   ]]

//   // update name
//   exprPush {{ agent.getProp('energyLevel').value }}
//   propPop text
// ]]


// every 1 [[
//   dbgOut 'text update' {{ agent.name }} {{ agent.getProp('energyLevel').value }}
//   // show energyLevel
//   // Update BEFORE decrementing, or you'll never see the max value
//   exprPush {{ agent.getProp('energyLevel').value }}
//   propPop text

//   prop energyLevel sub 1

//   // set scale of algae based on energyLevel
//   exprPush {{ 2 * agent.getProp('energyLevel').value / 100 }}
//   propPop scale
//   // exprPush {{ 2 * agent.getProp('energyLevel').value / 100 }}
//   // propPop scaleY

//   // dead
//   ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
//     prop agent.alpha setTo 0.3
//     prop agent.isInert setTo true
//   ]]
// ]]
// when Algae touches Lightbeam [[
//   every 1 [[
//     dbgOut 'algae touches lightbeam' {{ Algae.name }}
//     // exprPush {{Algae.getProp('energyLevel').value + Lightbeam.getProp('energyRate').value}}
//     // propPop Algae.energyLevel
//     prop Algae.energyLevel add 1
//     featCall Algae.Costume setGlow 0.1
//   ]]
// ]]
// when Algae firstTouches Lightbeam [[
//   exprPush {{Algae.getProp('energyLevel').value + Lightbeam.getProp('energyRate').value}}
//   propPop Algae.energyLevel
//   featCall Algae.Costume setGlow 0.1
// ]]
// when Algae lastTouches Lightbeam [[
//   featCall Algae.Costume setGlow 1
// ]]
`
    },
    {
      id: 'Lightbeam',
      label: 'Lightbeam',
      script: `# BLUEPRINT Lightbeam
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featCall Costume setCostume 'lightbeam.json' 0
prop agent.alpha setTo 0.3
addProp speed Number 1
addProp energyRate Number 1

useFeature Physics
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 8

// touches
useFeature Touches

# PROGRAM UPDATE
exprPush {{agent.x + agent.getProp('speed').value; }}
propPop x
ifExpr {{ agent.x > 400 }} [[
    prop x setTo -400
]]
`
    },
    {
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
# PROGRAM DEFINE
useFeature Population
useFeature AgentWidgets
exprPush {{ 'Algae energyLevel avg' }}
featPropPop AgentWidgets text
featProp AgentWidgets isLargeMeter setTo true

// Make skin invisible
prop skin setTo onexone
prop scale setTo 80
prop scaleY setTo 40

# PROGRAM EVENT
# PROGRAM UPDATE
every 1 runAtStart [[
  // count of agents by type
  // featCall Population countAgents 'Algae'
  // exprPush {{ agent.getFeatProp('Population', 'count').value }}
  // propPop text

  // count, sum, avg of agent property
  // featCall Population countAgentProp 'Algae' 'energyLevel'
  // exprPush {{ "Algae: " + agent.getFeatProp('Population', 'count').value + ' ' + agent.getFeatProp('Population', 'sum').value + ' ' + agent.getFeatProp('Population', 'avg').value }}
  // propPop text

  // meter
  featCall Population countAgentProp 'Algae' 'energyLevel'
  exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
  featPropPop AgentWidgets meter

  // label
  exprPush {{ 'Algae energyLevel avg: ' + agent.getFeatProp('Population', 'avg').value }}
  featPropPop AgentWidgets text

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
    }
  ],
  instances: [
    {
      id: 501,
      name: 'fish01',
      blueprint: 'Fish',
      // object test      initScript: `prop x setTo {{ x + -220 }}
      initScript: `prop x setTo 0
    prop y setTo 0
    prop energyLevel setTo 20`
    },
    // {
    //   id: 502,
    //   name: 'fatFish',
    //   blueprint: 'Fish',
    //   initScript: `prop x setTo 100
    //     prop y setTo 100
    //     featCall Physics setSize 128 128
    //     prop energyLevel setTo 1000` // extra property test
    // },
    // {
    //   id: 503,
    //   name: 'starvedFish',
    //   blueprint: 'Fish',
    //   initScript: `prop x setTo 200` // missing y test
    // },
    {
      id: 504,
      name: 'algae01',
      blueprint: 'Algae',
      initScript: `prop x setTo 120
prop y setTo 120
prop energyLevel setTo 20`
    },
    {
      id: 505,
      name: 'algae02',
      blueprint: 'Algae',
      initScript: `prop x setTo -300
        prop y setTo -300
prop energyLevel setTo 50`
    },
    {
      id: 506,
      name: 'algae03',
      blueprint: 'Algae',
      initScript: `prop x setTo -120
        prop y setTo -90
prop energyLevel setTo 80`
    },
    {
      id: 507,
      name: 'lightbeam01',
      blueprint: 'Lightbeam',
      initScript: `prop x setTo -450
    prop y setTo 0`
    },
    {
      id: 510,
      name: 'reporter',
      blueprint: 'Reporter',
      initScript: `prop x setTo 0
           prop y setTo 300`
    }
  ]
};
