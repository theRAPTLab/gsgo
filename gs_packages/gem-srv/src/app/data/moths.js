export const MODEL = {
  label: 'Moths',
  scripts: [
    {
      id: 'Moth',
      label: 'Moth',
      script: `# BLUEPRINT Moth
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bee.json' 0
featCall Costume setColorize 0 1 0
prop alpha setTo 1

useFeature Physics
featProp Physics scale setTo 1

useFeature Movement

# PROGRAM INIT
featCall Costume randomizeColor 0.1 0.3 0.1
featCall Movement setRandomStart

# PROGRAM UPDATE
`
    },
    {
      id: 'Predator',
      label: 'Predator',
      script: `# BLUEPRINT Predator
# PROGRAM CONDITION
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
    }
  ]
};
