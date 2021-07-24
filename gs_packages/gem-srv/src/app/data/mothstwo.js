export const MODEL = {
    label: 'Moths Act 2',
    bounds: {
        top: -400,
        right: 400,
        bottom: 400,
        left: -400,
        wrap: [false, false],
        bounce: true,
        bgcolor: 0x2222ee
    },
    rounds: {
        options: {
            allowResetStage: false,
            noloop: false // DON'T stop after last round
        },
        roundDefs: [
            //{
            //      time: 60,
            //      initScript: `dbgOut 'Round1!'`,
            //      intro: 'First generation - test',
            //      outtro: 'What happened?',
            //      endScript: `dbgOut 'END Round1!'`
            //  },
            {
                time: 60,
                intro: 'blablah',
                initScript: `
  // Release Cursors from Dead Moths
featCall Population releaseInertAgents
  // Remove Dead Moths
featCall Population hideInertAgents
  // Spawn New Moths
featCall Population agentsReproduce Moth [[
prop x addRnd -45 45
prop y addRnd -45 45
featProp Costume colorScaleIndex addRnd -2 2 true
]]
featCall Population agentsForEach TreeTrunk [[
featProp Costume colorValue setTo 1
featProp Costume colorValue subRnd 0.2
]]
`,
                outtro: 'What happened to spawn?',
                endScript: `dbgOut 'END Round2!'`
            }
        ]
    },
    scripts: [{
            id: 'Moth',
            label: 'Moth',
            //isCharControllable: true,
            //isPozyxControllable: true,
            script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

// COLOR
featCall Costume initHSVColorScale 0 0 0 'value' 10
featProp Costume colorScaleIndex setTo 5
featProp Costume colorScaleIndex addRnd -4 4 true


// Fully visible
prop alpha setTo 1
prop alpha setMin 1

useFeature Movement
featProp Movement useAutoOrientation setTo true
featProp Movement distance setTo 3
featCall Movement wanderUntilInside TreeTrunk

useFeature Physics
featProp Physics scale setTo 0.4

useFeature Touches
featCall Touches monitor TreeTrunk c2c c2b b2b binb
//featCall Touches monitor TreeFoliage c2c  c2b b2b binb

// allow removal by  Predator
// allow spawning
useFeature Population

// allow Predator to see us
useFeature Vision

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0


addProp Brightness Number 128
prop Brightness setMax 255
prop Brightness setMin 0
prop Brightness setTo 17

addProp colorTest Number 128
prop colorTest setMax 255
prop colorTest setMin 0
prop colorTest setTo 245


addProp vulnerable Number 1
prop vulnerable setMin 0
prop vulnerable setMax 1
prop vulnerable setTo 1


// allow access to global darkMoths/lightMoths values
useFeature Global

useFeature Cursor

# PROGRAM INIT
// Don't randomize here or we'll keep getting new colors
// Set randomize in # PROGRAM DEFINE
// featCall Costume randomizeColorHSV 0.1 0 0.2
// featCall Movement setRandomStart



# PROGRAM UPDATE
every 0.25 [[
prop energyLevel sub 2
]]

every 1 [[
ifExpr {{ !agent.prop.Vision.visionable.value }} [[
featCall Costume setGlow 0.05
]]
]]

when Moth centerFirstTouches TreeTrunk [[
dbgOut "!!!!"
featCall Moth.Costume setGlow 2
prop Moth.energyLevel add 50
prop vulnerable setTo 1
]]


when Moth centerTouches TreeTrunk [[
ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 1, 1, .5)}} [[
// color matches trunk, fade away and set un-visionable
//dbgOut {{  (Moth.prop.color.value % 256) + " >>Hidden: " + (TreeTrunk.prop.color.value % 256) }}
prop alpha setMin 0.1
prop alpha sub 0.1
featProp Vision visionable setTo false
prop vulnerable setTo 0
]]
]]



`
        },
        {
            id: 'Predator',
            label: 'Predator',
            isCharControllable: true,
            //isPozyxControllable: true,
            script: `# BLUEPRINT Predator
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0

useFeature Physics
useFeature Touches
featCall Touches monitor Moth c2c

// needed for Seek
useFeature Movement
//featProp Movement useAutoOrientation setTo true

useFeature Vision
//featCall Vision monitor Moth
//featCall Vision setViewDistance 500
//featCall Vision setViewAngle 45

//featCall Movement seekNearestVisible Moth
//featProp Movement distance setTo 4

featCall Movement setMovementType 'wander' 0.5

// To update graphs
useFeature Global

useFeature Cursor

// Allow Predator to stop round
useFeature Timer

# PROGRAM UPDATE

//when Predator sees Moth [[
//prop Moth.alpha setMin 1
//featCall Moth.Costume setGlow 0.1
//]]

when Predator centerTouchesCenter Moth [[
ifExpr {{ Moth.prop.vulnerable.value > 0 }} [[
featCall Moth.Costume setGlow 1
featCall Moth.Movement jitterRotate
//  every 1 [[
featCall Moth.Population removeAgent
featCall Predator.Costume setGlow 1
dbgOut {{ (Moth.prop.color.value % 256)  /  255}}
ifExpr {{ (Moth.prop.color.value % 256)  /  255 < 0.5 }} [[
  dbgOut 'Eaten...dark!'
  featCall Global globalProp lightMoths sub 0
  featCall Global globalProp darkMoths sub 1
  featCall Global globalProp totalMoths sub 1
]] [[
  dbgOut 'Eaten...light!'
  featCall Global globalProp lightMoths sub 1
  featCall Global globalProp darkMoths sub 0
  featCall Global globalProp totalMoths sub 1
]]
// release cursor
featCall Moth.Cursor releaseCursor
//]]

  ]]

]]
`
        },
        {
            id: 'TreeTrunk',
            label: 'TreeTrunk',
            script: `# BLUEPRINT TreeTrunk
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'square.json' 0

useFeature Physics

# PROGRAM INIT
prop zIndex setTo -200
featProp Costume colorValue setTo 1

# PROGRAM UPDATE
//every 1 [[
//featProp Costume colorValue sub 0.01
//]]

`
        },
        //         {
        //             id: 'TreeFoliage',
        //             label: 'TreeFoliage',
        //             script: `# BLUEPRINT TreeFoliage
        // # PROGRAM DEFINE
        // useFeature Costume
        // featCall Costume setCostume 'circle.json' 0
        // featCall Costume setColorize 0 0.1 0.9

        // useFeature Physics
        // // useFeature AgentWidgets

        // # PROGRAM INIT
        // prop zIndex setTo -400
        // `
        //         },
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
    instances: [{
            id: 1101,
            name: 'Tree1',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo -200
prop y setTo 200
featCall Costume setColorizeHSV 0.3 0 0.9
featProp Physics scale setTo 0.3
featProp Physics scaleY setTo 2`
        },
        //         {
        //             id: 1102,
        //             name: 'TreeFoliage1',
        //             blueprint: 'TreeFoliage',
        //             initScript: `prop x setTo -200
        // prop y setTo -150
        // featCall Costume setColorize 0.1 0.7 0.0
        // featProp Physics scale setTo 2
        // featProp Physics scaleY setTo 1.5`
        //         },
        {
            id: 1105,
            name: 'Tree3',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo 250
prop y setTo 200
featCall Costume setColorizeHSV 0 0 0.8
featProp Physics scale setTo 0.4
featProp Physics scaleY setTo 2`
        },
        //         {
        //             id: 1106,
        //             name: 'TreeFoliage3',
        //             blueprint: 'TreeFoliage',
        //             initScript: `prop x setTo 250
        // prop y setTo -150
        // featCall Costume setColorize 0.0 0.6 0.0
        // //  featCall Costume setColorize 0.8 0.7 0
        // featProp Physics scale setTo 1.2
        // featProp Physics scaleY setTo 2`
        //         },
        {
            id: 1103,
            name: 'Tree2',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo 0
prop y setTo 200
featCall Costume setColorizeHSV 0 0 1
featProp Physics scale setTo 0.6
featProp Physics scaleY setTo 2`
        },
        //         {
        //             id: 1104,
        //             name: 'TreeFoliage2',
        //             blueprint: 'TreeFoliage',
        //             initScript: `prop x setTo 0
        // prop y setTo -150
        // featCall Costume setColorize 0.2 0.8 0.2
        // featProp Physics scale setTo 1.5
        // featProp Physics scaleY setTo 2
        // `
        //         },
        {
            id: 1301,
            name: 'Predator1',
            blueprint: 'Predator',
            initScript: `prop x setTo 250
prop y setTo -100`
        },
        {
            id: 1302,
            name: 'Predator2',
            blueprint: 'Predator',
            initScript: `prop x setTo -250
prop y setTo -100`
        },

        {
            id: 1201,
            name: 'Moth1',
            blueprint: 'Moth',
            initScript: `//prop x setTo 0
//    prop y setTo -400
featCall Movement queuePosition 100 0
prop alpha setTo 0.02`
        },
        {
            id: 1202,
            name: 'Moth2',
            blueprint: 'Moth',
            initScript: `
prop alpha setTo 1`
        },
        {
            id: 1203,
            name: 'Moth3',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -50 200
prop energyLevel setTo 90`
        },
        {
            id: 1204,
            name: 'Moth4',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -50 70
prop energyLevel setTo 90`
        },
        {
            id: 1205,
            name: 'Moth5',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -350 -150
prop energyLevel setTo 90`
        },
        {
            id: 1206,
            name: 'Moth6',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 200 140
prop energyLevel setTo 90`
        },
        {
            id: 1207,
            name: 'Moth7',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 50 250
prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1208,
            name: 'Moth8',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 50 100
prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1209,
            name: 'Moth9',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -200 200
prop alpha setTo 1
prop energyLevel setTo 90`
        },

        {
            id: 1210,
            name: 'Moth10',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 350 -250
prop alpha setTo 1
prop energyLevel setTo 90`
        },

        {
            id: 1211,
            name: 'Moth11',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 250 -350
        prop alpha setTo 1
    prop energyLevel setTo 90`
        },
        {
            id: 1212,
            name: 'Moth12',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -150 -350
        prop alpha setTo 1
    prop energyLevel setTo 90`
        },
        {
            id: 1213,
            name: 'Moth13',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 50 -300
        featCall Costume randomizeColorHSV
        prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1214,
            name: 'Moth14',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -350 -170
prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1215,
            name: 'Moth15',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -250 -250
        prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1216,
            name: 'Moth16',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 20 340
        prop alpha setTo 1
prop energyLevel setTo 90`
        },
        {
            id: 1217,
            name: 'Moth17',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition -370 150
prop energyLevel setTo 90`
        },
        {
            id: 1218,
            name: 'Moth18',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 350 -200
prop energyLevel setTo 90`
        },
        {
            id: 1219,
            name: 'Moth19',
            blueprint: 'Moth',
            initScript: `featCall Movement queuePosition 100 200
prop energyLevel setTo 90`
        },
        {
            id: 1401,
            name: 'Dark Moths',
            blueprint: 'Reporter',
            initScript: `prop x setTo 460
prop y setTo 300
featCall Global addGlobalProp darkMoths Number 20
featCall Global globalProp darkMoths setMin 0
featCall Global globalProp darkMoths setMax 50
featCall AgentWidgets bindGraphToGlobalProp darkMoths 50
`
        },
        {
            id: 1402,
            name: 'Light Moths',
            blueprint: 'Reporter',
            initScript: `prop x setTo 460
prop y setTo 100
featCall Global addGlobalProp lightMoths Number 10
featCall Global globalProp lightMoths setMin 0
featCall Global globalProp lightMoths setMax 50
featCall AgentWidgets bindGraphToGlobalProp lightMoths 50
`
        },

        {
            id: 1403,
            name: 'Total Moths',
            blueprint: 'Reporter',
            initScript: `prop x setTo 460
prop y setTo -200
featCall Global addGlobalProp totalMoths Number 30
featCall Global globalProp totalMoths setMin 0
featCall Global globalProp totalMoths setMax Infinity
featCall AgentWidgets bindGraphToGlobalProp totalMoths 50
`
        }
    ]
};
