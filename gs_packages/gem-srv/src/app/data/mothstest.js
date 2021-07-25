export const MODEL = {
    label: 'Moths Test Act B',
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
            noloop: true // DON'T stop after last round
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
                time: 1,
                intro: 'Try to pick up moths, and then find camouflage',
                initScript: ' ',
                outtro: 'Could you pick up a moth?  In next round, you will make them a distribution representation?',
                endScript: `
                `
            },
            {
                time: 500,
                intro: 'Move moth-squares into a color representation',
                initScript: `

                featCall Population agentsForEachActive Moth [[
                  featCall Costume setCostume 'square.json'
                  featProp Physics scale setTo 0.1
                  featCall Movement setMovementType 'static'
                  prop orientation setTo 3.14
                  featProp Movement useAutoOrientation setTo false
                  prop alpha setTo 1
                ]]

                featCall Population agentsForEachActive TreeTrunk [[
                  prop alpha setTo 0.05
                  prop isInert setTo true
                ]]

                `,
                outtro: 'Were you able to make a representation?',
                endScript: ` `
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

// allow removal by  Predator
// allow spawning
useFeature Population

// allow Predator to see us
useFeature Vision

addProp energyLevel Number 50
prop energyLevel setMax 100
prop energyLevel setMin 0

addProp colorTest Number 128
prop colorTest setMax 255
prop colorTest setMin -255
prop colorTest setTo 255

addProp vulnerable Number 1
prop vulnerable setMin 0
prop vulnerable setMax 1
prop vulnerable setTo 1

// allow access to global darkMoths/lightMoths values
useFeature Global

useFeature Cursor

# PROGRAM INIT


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
ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 1, 1, .35)}} [[
  dbgOut {{ Moth.name + " will be hidden " }}
  dbgOut {{  ( Moth.prop.color.value )  }}
]] [[
  dbgOut {{ Moth.name + " will be visible " }}
]]
dbgOut {{  ( (( Moth.prop.color.value ) % 256) - ((TreeTrunk.prop.color.value) % 256 )).toString(16) }}
exprPush {{  ( ( Moth.prop.color.value ) % 256) - ((TreeTrunk.prop.color.value) % 256 ) }}
propPop colorTest
featCall Moth.Costume setGlow 2
prop Moth.energyLevel add 50
prop vulnerable setTo 1
]]


when Moth centerTouches TreeTrunk [[
ifExpr {{ Moth.callFeatMethod('Costume', 'colorHSVWithinRange', Moth.prop.color.value, TreeTrunk.prop.color.value, 1, 1, .35)}} [[
  // color matches trunk, fade away and set un-visionable
  prop alpha setMin 0.1
  prop alpha sub 0.1
  featProp Vision visionable setTo false
  prop vulnerable setTo 0
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
          useFeature Population

          # PROGRAM INIT
          prop zIndex setTo -200

          # PROGRAM UPDATE
          every 1 [[
            featCall Population removeInertAgents
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
    instances: [{
            id: 1101,
            name: 'Tree1',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo -200
prop y setTo 170
featCall Costume setColorizeHSV 0 0 0.67
featProp Physics scale setTo 0.3
featProp Physics scaleY setTo 1.8`
        },

        {
            id: 1105,
            name: 'Tree3',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo 250
prop y setTo 170
featCall Costume setColorizeHSV 0 0 0.5
featProp Physics scale setTo 0.4
featProp Physics scaleY setTo 1.8`
        },

        {
            id: 1103,
            name: 'Tree2',
            blueprint: 'TreeTrunk',
            initScript: `prop x setTo 0
prop y setTo 170
featCall Costume setColorizeHSV 0 0 0.9
featProp Physics scale setTo 0.6
featProp Physics scaleY setTo 1.8`
        },
        {
            id: 1201,
            name: 'Moth1',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  200 -200
          `
        },
        {
            id: 1202,
            name: 'Moth2',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  150 -200
          `
        },
        {
            id: 1203,
            name: 'Moth3',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  100 -200
          `
        },
        {
            id: 1204,
            name: 'Moth4',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  50 -200
          `
        },
        {
            id: 1205,
            name: 'Moth5',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  0 -200
          `
        },
        {
            id: 1206,
            name: 'Moth6',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  -50 -200
          `
        },
        {
            id: 1207,
            name: 'Moth7',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  -100 -200
          `
        },
        {
            id: 1208,
            name: 'Moth8',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  -150 -200
          `
        },
        {
            id: 1209,
            name: 'Moth9',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition  -200 -200
          `
        },
        {
            id: 1210,
            name: 'Moth10',
            blueprint: 'Moth',
            initScript: `
          featCall Movement queuePosition -250 -200
          `
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
