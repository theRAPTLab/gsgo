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
featCall AgentWidgets setMeterPosition 'inside-left'
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
featProp Physics scaleY setTo 2

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
ifExpr {{ agent.prop.Movement.compassDirection.value === 'E' }} [[
  featProp Costume flipY setTo false
]]
ifExpr {{ agent.prop.Movement.compassDirection.value === 'W' }} [[
  featProp Costume flipY setTo true
]]

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

useFeature Population
useFeature Global
useFeature Costume

featCall Costume setCostume 'bunny.json' 0

// set bunny energy
addProp energyLevel Number 25
prop energyLevel setMax 50
prop energyLevel setMin 0

addProp matter Number 50

prop matter setMax 50
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitor Plant b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below) [NOT_WORKING]
featCall AgentWidgets bindMeterTo energyLevel
// Green = 0x00FF00
featProp AgentWidgets meterColor setTo 65280


# PROGRAM UPDATE

when Bunny touches Plant [[
  every 1 runAtStart [[
    // STUDENTS_MAY_CHANGE - switching these numbers models different speeds of how bunnies eat the plants [NOT_WORKING]
    // Plant matter goes down as it is eaten, as does Plant energy
    prop Plant.matter sub 10
    prop Plant.energyLevel sub 10
    // Bunny matter and energy go up from eating
    prop Bunny.matter add 10
    prop Bunny.energyLevel add 10
    featCall Bunny.Costume setGlow 0.1
  ]]
]]
every 1 runAtStart [[
  // if full energy, emit waste
  ifExpr {{ agent.getProp('energyLevel').value > 45 }} [[
    // STUDENTS_MAY_CHANGE - switching these numbers will change how bunnies produce waste [WORKS]
    prop energyLevel sub 20
    prop matter sub 20
    featCall Population createAgent Waste [[
      // STUDENTS_MAY_CHANGE - switching these numbers changes where the waste appears and how much matter it starts with [NOT_WORKING]
      prop x addRnd -20 20
      prop y addRnd 50 150
      prop matter setTo 20
    ]]
    featCall agent.Costume setGlow 1
  ]]

  // use some energy from just livin / running around
  prop energyLevel sub 1
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
useFeature Global
useFeature Population

addProp energyLevel Number 50

// STUDENTS_MAY_CHANGE - set a different starting eneregy level, max or min (or make it random) [WORKS]
prop energyLevel setTo 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp nutrients Number 8

// STUDENTS_MAY_CHANGE - sete a different starting eneregy level, max or min?  A higher max will allow a lot more time before the plant looks bad [WORKS]
prop nutrients setTo 8
prop nutrients setMax 10
prop nutrients setMin 0

addProp matter Number 50

// STUDENTS_MAY_CHANGE - sete a different range or starting point of matter [WORKS]
prop matter setTo 50
prop matter setMax 100
prop matter setMin 0

useFeature Physics
useFeature Touches
featCall Touches monitor Sunbeam b2b
featCall Touches monitor Soil b2b
featCall Touches monitor Bunny b2b

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter (note, color won't change below) [WORKS]
featProp AgentWidgets meterProp setTo energyLevel
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
  ifExpr {{ agent.getProp('matter').value < 10 }} [[
    // then remove the plant
    featCall Population removeAgent
  ]]

  // set size based on matter
  exprPush {{ 0.7 + (0.3 * (agent.getProp('matter').value / 50)) }}
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
      label: 'Organic Waste',
      script: `# BLUEPRINT Waste
# PROGRAM DEFINE
useFeature Population

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

useFeature AgentWidgets
// STUDENTS_MAY_CHANGE - to pick a different thing to display on the meter
featProp AgentWidgets meterProp setTo matter

featProp AgentWidgets meterColor setTo 5783616
featProp AgentWidgets text setTo ''


# PROGRAM UPDATE
when Waste touches Soil [[
  // STUDENTS_MAY_CHANGE - change the numbers to seee the impact of bacteria, including making the numberes 0 if you want (no bacteria) [NOT_WORKING]
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

      # PROGRAM UPDATE
      every 1 runAtStart [[
        prop time add 1
        exprPush {{ 'Time: ' + agent.getProp('time').value }}
        featPropPop AgentWidgets text
      ]]
`
    },
    {
      id: 'PlantGraph',
      label: 'PlantGraph',
      script: `# BLUEPRINT PlantGraph
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            useFeature Population
            useFeature Global
            useFeature AgentWidgets
            featProp AgentWidgets isLargeGraphic setTo true

            // using a generic name so that it is easier to change later
            addProp graphValue Number 0
            prop graphValue setMax 1000
            prop graphValue setMin 0

            // STUDENTS_MAY_CHANGE to set the starting value and adjust the graph scale
            prop graphValue setTo 0

            featCall AgentWidgets bindGraphTo graphValue 30

            // STUDENTS_MAY_CHANGE - this is the graph name - change the actual contents below in the program event [WORKS]
            featProp AgentWidgets text setTo 'Plant Energy'

            # PROGRAM UPDATE
            every 1 runAtStart [[
              // STUDENTS_MAY_CHANGE - change the variable name to get a different count [NOT_WORKING]
              featCall Population countAgentProp 'Plant' 'energyLevel'

              exprPush {{ agent.getFeatProp('Population', 'sum').value  }}
              propPop graphValue
            ]]
            `
    },
    {
      id: 'BunnyGraph',
      label: 'BunnyGraph',
      script: `# BLUEPRINT BunnyGraph
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            useFeature AgentWidgets
            useFeature Population
            featProp AgentWidgets isLargeGraphic setTo true

            // using a generic name so that it is easier to change later
            addProp graphValue Number 0
            prop graphValue setMax 1000
            prop graphValue setMin 0

            // STUDENTS_MAY_CHANGE to set the starting value and adjust the graph scale
            prop graphValue setTo 0

           featCall AgentWidgets bindGraphTo graphValue 30

           // STUDENTS_MAY_CHANGE - this is the graph name - change the actual contents below in the program event [WORKS]
           featProp AgentWidgets text setTo 'Bunny Energy'

            # PROGRAM EVENT

            onEvent Tick [[
              // STUDENTS_MAY_CHANGE - change the variable name to get a different count [NOT_WORKING]
              featCall Population countAgentProp 'Bunny' 'energyLevel'

              exprPush {{ agent.getFeatProp('Population', 'sum').value }}
              propPop graphValue
            ]]

            `
    },
    {
      id: 'WormGraph',
      label: 'WormGraph',
      script: `# BLUEPRINT WormGraph
            # PROGRAM DEFINE
            prop skin setTo 'onexone'

            useFeature AgentWidgets
            useFeature Population
            featProp AgentWidgets isLargeGraphic setTo true

            // using a generic name so that it is easier to change later
            addProp graphValue Number 0
            prop graphValue setMax 1000
            prop graphValue setMin 0

           featCall AgentWidgets bindGraphTo graphValue 30

           // STUDENTS_MAY_CHANGE - this is the graph name - change the actual contents below in the program event [WORKS]
           featProp AgentWidgets text setTo 'Worm Energy'

            # PROGRAM EVENT

            onEvent Tick [[
              // STUDENTS_MAY_CHANGE - change the variable name to get a different count [NOT_WORKING]
              featCall Population countAgentProp 'Worm' 'energyLevel'

              exprPush {{ agent.getFeatProp('Population', 'sum').value }}
              propPop graphValue
            ]]

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
    prop y setTo -240`
    },
    /* {
      id: 1120,
      name: 'Rock01',
      blueprint: 'Rock',
      initScript: `prop x setTo 200
    prop y setTo -200`
    }, */
    {
      id: 1801,
      name: 'Plant Energy',
      blueprint: 'PlantGraph',
      initScript: `prop x setTo 470
prop y setTo 370
`
    },
    {
      id: 1802,
      name: 'Bunny Energy',
      blueprint: 'BunnyGraph',
      initScript: `prop x setTo 470
prop y setTo 230
`
    },
    {
      id: 1803,
      name: 'Worm Energy',
      blueprint: 'WormGraph',
      initScript: `prop x setTo 470
prop y setTo 90
`
    },
    {
      id: 1201,
      name: 'Plant01',
      blueprint: 'Plant',
      initScript: `prop x setTo -300
    prop y setTo -76`
    },
    {
      id: 1301,
      name: 'Bunny01',
      blueprint: 'Bunny',
      initScript: `prop x setTo 0
    prop y setTo -20`
    },
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
      initScript: `prop x setTo 455
    prop y setTo -400
    featProp AgentWidgets text setTo 'Key:'
    `
    },
    {
      id: 1701,
      name: 'EnergyLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -373
    featProp AgentWidgets text setTo 'Energy'
    `
    },
    {
      id: 1702,
      name: 'NutrientsLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -340
    featProp AgentWidgets text setTo 'Nutrients'
    `
    },
    {
      id: 1703,
      name: 'MatterLabel',
      blueprint: 'TextLabel',
      initScript: `prop x setTo 455
    prop y setTo -308
    featProp AgentWidgets text setTo 'Matter'
    `
    },
    {
      id: 1704,
      name: 'EnergyChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -351
    featCall Costume setColorize 0 255 0
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    },
    {
      id: 1705,
      name: 'NutrientsChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -320
    featCall Costume setColorize 138 43 226
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    },
    {
      id: 1706,
      name: 'MatterChip',
      blueprint: 'ColorChip',
      initScript: `prop x setTo 455
    prop y setTo -290
    featCall Costume setColorize 0.56 0.52 0.40
    prop zIndex setTo 95
    featCall Physics setSize 100 30
    `
    }
  ]
};
