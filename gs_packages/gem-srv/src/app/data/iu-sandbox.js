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
    }
  ],
  instances: [
    {
      id: 1101,
      name: 'Soil01',
      blueprint: 'Soil',
      initScript: `prop x setTo -200
    prop y setTo 0`
    }
  ]
};
