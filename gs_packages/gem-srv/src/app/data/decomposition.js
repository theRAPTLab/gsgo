export const MODEL = {
  label: 'Decomposition',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
    bgcolor: 0x000066
  },
  scripts: [
    {
      id: 'Soil',
      label: 'Soil',
      script: `# BLUEPRINT Soil
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'lightbeam.json' 0
prop alpha setTo 0.2

addProp nutrients Number 50
prop nutrients setMax 100
prop nutrients setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Worm

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo nutrients

# PROGRAM UPDATE
`
    },
    {
      id: 'Sun',
      label: 'Sun',
      script: `# BLUEPRINT Sun
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'lightbeam.json' 0
prop agent.alpha setTo 0.3

useFeature Movement

useFeature Physics
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 8

addProp speed Number 1

# PROGRAM UPDATE
exprPush {{agent.x + agent.getProp('speed').value; }}
propPop x
ifExpr {{ agent.x > 400 }} [[
    prop x setTo -400
]]
`
    },
    {
      id: 'Rock',
      label: 'Rock',
      script: `# BLUEPRINT Rock
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'hive.json' 0

useFeature Physics
useFeature AgentWidgets
# PROGRAM UPDATE
`
    },
    {
      id: 'Worm',
      label: 'Worm',
      isControllable: true,
      script: `# BLUEPRINT Worm
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp matter Number 50
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Waste
featCall Touches monitorTouchesWith Soil

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo energyLevel
// Green = 0x00FF00
featProp AgentWidgets meterColor setTo 65280

# PROGRAM UPDATE
when Worm touches Waste [[
  every 1 runAtStart [[
    prop Worm.energyLevel add 10
    prop Worm.matter add 10
    prop Waste.matter sub 10
    featCall Worm.Costume setGlow 0.05
  ]]
]]
when Worm touches Soil [[
  every 1 runAtStart [[
    // if full energy, emit nutrients
    ifExpr {{ agent.getProp('energyLevel').value > 90 }} [[
      prop Worm.energyLevel sub 50
      prop Worm.matter sub 50
      featCall Worm.Costume setGlow 1
      prop Soil.nutrients add 50
      featCall Soil.Costume setGlow 0.1
    ]]
  ]]
]]
every 1 runAtStart [[
  // energy goes down
  prop energyLevel sub 1
]]
`
    },
    {
      id: 'Bunny',
      label: 'Bunny',
      isControllable: true,
      script: `# BLUEPRINT Bunny
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bunny.json' 0

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp matter Number 100
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Plant

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo energyLevel
// Green = 0x00FF00
featProp AgentWidgets meterColor setTo 65280

useFeature Population

# PROGRAM UPDATE
when Bunny touches Plant [[
  every 1 runAtStart [[
    prop Plant.matter sub 50
    prop Plant.energyLevel sub 50
    prop Bunny.matter add 50
    prop Bunny.energyLevel add 50
    featCall Bunny.Costume setGlow 0.1
  ]]
]]
every 1 runAtStart [[
  // if full energy, emit waste
  ifExpr {{ agent.getProp('energyLevel').value > 90 }} [[
    prop agent.energyLevel sub 50
    prop agent.matter sub 50
    featCall Population createAgent Waste [[
      prop x addRnd -20 20
      prop y addRnd 50 150
      featCall Costume setGlow 2
    ]]
    featCall agent.Costume setGlow 1
  ]]
]]
`
    },
    {
      id: 'Plant',
      label: 'Plant',
      script: `# BLUEPRINT Plant
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'flower.json' 0

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp matter Number 50
prop matter setMax 100
prop matter setMin 0

addProp label String 'Plant'

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Sun
featCall Touches monitorTouchesWith Soil
featCall Touches monitorTouchesWith Bunny

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo energyLevel
// Green = 0x00FF00
featProp AgentWidgets meterColor setTo 65280


# PROGRAM UPDATE
when Plant touches Sun [[
  every 1 runAtStart [[
    prop Plant.energyLevel add 1
    featCall Plant.Costume setGlow 0.05
  ]]
]]
when Plant touches Soil [[
  every 1 [[
    ifExpr {{ Soil.getProp('nutrients').value > 0 }} [[
      prop Plant.energyLevel add 1
      prop Plant.matter add 1
      prop Soil.nutrients sub 1
      featCall Plant.Costume setGlow 0.05
    ]]
  ]]
]]
every 1 runAtStart [[
  // remove if dead
  ifExpr {{ agent.getProp('matter').value < 1 }} [[
    // NEW remove
    // HACK just set size
    featProp Physics scale setTo 0.1
  ]]

  // set size based on matter
  exprPush {{ agent.getProp('matter').value / 50 }}
  featPropPop Physics scale

  // update matter label
  exprPush {{ 'matter: ' + agent.getProp('matter').value }}
  featPropPop AgentWidgets text
]]
`
    },
    {
      id: 'Waste',
      label: 'Organic Waste Ball',
      script: `# BLUEPRINT Waste
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'algae.json' 0

addProp matter Number 100
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Worm
featCall Touches monitorTouchesWith Soil

useFeature AgentWidgets
featCall AgentWidgets bindMeterTo matter

useFeature Population

# PROGRAM UPDATE
when Waste touches Soil [[
  every 1 [[
    // Bacteria decomposes waste
    prop Waste.matter sub 1
    prop Soil.nutrients add 1
  ]]
]]
every 1 runAtStart [[
  // remove if dead
  ifExpr {{ agent.getProp('matter').value < 1 }} [[
    // NEW remove
  ]]
]]
`
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Soil01',
      blueprint: 'Soil',
      initScript: `prop x setTo -200
    prop y setTo 0`
    },
    {
      id: 1102,
      name: 'Soil02',
      blueprint: 'Soil',
      initScript: `prop x setTo 200
    prop y setTo 0`
    },
    {
      id: 1110,
      name: 'Sun',
      blueprint: 'Sun',
      initScript: `prop x setTo -400
    prop y setTo 0`
    },
    {
      id: 1120,
      name: 'Rock01',
      blueprint: 'Rock',
      initScript: `prop x setTo 200
    prop y setTo -200`
    },
    {
      id: 1201,
      name: 'Plant01',
      blueprint: 'Plant',
      initScript: `prop x setTo -200
    prop y setTo -125`
    },
    {
      id: 1301,
      name: 'Bunny01',
      blueprint: 'Bunny',
      initScript: `prop x setTo 0
    prop y setTo -200`
    },
    {
      id: 1501,
      name: 'Worm01',
      blueprint: 'Worm',
      initScript: `prop x setTo 0
    prop y setTo 100`
    },
    {
      id: 1601,
      name: 'Waste01',
      blueprint: 'Waste',
      initScript: `prop x setTo -200
    prop y setTo 0`
    },
    {
      id: 1602,
      name: 'Waste02',
      blueprint: 'Waste',
      initScript: `prop x setTo 220
    prop y setTo 50`
    }
  ]
};
