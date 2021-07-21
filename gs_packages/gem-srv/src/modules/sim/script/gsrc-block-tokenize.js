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
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    [
      [
        { 'token': 'prop' },
        { 'token': 'A' },
        { 'token': 'set' },
        { 'value': 30 }
      ],
      [{ 'token': 'prop' }, { 'token': 'B' }, { 'token': 'set' }, { 'value': 40 }]
    ],
    [
      [
        { 'token': 'prop' },
        { 'token': 'A' },
        { 'token': 'sub' },
        { 'value': 10 }
      ],
      [{ 'token': 'prop' }, { 'token': 'B' }, { 'token': 'sub' }, { 'value': 20 }]
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
when A touches B [[
  prop C set 10
  ifExpr {{ C }}  gt 0 [[
    prop D add 1
  ]]
]]
`,
  expect:
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},[[{"token":"prop"},{"token":"C"},{"token":"set"},{"value":10}],[{"token":"ifExpr"},{"expr":" C "},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]]]]]]'
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
        { 'token': 'C' },
        { 'token': 'set' },
        { 'value': 10 }
      ],
      [
        { 'token': 'ifExpr' },
        { 'expr': ' C ' },
        { 'token': 'gt' },
        { 'value': 0 },
        [
          [
            [
              { 'token': 'prop' },
              { 'token': 'D' },
              { 'token': 'add' },
              { 'value': 1 }
            ]
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
    '[[{"token":"ifExpr"},{"expr":" A "},[[{"token":"ifExpr"},{"expr":" BB "},[[[{"token":"ifExpr"},{"expr":" CCC "},[[[{"token":"prop"},{"token":"DDD"},{"token":"add"},{"value":1}]]]]]]],[{"token":"prop"},{"token":"EEE"},{"token":"set"},{"value":0}]]]]'
};
script = [
  [
    { 'token': 'ifExpr' },
    { 'expr': ' A ' },
    [
      [
        { 'token': 'ifExpr' },
        { 'expr': ' BB ' },
        [
          [
            [
              { 'token': 'ifExpr' },
              { 'expr': ' CCC ' },
              [
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
script = [
  [
    { 'token': 'ifExpr' },
    { 'expr': ' A ' },
    [
      { 'token': 'ifExpr' },
      { 'expr': ' BB ' },
      [
        [
          { 'token': 'ifExpr' },
          { 'expr': ' CCC ' },
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
    [{ 'token': 'prop' }, { 'token': 'EEE' }, { 'token': 'set' }, { 'value': 0 }]
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block chaining
const nblockblock = {
  text: `
when A touches B [[
  prop X set 10
  ifExpr {{ X }} gt 0 [[
    prop D add 1
  ]] [[
    prop D delete
  ]]
]]
`,
  expect:
    '[[{"token":"when"},{"token":"A"},{"token":"touches"},{"token":"B"},[[{"token":"prop"},{"token":"X"},{"token":"set"},{"value":10}],[{"token":"ifExpr"},{"expr":" X "},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]],[[[{"token":"prop"},{"token":"D"},{"token":"delete"}]]]]]]]'
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
        { 'expr': ' X ' },
        { 'token': 'gt' },
        { 'value': 0 },
        [
          [
            [
              { 'token': 'prop' },
              { 'token': 'D' },
              { 'token': 'add' },
              { 'value': 1 }
            ]
          ]
        ],
        [[[{ 'token': 'prop' }, { 'token': 'D' }, { 'token': 'delete' }]]]
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
        'ifExpr {{ X }} gt 0 [[',
        'prop D add 1',
        ']] [[',
        'prop D delete',
        ']]'
      ]
    }
  ]
];
export const Blocks = {
  block,
  blockblock,
  nblock,
  tnblock,
  nblockblock
};
