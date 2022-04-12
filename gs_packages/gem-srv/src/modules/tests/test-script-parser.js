/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tests the ScriptText Parser, which is based on jsep and expression parser.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import ScriptTokenizer from 'script/tools/class-gscript-tokenizer-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const tokenizer = new ScriptTokenizer({ show: true });

/// TOKENIZER TRIALS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The tokenizer accepts lines of text, and then parses each line character-
 *  by-character to produce tokens. The result are a bunch of arrays of
 *  js primitizes that would be fed to TRANSPILER
 */
function TokenizeTest(testName, test) {
  const cssFail = 'color:white;padding:2px 4px;background-color:Red';
  const cssOK = 'padding:2px 4px;background-color:PaleGreen';
  const cssExpect =
    'color:DarkBlue;font-weight:bold;padding:2px 4px;background-color:LightSkyBlue';

  const { text, expect } = test;
  const lines = text.split('\n');

  const script = tokenizer.tokenize(lines);
  const passed = JSON.stringify(expect) === JSON.stringify(script);
  if (passed) console.groupCollapsed(`%cTEST PASSED: '${testName}'`, cssOK);
  else console.groupCollapsed(`%cTEST FAILED: '${testName}'`, cssFail);

  if (passed) {
    console.log('PASSED script===expected');
    console.log('output', JSON.stringify(script, null, 2));
    console.log('expect', JSON.stringify(expect, null, 2));
  } else {
    lines.forEach((line, idx) => {
      const lnum = `${idx + 1}`.padStart(3, '0');
      if (line.trim().length > 0) console.log(`${lnum}: ${line}`);
    });
    console.log('%cFAILED script!==expected', cssFail);
    console.log('%coutput', cssFail, JSON.stringify(script, null, 2));
    console.log('%cexpect', cssExpect, JSON.stringify(expect, null, 2));
  }
  console.groupCollapsed('script source');
  lines.forEach((line, idx) => {
    const lnum = `${idx + 1}`.padStart(3, '0');
    if (line.trim().length > 0) console.log(`${lnum}: ${line}`);
  });
  console.groupEnd();
  console.group('script tokenize');
  tokenizer.tokenize(lines, 'show');
  console.groupEnd();
  console.groupEnd();
}

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

/// RUN TESTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// RUN ALL TESTS
Object.keys(TESTS).forEach(testName => {
  const test = TESTS[testName];
  TokenizeTest(testName, test);
});
/// RUN ONE TEST
// const testName = 'if-then-else';
// TokenizeTest(testName, TESTS[testName]);

/// CONSOLE TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
