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
addProp energyLevel Number 100
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  prop agent.energyLevel sub 1
  // dbgOut 'fish energyLevel' {{ agent.getProp('energyLevel').value }}
  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 15 }} [[
    featCall Costume setPose 0
    // featCall Movement setMovementType 'wander'
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 15 }} [[
    featCall Costume setPose 1
    // featCall Movement setMovementType 'wander'
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
  // You'd think you could do this:
  //    setProp skin 'fish.json'
  // ...but that does not work because 'setProp' does not have the Fish context.
  // So you need to specify the agent context
  //    setAgentProp Fish skin 'full.json'
  // or
  //    callAgentProp Fish skin setTo 'full.json'
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
setProp skin 'algae.json'
// featCall Movement setRandomStart
featCall Movement setMovementType 'wander' 0.2
addProp energyLevel Number 50
# PROGRAM UPDATE
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // energyLevel goes down every second
  propCall energyLevel sub 1
  // setProp energyLevel {{ agent.getProp('energyLevel').value * 0.5 }}
  // dbgOut 'algae energyLevel' {{ agent.getProp('energyLevel').value }}
]]
# PROGRAM CONDITION
// when Algae touches Lightbeam [[
//   // When algae touches lightbeam, energyLevel goes up
//   callAgentProp Algae energyLevel inc 1
//   ifExpr {{ Algae.getProp('energyLevel').value > 5 }} [[
//     dbgOut 'spawn new algae'
//     propCall energyLevel setTo 1
//   ]]
//
//   // Counter Example
     // To increment Algae energyLevel, we would.
     //    exec {{ Algae.getProp('energyLevel').inc(1) }}
     // setAgentProp Algae energyLevel {{ Algae.getProp('energyLevel') + 1 }}
     // callAgentProp Algae energyLevel add 1
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
# PROGRAM INIT
featCall Costume setCostume 'lightbeam.json' 0
setProp skin 'lightbeam.json'
// featCall Movement setController 'user'
setProp x -300
setProp y -300
# PROGRAM UPDATE
// example to move featCall Movement jitterPos -5 5
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
// For built-in system functions, e.g. "On Timer", "On Tick", etc.
# PROGRAM CONDITION
// For student defined, e.g. "When"
// e.g. set filtering
// e.g.
`
    },
    {
      id: 'Poop',
      label: 'Poop',
      script: `# BLUEPRINT POOP
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'poop.json' 0
`
    }
  ],
  instances: [
    {
      name: 'fish01',
      blueprint: 'Fish',
      init: `prop agent.x setTo -220
prop agent.y setTo -220`
    },
    {
      name: 'algae01',
      blueprint: 'Algae',
      init: `prop agent.x setTo -220
prop agent.y setTo -220`
    },
    {
      name: 'algae02',
      blueprint: 'Algae',
      init: `prop agent.x setTo -150
prop agent.y setTo -120`
    },
    {
      name: 'algae03',
      blueprint: 'Algae',
      init: `prop agent.x setTo -120
prop agent.y setTo -90`
    }
  ]
};
