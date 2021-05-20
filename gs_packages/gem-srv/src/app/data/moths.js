export const MODEL = {
  label: 'Moths',
  scripts: [
    {
      id: 'Moth',
      label: 'Moth',
      isControllable: true,
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0
featCall Costume setColorize 0 1 0
prop alpha setTo 1

useFeature Movement
useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Tree

// allow removal by  Predator
useFeature Population

# PROGRAM INIT
featCall Costume randomizeColor 0.1 0.3 0.1
featCall Movement setRandomStart

# PROGRAM UPDATE
prop alpha setTo 1
when Moth touches Tree [[
  prop alpha setTo 0.2
]]
`
    },
    {
      id: 'Predator',
      label: 'Predator',
      isControllable: true,
      script: `# BLUEPRINT Predator
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bunny.json' 0

useFeature Physics
useFeature Touches
featCall Touches monitorTouchesWith Moth

// needed for Seek
useFeature Movement

# PROGRAM UPDATE
when Predator touches Moth [[
  featCall Moth.Costume setGlow 1
  every 2 [[
    featCall Moth.Population removeAgent
  ]]
]]

`
    },
    {
      id: 'Tree',
      label: 'Tree',
      script: `# BLUEPRINT Tree
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'lightbeam.json' 0
featCall Costume setColorize 0 1 0

useFeature Physics

# PROGRAM INIT
prop zIndex setTo -200
`
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Tree1',
      blueprint: 'Tree',
      initScript: `prop x setTo -200
prop y setTo 0
featCall Costume setColorize 0 0.8 0
featProp Physics scale setTo 0.5
featProp Physics scaleY setTo 4`
    },
    {
      id: 1102,
      name: 'Tree2',
      blueprint: 'Tree',
      initScript: `prop x setTo 0
prop y setTo 0
featCall Costume setColorize 0.2 0.9 0
featProp Physics scale setTo 0.8
featProp Physics scaleY setTo 4`
    },
    {
      id: 1103,
      name: 'Tree3',
      blueprint: 'Tree',
      initScript: `prop x setTo 250
prop y setTo 0
featCall Costume setColorize 0 0.9 0.3
featProp Physics scale setTo 0.4
featProp Physics scaleY setTo 4`
    },
    {
      id: 1201,
      name: 'Moth1',
      blueprint: 'Moth',
      initScript: `prop x setTo 0
prop y setTo 0
prop alpha setTo 0.02`
    },
    {
      id: 1202,
      name: 'Moth2',
      blueprint: 'Moth',
      initScript: `prop x setTo 0
prop y setTo -100
prop alpha setTo 1`
    },
    {
      id: 1301,
      name: 'Predator1',
      blueprint: 'Predator',
      initScript: `prop x setTo 250
prop y setTo -100
featCall Movement seekNearestVisible Moth
featProp Movement distance setTo 1
prop alpha setTo 1`
    }
  ]
};
