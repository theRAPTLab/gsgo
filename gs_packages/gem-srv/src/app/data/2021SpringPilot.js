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
featCall Costume setScale 1
featCall Movement setMovementType 'wander' 0.2
addProp energyLevel Number 20
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  prop agent.energyLevel sub 1

  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 15 }} [[
    featCall Costume setPose 0
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 15 }} [[
    featCall Costume setPose 1
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 0 }} [[
    featCall Costume setPose 2
    featCall Movement setMovementType 'float'
  ]]
]]
# PROGRAM UPDATE
when Fish touches Lightbeam [[
  prop Fish.energyLevel add 100
  ifExpr {{ Fish.getProp('energyLevel').value > 100 }} [[
    dbgOut 'FAT!'
  ]]
]]
when Fish touches Algae [[
  // dbgOut "Algae touched by " {{ Fish.meta.name }}
  featCall Costume setGlow 1
  // Fish and Algae context are lost within the ifExpr in when
  //ifExpr {{ Algae.getProp('energyLevel').value > 0 }} [[
    prop Fish.energyLevel add 1
    prop Algae.energyLevel sub 1
  //]]
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
prop scale setMin 0.3
addProp energyLevel Number 100
# PROGRAM EVENT
onEvent Tick [[
  prop energyLevel sub 1

  // set scale of algae based on energyLevel
  exprPush {{ agent.getProp('energyLevel').value / 100 }}
  propPop scale

  // Experimental stack operations
  propPush agent.energyLevel
  exprPush {{ 1000 }}
  // gobblygook is not triggering an error
  gobblygook
  // add does not seem to run
  add
  dbgStack
]]
# PROGRAM UPDATE
when Algae touches Lightbeam [[
  prop Algae.energyLevel add 1
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
prop agent.skin setTo 'lightbeam.json'
prop agent.scale setTo 0.25
prop agent.scaleY setTo 0.5

// featCall Movement setController 'user'
prop agent.x setTo -300
prop agent.y setTo -300
`
    },
    {
      id: 'Poop',
      label: 'Poop',
      script: `# BLUEPRINT Poop
# PROGRAM DEFINE
useFeature Costume
// featCall Costume setCostume 'poop.json' 0
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
    // {
    //   id: 505,
    //   name: 'algae02',
    //   blueprint: 'Algae',
    //   initScript: `prop x setTo -150
    //     prop y setTo -120`
    // },
    // {
    //   id: 506,
    //   name: 'algae03',
    //   blueprint: 'Algae',
    //   initScript: `prop x setTo -120
    //     prop y setTo -90`
    // }
    {
      id: 507,
      name: 'lightbeam01',
      blueprint: 'Lightbeam',
      initScript: `prop x setTo -220
        prop y setTo -220`
    }
  ]
};
