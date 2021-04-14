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
// featCall Costume setCostume 'bunny.json' 0
prop skin setTo 'fish.json'
// featCall Movement setRandomStart
featCall Movement setMovementType 'wander' 0.2
// featCall Label setImage 'energyLevel-1.png'
// featCall Label setText 'energy level'
// featCall Label setPosition 'top'
// featCall Movement setDirection 90
addProp energyLevel Number 20
addProp food String 'donuts'
prop food setTo 'spam'
prop energyLevel setTo 32
prop energyLevel setTo {{ 15 + 20 }}
prop energyLevel setTo {{ energyLevel + 20 }}
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  prop agent.energyLevel sub 1
  dbgOut 'my tick' 'agent instance' {{ agent.getProp('energyLevel').value }}
  dbgOut agent.skin
  dbgOut 'skin' skin
  dbgOut world
  // dbgOut agent.world // doesn't work "TypeError: Cannot read property 'value' of undefined"

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

  // // Variation using code blocks instead of expressions
  // // Expressions {{ }} have a different context than code blocks [[ ]]
  // if [[
  //   prop agent.energyLevel lt {{ agent.getProp('energLevel')) * 15 }}
  // ]] [[
  //   featCall Costume setPose 1
  //   featCall Movement setMovementType 'float'
  // ]]

]]
# PROGRAM UPDATE
when Fish touches Algae [[
  // dbgOut 'Touch!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  prop Fish.energyLevel add 1
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
prop agent.skin setTo 'algae.json'
// featCall Movement setRandomStart
featCall Movement setMovementType 'wander' 0.2
addProp energyLevel Number 50
# PROGRAM EVENT
onEvent Tick [[
  // energyLevel goes down every second
  prop agent.energyLevel sub 1
]]
# PROGRAM UPDATE
when Algae firstTouches Lightbeam [[
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
prop agent.skin setTo 'lightbeam.json'
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
    {
      id: 502,
      name: 'fatFish',
      blueprint: 'Fish',
      initScript: `prop x setTo 100
    prop y setTo 100
    prop food setTo 'bacon'
    prop energyLevel setTo 1000` // extra property test
    },
    {
      id: 503,
      name: 'starvedFish',
      blueprint: 'Fish',
      initScript: `prop x setTo 200` // missing y test
    },
    {
      id: 504,
      name: 'algae01',
      blueprint: 'Algae',
      initScript: `prop x setTo -220
        prop y setTo -220`
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
    }
  ]
};
