export const MODEL = {
  label: 'Bees',
  scripts: [
    {
      id: 'bee',
      label: 'Bee',
      script: `# BLUEPRINT Bee
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
    }
  ],
  instances: [
    {
      id: 501,
      name: 'bee01',
      blueprint: 'Bee',
      init: `prop x setTo 0
prop y setTo 0`
    },
    {
      id: 502,
      name: 'bee02',
      blueprint: 'Bee',
      init: `prop x setTo 100
prop y setTo 100`
    }
  ]
};
