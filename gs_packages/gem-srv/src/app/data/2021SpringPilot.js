export const MODEL = {
  id: 'Aquatic',
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

# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  prop agent.energyLevel sub 1

  // set name + energyLevel
  exprPush {{ agent.name + ' ' + agent.getProp('energyLevel').value }}
  propPop text

  // set meter
  exprPush {{ agent.getProp('energyLevel').value / 100 }}
  propPop meter

  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 15 }} [[
    featCall Costume setPose 0
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 15 }} [[
    featCall Costume setPose 1
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    featCall Costume setPose 2
    featCall Movement setMovementType 'float'
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]
]]
# PROGRAM UPDATE
when Fish touches Algae [[

  ifExpr {{ Algae.getProp('energyLevel').value > 0 }} [[
    prop Fish.energyLevel add 1
    prop Algae.energyLevel sub 1
    featCall Fish.Costume setGlow 1
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
featProp Physics.radius setTo 16

// show initial level (otherwise level is not shown until run)
exprPush {{ agent.getProp('energyLevel').value }}
propPop text

# PROGRAM EVENT
onEvent Tick [[
  prop energyLevel sub 1

  // show energyLevel
  exprPush {{ agent.getProp('energyLevel').value }}
  propPop text

  // set scale of algae based on energyLevel
  exprPush {{ agent.getProp('energyLevel').value / 100 }}
  propPop scale

  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 1 }} [[
    prop agent.alpha setTo 0.3
    prop agent.isInert setTo true
  ]]

  // // Experimental stack operations
  // propPush agent.energyLevel
  // exprPush {{ 1000 }}
  // // 'add' is not defined and does not run
  // add
  // dbgStack

]]
# PROGRAM UPDATE
when Algae touches Lightbeam [[
  exprPush {{Algae.getProp('energyLevel').value + Lightbeam.getProp('energyRate').value}}
  propPop Algae.energyLevel

  //prop Algae.energyLevel add 1
  featCall Costume setGlow 1
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
addProp speed Number 1
addProp energyRate Number 1

useFeature Physics
featCall Physics setShape 'rectangle'
featCall Physics setSize 100 256

prop agent.skin setTo 'lightbeam.json'

// featCall Movement setController 'user'
// prop agent.x setTo -300
// prop agent.y setTo -300

# PROGRAM EVENT
onEvent Tick [[
  // featPropPush Physics.radius
  // dbgStack
  exprPush {{agent.x + agent.getProp('speed').value; }}
  propPop x
  ifExpr {{ agent.x > 600 }} [[
      prop x setTo -600
  ]]
]]
`
    },
    {
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
# PROGRAM DEFINE
useFeature Population
exprPush {{ 'Reporter' }}
propPop text
# PROGRAM EVENT
onEvent Tick [[
  // count of agents by type
  // featCall Population countAgents 'Algae'
  // exprPush {{ agent.getFeatProp('Population', 'count').value }}
  // propPop text

  // count, sum, avg of agent property
  featCall Population countAgentProp 'Algae' 'energyLevel'
  exprPush {{ "Algae: " + agent.getFeatProp('Population', 'count').value + ' ' + agent.getFeatProp('Population', 'sum').value + ' ' + agent.getFeatProp('Population', 'avg').value }}
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
    {
      id: 501,
      name: 'fish01',
      blueprint: 'Fish',
      // object test      initScript: `prop x setTo {{ x + -220 }}
      initScript: `prop x setTo 0
    prop y setTo 0`
    },
    //     {
    //       id: 502,
    //       name: 'fatFish',
    //       blueprint: 'Fish',
    //       initScript: `prop x setTo 100
    // prop y setTo 100
    // // prop scale setTo 5
    // // prop sizew setTo 80 // size doesn't work
    // prop energyLevel setTo 1000` // extra property test
    //     },
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
prop y setTo 120`
    },
    {
      id: 505,
      name: 'algae02',
      blueprint: 'Algae',
      initScript: `prop x setTo -150
        prop y setTo -120`
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
      initScript: `prop x setTo -600
        prop y setTo -160`
    },
    {
      id: 510,
      name: 'reporter',
      blueprint: 'Reporter',
      initScript: `prop x setTo 0
prop y setTo 200`
    }
  ]
};
