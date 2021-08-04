export const MODEL = {
  label: 'Decomposition',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true,
    bgcolor: 0x98f5ff
  },
  rounds: {
    options: {
      allowResetStage: true,
      noloop: false // loop because why not
    }
  },
  scripts: [
    {
      id: 'Soil',
      label: 'Soil',
      script: `# BLUEPRINT Soil
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'square.json' 0
featCall Costume setColorize 200 192 176

addProp nutrients Number 50
prop nutrients setMax 100
prop nutrients setMin 0

useFeature Physics

featCall Physics setSize 200 200

prop zIndex setTo -100

useFeature Touches
featCall Touches monitor Worm b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below)
featCall AgentWidgets bindMeterTo nutrients
// violet
featProp AgentWidgets meterColor setTo 9055202
featProp AgentWidgets text setTo ''
`
    },
    {
      id: 'Sunbeam',
      label: 'Sunbeam',
      script: `# BLUEPRINT Sunbeam
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'circle.json' 0
featCall Costume setColorize 1 1 0
prop agent.alpha setTo 0.3
//prop zIndex setTo 100

// STUDENTS_MAY_CHANGE - to set the speed of the sunbeam
addProp speed Number 20
// STUDENTS_MAY_CHANGE - to set the amount of energy the sunbeam gives to algae
addProp energyRate Number 5
// STUDENTS_MAY_CHANGE - to set which direction the sunbeam moves (right: 1, left: -1)
addProp direction Number 1

useFeature Physics
featCall Physics init
// STUDENTS_MAY_CHANGE - how wide the sunbeam is
featProp Physics scale setTo 0.4
// STUDENTS_MAY_CHANGE - how tall the sunbeam is
featProp Physics scaleY setTo 2.5

useFeature Touches

# PROGRAM INIT
// default position for moving across the top
prop x setTo -400
prop y setTo -180

# PROGRAM EVENT
onEvent Tick [[
  exprPush {{agent.x + agent.getProp('direction').value * (agent.getProp('speed').value); }}
  propPop x

  ifExpr {{ ((agent.getProp('direction').value == 1) && (agent.x > 400)) || ((agent.getProp('direction').value == -1) && (agent.x < -400))}} [[
      exprPush {{400 * agent.getProp('direction').value * -1}}
      propPop x
  ]]
]]
`
    },
    {
      id: 'Rock',
      label: 'Rock',
      script: `# BLUEPRINT Rock
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'boulder.json' 0

useFeature Physics
useFeature AgentWidgets
# PROGRAM UPDATE
`
    },
    {
      id: 'Worm',
      label: 'Worm',
      isCharControllable: true,
      isPozyxControllable: true,
      script: `# BLUEPRINT Worm
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'worm.json' 2

useFeature Movement
featProp Movement useAutoOrientation setTo true

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp matter Number 50
prop matter setMax 100
prop matter setMin 0

useFeature Physics
featProp Physics scale setTo 0.5

useFeature Touches
featCall Touches monitor Waste b2b
featCall Touches monitor Soil b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below)
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
    // note they eemit nutrients if they are in a spot where they are eating ... we might want a delay?
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
      isCharControllable: true,
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
featCall Touches monitor Plant b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below)
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
    featCall Population populateBySpawning Waste [[
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
featCall Costume setCostume 'plant.json' 0

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp nutrients Number 8
prop nutrients setMax 10
prop nutrients setMin 0

addProp matter Number 50
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitor Sunbeam b2b
featCall Touches monitor Soil b2b
featCall Touches monitor Bunny b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below)
featCall AgentWidgets bindMeterTo energyLevel
// Green
featProp AgentWidgets meterColor setTo 65280

featProp AgentWidgets text setTo ''

# PROGRAM UPDATE
when Plant touches Sunbeam [[
  every 1 runAtStart [[
    prop Plant.energyLevel add 1
    prop Plant.matter add 1
    featCall Plant.Costume setGlow 0.05
  ]]
]]
when Plant touches Soil [[
  every 1 [[
    ifExpr {{ Soil.getProp('nutrients').value > 0 }} [[
      prop Soil.nutrients sub 1
      prop Plant.nutrients add 1
      featCall Plant.Costume setGlow 0.05
    ]]
  ]]
]]
every 1 runAtStart [[
  // remove if dead
  ifExpr {{ agent.getProp('matter').value < 1 }} [[
    featCall Population removeAgent
  ]]

  // set size based on matter
  exprPush {{ agent.getProp('matter').value / 50 }}
  featPropPop Physics scale

  // is it healthy?  Use some nutrients and then set color
  prop nutrients sub 1
  ifExpr {{ agent.getProp('nutrients').value > 6 }} [[
    // healthy
    featCall Costume setColorize 0 255 0
  ]]
  ifExpr {{ agent.getProp('nutrients').value < 6 }} [[
    // ok, but not great
    featCall Costume setColorize 255 255 0
  ]]
  ifExpr {{ agent.getProp('nutrients').value < 2 }} [[
    // not doing well at all, so lets also lose some matter
    featCall Costume setColorize 165 42 42
    prop matter sub 1
  ]]
]]
`
    },
    {
      id: 'Waste',
      label: 'Organic Waste Ball',
      script: `# BLUEPRINT Waste
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'organic_matter.json' 0

addProp matter Number 100
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitor Worm b2b
featCall Touches monitor Soil b2b

prop zIndex setTo -100

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
    featCall Population removeAgent
  ]]

  // should be in an else - wasn't sure how
  // scale based on amount of matter
    exprPush {{ (agent.getProp('matter').value / 100)}}
    featPropPop agent.Physics scale

]]
`
    },
    {
      id: 'TextLabel',
      label: 'TextLabel',
      script: `# BLUEPRINT TextLabel
      # PROGRAM DEFINE
      useFeature AgentWidgets
      prop skin setTo 'onexone'
`
    },
    {
      id: 'ColorChip',
      label: 'ColorChip',
      script: `# BLUEPRINT ColorChip
      # PROGRAM DEFINE
      useFeature Costume
      featCall Costume setCostume 'square.json' 0

      useFeature Physics`
    },
    {
      id: 'Timer',
      label: 'Timer',
      script: `# BLUEPRINT Timer
      # PROGRAM DEFINE
      useFeature AgentWidgets
      prop skin setTo 'onexone'
      addProp time Number 0

      featProp AgentWidgets text setTo 'Time: 0'

      # PROGRAM INIT

      prop x setTo 445
      prop y setTo -256

      # PROGRAM EVENT
      onEvent Tick [[
        prop time add 1
        exprPush {{ 'Time: ' + agent.getProp('time').value }}
        featPropPop AgentWidgets text
      ]]
`
    },
    {
      id: 'Reporter',
      label: 'Reporter',
      script: `# BLUEPRINT Reporter
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            useFeature Population
            useFeature Global
            useFeature AgentWidgets
            featProp AgentWidgets isLargeGraphic setTo true
          `
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Soil01',
      blueprint: 'Soil',
      initScript: `prop x setTo -300
    prop y setTo 100
    prop nutrients setTo 10`
    },
    {
      id: 1102,
      name: 'Soil02',
      blueprint: 'Soil',
      initScript: `prop x setTo -100
    prop y setTo 100`
    },
    {
      id: 1103,
      name: 'Soil03',
      blueprint: 'Soil',
      initScript: `prop x setTo 100
    prop y setTo 100`
    },
    {
      id: 1104,
      name: 'Soil04',
      blueprint: 'Soil',
      initScript: `prop x setTo 300
    prop y setTo 100`
    },
    {
      id: 1105,
      name: 'Soil05',
      blueprint: 'Soil',
      initScript: `prop x setTo -300
    prop y setTo 300`
    },
    {
      id: 1106,
      name: 'Soil06',
      blueprint: 'Soil',
      initScript: `prop x setTo -100
    prop y setTo 300`
    },
    {
      id: 1107,
      name: 'Soil07',
      blueprint: 'Soil',
      initScript: `prop x setTo 100
    prop y setTo 300`
    },
    {
      id: 1108,
      name: 'Soil08',
      blueprint: 'Soil',
      initScript: `prop x setTo 300
    prop y setTo 300`
    },
    {
      id: 1110,
      name: 'Sunbeam',
      blueprint: 'Sunbeam',
      initScript: `prop x setTo -400
    prop y setTo -200`
    },
    /* {
      id: 1120,
      name: 'Rock01',
      blueprint: 'Rock',
      initScript: `prop x setTo 200
    prop y setTo -200`
    }, */
    {
      id: 1201,
      name: 'Plant01',
      blueprint: 'Plant',
      initScript: `prop x setTo -300
    prop y setTo -76`
    },
    /*  {
      id: 1301,
      name: 'Bunny01',
      blueprint: 'Bunny',
      initScript: `prop x setTo 0
    prop y setTo -200`
    }, */
    /* {
      id: 1501,
      name: 'Worm01',
      blueprint: 'Worm',
      initScript: `prop x setTo 0
    prop y setTo 100`
    }, */
    {
      id: 1601,
      name: 'Waste01',
      blueprint: 'Waste',
      initScript: `prop x setTo -100
    prop y setTo 100`
    },
    {
      id: 1602,
      name: 'Waste02',
      blueprint: 'Waste',
      initScript: `prop x setTo 220
    prop y setTo 50`
    },
    {
      id: 1700,
      name: 'LegendLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 450
    prop y setTo -400
    featProp AgentWidgets text setTo 'Key:'
    `
    },
    {
      id: 1701,
      name: 'EnergyLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 450
    prop y setTo -370
    featProp AgentWidgets text setTo 'Energy'
    `
    },
    {
      id: 1702,
      name: 'NutrientsLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 450
    prop y setTo -340
    featProp AgentWidgets text setTo 'Nutrients'
    `
    },
    {
      id: 1703,
      name: 'EnergyChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 445.5
    prop y setTo -351
    featCall Costume setColorize 0 255 0
    prop zIndex setTo 100
    featCall Physics setSize 90 35
    `
    },
    {
      id: 1704,
      name: 'NutrientsChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 445.5
    prop y setTo -320
    featCall Costume setColorize 138 43 226
    prop zIndex setTo 100
    featCall Physics setSize 90 35
    `
    } /*,
    {
      id: 1800,
      name: 'Energy',
      blueprint: 'Reporter',
      initScript: `prop x setTo 460
prop y setTo 300
featCall Global addGlobalProp totalEnergy Number 20
featCall Global globalProp totalEnergy setMin 0
featCall Global globalProp totalEnergy setMax 50
featCall AgentWidgets bindGraphToGlobalProp totalEnergy 50
`
    }*/
  ]
};
