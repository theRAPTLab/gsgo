export const MODEL = {
  label: 'Moths',
  scripts: [
    {
      id: 'moth',
      label: 'Moth',
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
useFeature Timer
featureCall Costume setCostume 'rabbit.json' 0
addProp health Number 3
propCall health setMin 0
propCall health setMax 10

# PROGRAM INIT

# PROGRAM UPDATE

# PROGRAM EVENT
onEvent Tick [[
  propCall health sub 1
  // hungry
  ifExpr {{ agent.getProp('health').value < 1}} [[
    featureCall Costume setPose 1
  ]]
  ifExpr {{ agent.getProp('health').value > 1}} [[
    featureCall Costume setPose 0
  ]]

  // After N time, spawn a new moth
  // the same color as me.
]]

# PROGRAM CONDITION
when Moth touches Grass [[
  // Eat grass if it's healthy grass
  ifExpr {{ Grass.getProp('health') > 0 }} [[
    callAgentProp Rabbit health add 1
    // grass remains alive and available
    featureCall Timer poopTimer 2000 [[
      spawn agent Poop
    ]]
  ]]
]]

// INSTANCES DEFINITION
// * Add n number of light moths, m number of dark moths initially
`
    },
    {
      id: 'predator',
      label: 'Predator',
      script: `
# PROGRAM CONDITION
when Predator touchesFor2Seconds Moth [[
  // eat moth
]]
`
    }
  ]
};
