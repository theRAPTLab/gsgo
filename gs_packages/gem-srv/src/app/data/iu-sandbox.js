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
      id: 'Person',
      label: 'Person',
      isControllable: true,
      script: `# BLUEPRINT Person
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'bunny.json' 1

useFeature Physics
useFeature Touches
featCall Physics init

featCall Physics setSize 90

# PROGRAM UPDATE
`
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Person 1',
      blueprint: 'Person',
      initScript: `prop x setTo -200
    prop y setTo 0
    `
    }
  ]
};
