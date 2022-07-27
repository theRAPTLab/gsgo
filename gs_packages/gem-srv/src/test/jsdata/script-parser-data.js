/** format of these tests:
 *  'text': is literal scripttext
 *  'expect': is an array of scriptunits, which are themselves arrays
 */
const TESTS = {
  'inline-block': {
    text: `
    K [[ NAME ]] [[
      A
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'K'
        },
        {
          'program': 'NAME'
        },
        {
          'block': [
            [
              {
                'identifier': 'A'
              }
            ]
          ]
        }
      ]
    ]
  },
  'multiLine': {
    text: `
    K A B C
    if [[
      D
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'K'
        },
        {
          'identifier': 'A'
        },
        {
          'identifier': 'B'
        },
        {
          'identifier': 'C'
        }
      ],
      [
        {
          'identifier': 'if'
        },
        {
          'block': [
            [
              {
                'identifier': 'D'
              }
            ]
          ]
        }
      ]
    ]
  },
  'block': {
    text: `
    [[
      K A B C
      K D E F
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'block': [
            [
              {
                'identifier': 'K'
              },
              {
                'identifier': 'A'
              },
              {
                'identifier': 'B'
              },
              {
                'identifier': 'C'
              }
            ],
            [
              {
                'identifier': 'K'
              },
              {
                'identifier': 'D'
              },
              {
                'identifier': 'E'
              },
              {
                'identifier': 'F'
              }
            ]
          ]
        }
      ]
    ]
  },
  'if-then': {
    text: `
    if [[
      X
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'if'
        },
        {
          'block': [
            [
              {
                'identifier': 'X'
              }
            ]
          ]
        }
      ]
    ]
  },
  // test:
  'if-then-else': {
    text: `
    if [[
      Y
    ]] [[
      Z
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'if'
        },
        {
          'block': [
            [
              {
                'identifier': 'Y'
              }
            ]
          ]
        },
        {
          'block': [
            [
              {
                'identifier': 'Z'
              }
            ]
          ]
        }
      ]
    ]
  },
  // test:
  'when[[if-then]]': {
    text: `
    when [[
      if [[
        A
      ]]
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'when'
        },
        {
          'block': [
            [
              {
                'identifier': 'if'
              },
              {
                'block': [
                  [
                    {
                      'identifier': 'A'
                    }
                  ]
                ]
              }
            ]
          ]
        }
      ]
    ]
  },
  // test:
  'when[[if-then-else]]': {
    text: `
    when [[
      if [[
        B
      ]] [[
        C
      ]]
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'when'
        },
        {
          'block': [
            [
              {
                'identifier': 'if'
              },
              {
                'block': [
                  [
                    {
                      'identifier': 'B'
                    }
                  ]
                ]
              },
              {
                'block': [
                  [
                    {
                      'identifier': 'C'
                    }
                  ]
                ]
              }
            ]
          ]
        }
      ]
    ]
  },
  'bee-when-ifexpr': {
    text: `
    when Bee touches Bee [[
      ifExpr {{ true }} [[
        dbgOut 'true'
      ]] [[
        dbgOut 'false'
      ]]
    ]]`,
    expect: [
      [
        {
          'line': ''
        }
      ],
      [
        {
          'identifier': 'when'
        },
        {
          'identifier': 'Bee'
        },
        {
          'identifier': 'touches'
        },
        {
          'identifier': 'Bee'
        },
        {
          'block': [
            [
              {
                'identifier': 'ifExpr'
              },
              {
                'expr': 'true'
              },
              {
                'block': [
                  [
                    {
                      'identifier': 'dbgOut'
                    },
                    {
                      'string': 'true'
                    }
                  ]
                ]
              },
              {
                'block': [
                  [
                    {
                      'identifier': 'dbgOut'
                    },
                    {
                      'string': 'false'
                    }
                  ]
                ]
              }
            ]
          ]
        }
      ]
    ]
  }
};

export default TESTS;
