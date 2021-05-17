export const MODEL = {
  label: 'IU Sandbox',
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
      id: 'GPerson',
      label: 'Green Person',
      isControllable: true,
      script: `# BLUEPRINT GPerson
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bunny.json' 2

useFeature Physics
featCall Physics init

featProp Physics scale setTo 2

# PROGRAM UPDATE
`
    },
    {
      id: 'BPerson',
      label: 'Blue Person',
      isControllable: true,
      script: `# BLUEPRINT BPerson
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bunny.json' 3

useFeature Physics
featCall Physics init

featProp Physics scale setTo 2

# PROGRAM UPDATE
`
    },
    {
      id: 'OfficeStuff',
      label: 'OfficeStuff',
      isControllable: false,
      script: `# BLUEPRINT OfficeStuff
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'rectangle.json' 0

useFeature Physics
featCall Physics init

# PROGRAM UPDATE
`
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Green Person 1',
      blueprint: 'GPerson',
      initScript: `prop x setTo -200
    prop y setTo 0
    `
    },
    {
      id: 1102,
      name: 'Blue Person 1',
      blueprint: 'BPerson',
      initScript: `prop x setTo 200
    prop y setTo 0
    `
    },
    {
      id: 1103,
      name: 'Furniture',
      blueprint: 'OfficeStuff',
      initScript: `prop x setTo 348
    prop y setTo 83
    prop zIndex setTo -100
    featProp Physics scale setTo 0.4
    featProp Physics scaleY setTo 2.5
    `
    },
    {
      id: 1104,
      name: 'Furniture',
      blueprint: 'OfficeStuff',
      initScript: `prop x setTo -348
    prop y setTo 83
    prop zIndex setTo -100
    featProp Physics scale setTo 0.4
    featProp Physics scaleY setTo 2.5
    `
    },
    {
      id: 1105,
      name: 'Blue Person 2',
      blueprint: 'BPerson',
      initScript: `prop x setTo 210
    prop y setTo 119
    `
    },
    {
      id: 1106,
      name: 'Blue Person 3',
      blueprint: 'BPerson',
      initScript: `prop x setTo 230
    prop y setTo 234
    `
    },
    {
      id: 1107,
      name: 'Blue Person 4',
      blueprint: 'BPerson',
      initScript: `prop x setTo 220
    prop y setTo 322
    `
    }
  ]
};
