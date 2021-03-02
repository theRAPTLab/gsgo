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
// useFeature Label
featCall Costume setCostume 'fish.json' 0
// Have to set prop skin -- bug
// otherwise, the costume isn't set
prop agent.skin setTo 'fish.json'
// featCall Movement setRandomStart
featCall Movement setMovementType 'wander' 0.2
// featCall Label setImage 'energyLevel-1.png'
// featCall Label setText 'energy level'
// featCall Label setPosition 'top'
// featCall Movement setDirection 90
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

  // setAgentProp Fish foodLevel {{ Fish.prop.foodLevel.value + 1 }}
  // Code example for setting algae in this context, not needed actually
  // setAgentProp Algae energyLevel {{ Algae.prop.energyLevel.value = 1 }}

  // IDEAL CALL
  // When fish touches algae, food level goes up
  // propCall foodLevel inc 1
  // kill Algae

  // Counter Example
  // We want to set the skin of Fish when Fish touches Algae
  //    prop Fish.skin setTo 'full.json'
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
// when Algae touches Lightbeam [[
//   // When algae touches lightbeam, energyLevel goes up
//   prop Algae.energyLevel inc 1
//   ifExpr {{ Algae.getProp('energyLevel').value > 5 }} [[
//     dbgOut 'spawn new algae'
//     prop Algae.energyLevel setTo 1
//   ]]
//
//   // Counter Example
     // To increment Algae energyLevel, we would.
     // prop Algae.energyLevel add 1
// ]]
`
    },
    {
      id: 'Lightbeam',
      label: 'LightBeam',
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
      script: `# BLUEPRINT POOP
# PROGRAM DEFINE
useFeature Costume
// featCall Costume setCostume 'poop.json' 0
`
    }
  ],
  instances: [
    {
      name: 'fish01',
      blueprint: 'Fish',
      init: `prop x setTo {{ x + -220 }}
    prop y setTo -220`
    },
    {
      name: 'fatFish',
      blueprint: 'Fish',
      init: `prop x setTo 100
    prop y setTo 100`
    },
    {
      name: 'starvedFish',
      blueprint: 'Fish',
      init: `prop x setTo 200
    prop y setTo 200`
    },
    {
      name: 'algae01',
      blueprint: 'Algae',
      init: `prop x setTo -220
    prop y setTo -220`
    },
    {
      name: 'algae02',
      blueprint: 'Algae',
      init: `prop x setTo -150
    prop y setTo -120`
    },
    {
      name: 'algae03',
      blueprint: 'Algae',
      init: `prop x setTo -120
    prop y setTo -90`
    }
  ]
};
