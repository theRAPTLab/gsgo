export const MODEL = {
  label: 'Decomposition',
  bounds: {
    top: -400,
    right: 400,
    bottom: 400,
    left: -400,
    wrap: [false, false],
    bounce: true
  },
  scripts: [
    {
      id: 'Worm',
      label: 'Worm',
      script: `# BLUEPRINT Worm

# PROGRAM DEFINE

# PROGRAM EVENT

# PROGRAM UPDATE
`
    }
  ],
  instances: [
    {
      id: 501,
      name: 'Worm01',
      blueprint: 'Worm',
      initScript: `prop x setTo 0
    prop y setTo 0`
    }
  ]
};
