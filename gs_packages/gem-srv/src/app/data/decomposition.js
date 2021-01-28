export const MODEL = {
  label: 'Decomposition',
  scripts: [
    {
      id: 'rabbit',
      label: 'Rabbit',
      script: `# BLUEPRINT Rabbit
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
]]

# PROGRAM CONDITION
when Rabbit touches Grass [[
  // Eat grass if it's healthy grass
  ifExpr {{ Grass.getProp('health') > 0 }} [[
    callAgentProp Rabbit health add 1
    // grass remains alive and available
    featureCall Timer poopTimer 2000 [[
      spawn agent Poop
    ]]
  ]]
]]
`
    },
    {
      id: 'grass',
      label: 'Grass',
      script: `# BLUEPRINT GRASS
# PROGRAM DEFINE
useFeature Costume
addProp health Number 3
propCall health setMin 0
propCall health setMax 1
featureCall Costume setCostume 'grass.json' 0
# PROGRAM EVENT
onEvent Tick [[
  // If the World has nutrients, our health is good
  ifExpr {{ callAgentProp World nutrients gt 0 }} [[
    propCall health setTo 1
  ]]
  // If the World has no nutrients, then health is not good
  ifExpr {{ callAgentProp World nutrients lt 1 }} [[
    propCall health setTo 0
  ]]

  // Set COstumes
  // gray grass
  ifExpr {{ agent.getProp('health').value < 1 }} [[
    featureCall Costume setPose 1
  ]]
  // green grass
  ifExpr {{ agent.getProp('health').value >= 1 }} [[
    featureCall Costume setPose 0
  ]]
]]
`
    },
    {
      id: 'tree',
      label: 'Tree',
      script: `# BLUEPRINT TREE
# PROGRAM DEFINE
useFeature Costume
addProp health Number 1
propCall health setMin 0
propCall health setMax 1
featureCall Costume setCostume 'tree.json' 0
# PROGRAM EVENT
onEvent Tick [[
  // If the World has nutrients, our health is good
  ifExpr {{ callAgentProp World nutrients gt 0 }} [[
    propCall health setTo 1
  ]]
  // If the World has no nutrients, then health is not good
  ifExpr {{ callAgentProp World nutrients lt 1 }} [[
    propCall health setTo 0
  ]]

  // Set COstumes
  // gray tree
  ifExpr {{ agent.getProp('health').value < 1 }} [[
    featureCall Costume setPose 1
  ]]
  // green tree
  ifExpr {{ agent.getProp('health').value >= 1 }} [[
    featureCall Costume setPose 0
  ]]
]]
`
    },
    {
      id: 'worm',
      label: 'Worm',
      script: `# BLUEPRINT WORM
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
useFeature Timer
featureCall Costume setCostume 'worm.json' 0
# PROGRAM INIT
# PROGRAM UPDATE
# PROGRAM EVENT
# PROGRAM CONDITION
when Worm touches Poop [[
  // Remove poop when worm eats it?
  featureCall Timer wormcastTimer 2000 [[
    spawn agent WormCasting
  ]]
]]
`
    },
    {
      id: 'decomposition-world',
      label: 'World',
      script: `# BLUEPRINT WORLD
# PROGRAM DEFINE
addProp nutrients Number 0
# PROGRAM UPDATE
onEvent Tick [[
  propCall nutrients sub 1
]]
`
    },
    {
      id: 'decomposition-poop',
      label: 'Poop',
      script: `# BLUEPRINT POOP
# PROGRAM DEFINE
useFeature Costume
featureCall Costume setCostume 'poop.json' 0
`
    },
    {
      id: 'wormcasting',
      label: 'Worm Casting',
      script: `# BLUEPRINT WORMCASTING
# PROGRAM DEFINE
useFeature Costume
featureCall Costume setCostume 'wormcasting.json' 0
# PROGRAM INIT
// When spawned, add nutrients to the world
callAgentProp World nutrients add 1
`
    }
  ],
  instances: [
    {
      id: 'hash1',
      blueprint: 'world',
      x: 0,
      y: 0
    },
    {
      id: 'hash2',
      blueprint: 'tree',
      x: 300,
      y: 100
    },
    {
      id: 'hash2',
      blueprint: 'tree',
      x: 300,
      y: 100
    }
  ]
};
