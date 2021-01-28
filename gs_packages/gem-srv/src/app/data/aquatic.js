export const MODEL = {
  label: 'Aquatic Ecosystem',
  scripts: [
    {
      id: 'fish',
      label: 'Fish',
      script: `# BLUEPRINT Fish
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
useFeature Label
featureCall Costume setCostume 'fish.json' 0
featureCall Movement setMovementType 'wander' 1
featureCall Label setImage 'energyLevel-1.png'
featureCall Label setText 'energy level'
featureCall Label setPosition 'top'
// featureCall Movement setDirection 90
addProp energyLevel Number 20
# PROGRAM UPDATE
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // foodLevel goes down every second
  propCall energyLevel sub 1
  // dbgOut 'fish energyLevel' {{ agent.getProp('energyLevel').value }}
  // sated
  ifExpr {{ agent.getProp('energyLevel').value > 15 }} [[
    featureCall Costume setPose 0
    featureCall Movement setMovementType 'wander'
  ]]
  // hungry
  ifExpr {{ agent.getProp('energyLevel').value < 15 }} [[
    featureCall Costume setPose 1
    featureCall Movement setMovementType 'wander'
  ]]
  // dead
  ifExpr {{ agent.getProp('energyLevel').value < 0 }} [[
    featureCall Costume setPose 2
    featureCall Movement setMovementType 'float'
  ]]

  // Variation using code blocks instead of expressions
  // Expressions {{ }} have a different context than code blocks [[ ]]
  if [[
    propCall energyLevel lt {{ agent.getProp('energLevel')) * 15 }}

    // This won't work:
    //   agent.getProp('energyLevel').value
    // because code block context does not include 'agent'

  ]] [[
    featureCall Costume setPose 1
    featureCall Movement setMovementType 'float'

    // Using Expressions
    // Expressions and Block Script use different execution engines
    // To set a prop...
    // ...This own't work:
    //   agent.xxx dot notation because this only works in Expressions
    // ...nor this:
    //   'setAgentProp xxx' because this works inside of global CONDITIONS context
    // ...Use this instead...
    //   setProp energyLevel
  ]]

]]

# PROGRAM CONDITION
when Fish touches Algae [[
  // dbgOut 'Touch!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  // dbgContext

  setProp energyLevel {{ Fish.prop.energyLevel.value + 1 }}

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
      id: 'algae',
      label: 'Algae',
      script: `# BLUEPRINT Algae
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
featureCall Costume setCostume 'algae.json' 0
// featureCall Movement setRandomStart
featureCall Movement setMovementType 'wander' 0.2
addProp energyLevel Number 50
# PROGRAM UPDATE
# PROGRAM THINK
// featureHook Costume thinkHook
# PROGRAM EVENT
onEvent Tick [[
  // energyLevel goes down every second
  propCall energyLevel sub 1
  // setProp energyLevel {{ agent.getProp('energyLevel').value * 0.5 }}
  dbgOut 'algae energyLevel' {{ agent.getProp('energyLevel').value }}
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
      id: 'lightbeam',
      label: 'LightBeam',
      script: `# BLUEPRINT Lightbeam
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
# PROGRAM INIT
featureCall Costume setCostume 'lightbeam.json' 0
// featureCall Movement setController 'user'
setProp x -300
setProp y -300
# PROGRAM UPDATE
// example to move featureCall Movement jitterPos -5 5
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
      id: 'poop',
      label: 'Poop',
      script: `# BLUEPRINT POOP
# PROGRAM DEFINE
useFeature Costume
featureCall Costume setCostume 'poop.json' 0
`
    }
  ]
};
