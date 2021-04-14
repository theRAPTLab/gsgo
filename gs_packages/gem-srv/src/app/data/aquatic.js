export const MODEL = {
  label: 'Aquatic Ecosystem',
  scripts: [
    {
      id: 'Fish',
      label: 'Fish',
      script: `# BLUEPRINT Fish
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featCall Costume setCostume 'fish.json' 0
featCall Movement setMovementType 'wander' 0.5

addProp energyLevel Number 20
prop energyLevel setMax 100
prop energyLevel setMin 0

useFeature Physics
featCall Physics init
featCall Physics setSize 90

// show meter immediately
exprPush {{ agent.getProp('energyLevel').value / 100 }}
propPop meter

// set name
exprPush {{ agent.name }}
propPop text

// handle touch
addProp isTouching Boolean false


# PROGRAM EVENT
onEvent Start [[
  dbgOut 'Start'

  onEvery 3 [[
    // foodLevel goes down every n seconds
    prop agent.energyLevel sub 1
    // eat and glow
    ifExpr {{ agent.getProp('isTouching').value == true }} [[
      featCall Costume setGlow 1
      prop agent.energyLevel add 10
      prop agent.isTouching setTo false
    ]]
  ]]

]]
onEvent Tick [[
  // // foodLevel goes down every second
  // prop agent.energyLevel sub 1

  // ifExpr {{ agent.getProp('isTouching').value == true }} [[
  //   dbgOut 'TOUCH!'
  //   prop agent.energyLevel add 2
  //   prop agent.isTouching setTo false
  // ]]

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
# PROGRAM UPDATE
when Fish touches Algae [[

  ifExpr {{ Algae.getProp('energyLevel').value > 0 }} [[
    // handled by 'onEvery'
    // prop Fish.energyLevel add 1
    // prop Algae.energyLevel sub 1
    prop Fish.isTouching setTo true
    prop Algae.isTouching setTo true
    featCall Algae.Costume setGlow 2
  ]]

  // Add energy to Fish and subtract energy from Algae
  //
  // This doens't work: Fish and Algae context are lost within the ifExpr in when
  //ifExpr {{ Algae.getProp('energyLevel').value > 0 }} [[
  //  prop Fish.energyLevel add 1
  //  prop Algae.energyLevel sub 1
  //]]
  //
  // hack around ifExpr bug
  // exprPush {{ Fish.getProp('energyLevel').value + (Algae.getProp('energyLevel').value > 0 ? 1 : 0) }}
  // propPop Fish.energyLevel
  // // min is 0, so it's always OK to subtract one
  // prop Algae.energyLevel sub 1

]]
`
    },
    {
      id: 'Algae',
      label: 'Algae',
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
featCall Physics init
featCall Physics setScale 2

// show initial level (otherwise level is not shown until run)
exprPush {{ agent.getProp('energyLevel').value }}
propPop text

// handle touch
addProp isTouching Boolean false

# PROGRAM EVENT
onEvent Start [[
  dbgOut 'Start Algae'
  onEvery 3 [[
    ifExpr {{ agent.getProp('isTouching').value == true }} [[
      prop agent.energyLevel sub 10
      prop agent.isTouching setTo false
    ]]
  ]]
]]
onEvent Tick [[
  ifExpr {{ agent.getProp('isTouching').value == true }} [[
    // dbgOut 'TOUCH!'
    // prop agent.energyLevel sub 5
    // prop agent.isTouching setTo false
  ]]

  // show energyLevel
  // Update BEFORE decrementing, or you'll never see the max value
  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text

  prop energyLevel sub 1

  // set scale of algae based on energyLevel
  exprPush {{ 2 * agent.getProp('energyLevel').value / 100 }}
  propPop scale
  // exprPush {{ 2 * agent.getProp('energyLevel').value / 100 }}
  // propPop scaleY

  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]
]]

# PROGRAM UPDATE
when Algae lastTouches Lightbeam [[
  exprPush {{Algae.getProp('energyLevel').value + Lightbeam.getProp('energyRate').value}}
  propPop Algae.energyLevel

  featCall Algae.Costume setGlow 1
]]
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
addProp speed Number 5
addProp energyRate Number 1

useFeature Physics
featCall Physics setShape 'rectangle'
featCall Physics setSize 100 1000

# PROGRAM EVENT
onEvent Start [[
  onEvery 0.1 [[
    exprPush {{agent.x + agent.getProp('speed').value; }}
    propPop x
    ifExpr {{ agent.x > 500 }} [[
        prop x setTo -500
    ]]
  ]]
]]
onEvent Tick [[
  // exprPush {{agent.x + agent.getProp('speed').value; }}
  // propPop x
  // ifExpr {{ agent.x > 500 }} [[
  //     prop x setTo -500
  // ]]
]]
`
    },
    {
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
# PROGRAM DEFINE
useFeature Population
exprPush {{ 'Algae energyLevel avg' }}
propPop text

// Make skin invisible
prop skin setTo '1x1'
prop scale setTo 80
prop scaleY setTo 40

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

  // meter
  featCall Population countAgentProp 'Algae' 'energyLevel'
  exprPush {{ agent.getFeatProp('Population', 'avg').value / 100 }}
  propPop meter

  // label
  exprPush {{ 'Algae energyLevel avg: ' + agent.getFeatProp('Population', 'avg').value }}
  propPop text

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
  // instances: [
  //   {
  //     name: 'fish01',
  //     blueprint: 'Fish',
  //     initScript: `prop agent.x setTo {{ agent.x + -220 }}`
  //   },
  //   {
  //     name: 'fatFish',
  //     blueprint: 'Fish',
  //     initScript: `prop agent.x setTo 100`
  //   }
  instances: [
    //     {
    //       id: 501,
    //       name: 'fish01',
    //       blueprint: 'Fish',
    //       // object test      initScript: `prop x setTo {{ x + -220 }}
    //       initScript: `prop x setTo 0
    // prop y setTo 0
    // prop energyLevel setTo 54`
    //     },
    //     {
    //       id: 502,
    //       name: 'fatFish',
    //       blueprint: 'Fish',
    //       initScript: `prop x setTo 100
    //     prop y setTo 100
    //     featCall Physics setSize 128 128
    //     prop energyLevel setTo 1000` // extra property test
    //     },
    //        {
    //          id: 503,
    //          name: 'starvedFish',
    //          blueprint: 'Fish',
    //          initScript: `prop x setTo 200` // missing y test
    //        },
    {
      id: 504,
      name: 'algae01',
      blueprint: 'Algae',
      initScript: `prop x setTo 120
prop y setTo 120`
    },
    {
      id: 505,
      name: 'algae02',
      blueprint: 'Algae',
      initScript: `prop x setTo -300
        prop y setTo -300`
    },
    {
      id: 506,
      name: 'algae03',
      blueprint: 'Algae',
      initScript: `prop x setTo -120
        prop y setTo -90`
    },
    {
      id: 507,
      name: 'lightbeam01',
      blueprint: 'Lightbeam',
      initScript: `prop x setTo -450
    prop y setTo 0`
    }
    //     {
    //       id: 510,
    //       name: 'reporter',
    //       blueprint: 'Reporter',
    //       initScript: `prop x setTo 0
    // prop y setTo 300`
    //     }
  ]
};
