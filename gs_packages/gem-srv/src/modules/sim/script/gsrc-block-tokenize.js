/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script parsing without keyword generation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let script; // what the script output should look like
let oldscript;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const block = {
  text: `
when A touches A [[
  prop A set 10
  prop B set 20
]]
`,
  expect:
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"A"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":20}]]]]'
};
script = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'A' },
    [
      [
        { 'token': 'prop' },
        { 'token': 'A' },
        { 'token': 'set' },
        { 'value': 10 }
      ],
      [{ 'token': 'prop' }, { 'token': 'B' }, { 'token': 'set' }, { 'value': 20 }]
    ]
  ]
];
oldscript = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'A' },
    { 'block': ['prop A set 10', 'prop B set 20'] }
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test block chaining
const blockblock = {
  text: `
when A touches B [[
  prop A set 30
  prop B set 40
]] [[
  prop A sub 10
  prop B sub 20
]]
`,
  expect:
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":30}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":40}]],[[{"token":"prop"},{"token":"A"},{"token":"sub"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"sub"},{"value":20}]]]]'
};
script = [
  [
    // statement
    { 'token': 'when' },
    [
      // block
      [
        // block statement
        { 'token': 'prop' },
        { 'token': 'A' }
      ],
      [
        // block statement
        { 'token': 'ifExpr' },
        [
          // block
          [
            // block statement
            { 'token': 'prop' },
            { 'token': 'D' }
          ]
        ]
      ]
    ]
  ]
];
oldscript = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    { 'block': ['prop A set 30', 'prop B set 40'] },
    { 'block': ['prop A sub 10', 'prop B sub 20'] }
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block
const nblock = {
  text: `
when [[
  prop A
  ifExpr [[
    prop D
  ]]
]]
`,
  expect:
    '[[{"token":"when"},[[{"token":"prop"},{"token":"A"}],[{"token":"ifExpr"},[[{"token":"prop"},{"token":"D"}]]]]]]'
};
script = [
  [
    { 'token': 'when' },
    [
      [{ 'token': 'prop' }, { 'token': 'A' }],
      [{ 'token': 'ifExpr' }, [[{ 'token': 'prop' }, { 'token': 'D' }]]]
    ]
  ]
];
oldscript = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    {
      'block': ['prop C set 10', 'ifExpr {{ C }}  gt 0 [[', 'prop D add 1', ']]']
    }
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test tripple nesting
const tnblock = {
  text: `
ifExpr {{ A }} [[
  ifExpr {{ BB }} [[
    ifExpr {{ CCC }} [[
      prop DDD add 1
    ]]
  ]]
  prop EEE set 0
]]
`,
  expect:
    '[[{"token":"ifExpr"},{"expr":"A"},[[{"token":"ifExpr"},{"expr":"BB"},[[{"token":"ifExpr"},{"expr":"CCC"},[[{"token":"prop"},{"token":"DDD"},{"token":"add"},{"value":1}]]]]],[{"token":"prop"},{"token":"EEE"},{"token":"set"},{"value":0}]]]]'
};
script = [
  [
    { 'token': 'ifExpr' },
    { 'expr': 'A' },
    [
      [
        { 'token': 'ifExpr' },
        { 'expr': 'BB' },
        [
          [
            { 'token': 'ifExpr' },
            { 'expr': 'CCC' },
            [
              [
                { 'token': 'prop' },
                { 'token': 'DDD' },
                { 'token': 'add' },
                { 'value': 1 }
              ]
            ]
          ]
        ]
      ],
      [
        { 'token': 'prop' },
        { 'token': 'EEE' },
        { 'token': 'set' },
        { 'value': 0 }
      ]
    ]
  ]
];
oldscript = [
  [
    { 'token': 'ifExpr' },
    { 'expr': 'A' },
    {
      'block': [
        'ifExpr {{ BB }} [[',
        'ifExpr {{ CCC }} [[',
        'prop DDD add 1',
        ']]',
        ']]',
        'prop EEE set 0'
      ]
    }
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block chaining
const nblockblock = {
  text: `
when A touches B [[
  prop X set 10
  ifExpr {{ X }} [[
    prop D add 1
  ]] [[
    prop D delete
  ]]
]]
`,
  expect:
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},[[{"token":"prop"},{"token":"X"},{"token":"set"},{"value":10}],[{"token":"ifExpr"},{"expr":"X"},[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]],[[{"token":"prop"},{"token":"D"},{"token":"delete"}]]]]]]'
};
script = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    [
      [
        { 'token': 'prop' },
        { 'token': 'X' },
        { 'token': 'set' },
        { 'value': 10 }
      ],
      [
        { 'token': 'ifExpr' },
        { 'expr': 'X' },
        [
          [
            { 'token': 'prop' },
            { 'token': 'D' },
            { 'token': 'add' },
            { 'value': 1 }
          ]
        ],
        [[{ 'token': 'prop' }, { 'token': 'D' }, { 'token': 'delete' }]]
      ]
    ]
  ]
];
oldscript = [
  [
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    {
      'block': [
        'prop X set 10',
        'ifExpr {{ X }}',
        'prop D add 1',
        ']] [[',
        'prop D delete',
        ']]'
      ]
    }
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifExpr = {
  text: `
ifExpr {{ A }} [[
  dbgOut "true that"
]]
  `,
  expect:
    '[[{"token":"ifExpr"},{"expr":"A"},[[{"token":"dbgOut"},{"string":"true that"}]]]]'
};
script = [
  [
    { 'token': 'ifExpr' },
    { 'expr': 'A' },
    [{ 'token': 'dbgOut' }, { 'string': 'true that' }]
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const bee = {
  text: `
# BLUEPRINT Bee
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featCall Costume setCostume "bunny.json" 1
# PROGRAM UPDATE
prop agent.skin setTo "bunny.json"
ifExpr {{true}} [[
  ifExpr {{ false }} [[
    dbgOut "true"
  ]] [[
    dbgOut 'chained blocks work'
  ]]
]]
  `,
  expect:
    '[[{"directive":"#"},{"token":"BLUEPRINT"},{"token":"Bee"}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"DEFINE"}],[{"token":"useFeature"},{"token":"Costume"}],[{"token":"useFeature"},{"token":"Movement"}],[{"token":"addProp"},{"token":"foodLevel"},{"token":"Number"},{"value":50}],[{"token":"featCall"},{"token":"Costume"},{"token":"setCostume"},{"string":"bunny.json"},{"value":1}],[{"directive":"#"},{"token":"PROGRAM"},{"token":"UPDATE"}],[{"token":"prop"},{"objref":["agent","skin"]},{"token":"setTo"},{"string":"bunny.json"}],[{"token":"ifExpr"},{"expr":"true"},[[{"token":"ifExpr"},{"expr":"false"},[[{"token":"dbgOut"},{"string":"true"}]],[[{"token":"dbgOut"},{"string":"chained blocks work"}]]]]]]'
};
script = [
  [{ 'directive': '#' }, { 'token': 'BLUEPRINT' }, { 'token': 'Bee' }],
  [{ 'directive': '#' }, { 'token': 'PROGRAM' }, { 'token': 'DEFINE' }],
  [{ 'token': 'useFeature' }, { 'token': 'Costume' }],
  [{ 'token': 'useFeature' }, { 'token': 'Movement' }],
  [
    { 'token': 'addProp' },
    { 'token': 'foodLevel' },
    { 'token': 'Number' },
    { 'value': 50 }
  ],
  [
    { 'token': 'featCall' },
    { 'token': 'Costume' },
    { 'token': 'setCostume' },
    { 'string': 'bunny.json' },
    { 'value': 1 }
  ],
  [{ 'directive': '#' }, { 'token': 'PROGRAM' }, { 'token': 'UPDATE' }],
  [
    { 'token': 'prop' },
    { 'objref': ['agent', 'skin'] },
    { 'token': 'setTo' },
    { 'string': 'bunny.json' }
  ],
  [
    { 'token': 'ifExpr' },
    { 'expr': 'true' },
    [
      [
        { 'token': 'ifExpr' },
        { 'expr': 'false' },
        [[{ 'token': 'dbgOut' }, { 'string': 'true' }]],
        [[{ 'token': 'dbgOut' }, { 'string': 'chained blocks work' }]]
      ]
    ]
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const Blocks = {
  block,
  blockblock,
  nblock,
  tnblock,
  nblockblock,
  ifExpr,
  bee
};
