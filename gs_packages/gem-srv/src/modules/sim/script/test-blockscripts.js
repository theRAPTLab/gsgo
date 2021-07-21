/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  consistent sources for testing script parsing without keyword generation

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let script; // what the script output should look like
let oldscript;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const block = [
  `
A touch A [[
  prop A set 10
  prop B set 20
]]
`,
  '[[{"token":"A"},{"token":"touch"},{"token":"A"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":20}]]]]'
];
script = [
  [
    { 'token': 'A' },
    { 'token': 'touch' },
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
    { 'token': 'A' },
    { 'token': 'touch' },
    { 'token': 'A' },
    { 'block': ['prop A set 10', 'prop B set 20'] }
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test block chaining
const blockblock = [
  `
A then [[
  prop A set 30
  prop B set 40
]] [[
  prop A sub 10
  prop B sub 20
]]
`,
  '[[{"token":"A"},{"token":"then"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":30}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":40}]],[[{"token":"prop"},{"token":"A"},{"token":"sub"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"sub"},{"value":20}]]]]'
];
script = [
  [{ 'comment': 'blank' }],
  [
    { 'token': 'A' },
    { 'token': 'then' },
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
  ],
  [{ 'comment': 'blank' }]
];
oldscript = [
  [
    { 'token': 'A' },
    { 'token': 'then' },
    { 'block': ['prop A set 30', 'prop B set 40'] },
    { 'block': ['prop A sub 10', 'prop B sub 20'] }
  ]
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block
const nblock = [
  `
B touch B [[
  prop C set 10
  if C gt 0 [[
    prop D add 1
  ]]
]]
`,
  '[[{"token":"B"},{"token":"touch"},{"token":"B"},[[{"token":"prop"},{"token":"C"},{"token":"set"},{"value":10}],[{"token":"if"},{"token":"C"},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]]]]]]'
];
script = [
  [
    { 'token': 'B' },
    { 'token': 'touch' },
    { 'token': 'B' },
    [
      [
        { 'token': 'prop' },
        { 'token': 'C' },
        { 'token': 'set' },
        { 'value': 10 }
      ],
      [
        { 'token': 'if' },
        { 'token': 'C' },
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
    { 'token': 'B' },
    { 'token': 'touch' },
    { 'token': 'B' },
    { 'block': ['prop C set 10', 'if C gt 0 [[', 'prop D add 1', ']]'] }
  ]
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test nested block chaining
const nblockblock = [
  `
N test N [[
  prop X set 10
  if X gt 0 [[
    prop D add 1
  ]] [[
    prop D delete
  ]]
]]
`,
  '[[{"token":"N"},{"token":"test"},{"token":"N"},[[{"token":"prop"},{"token":"X"},{"token":"set"},{"value":10}],[{"token":"if"},{"token":"X"},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]],[[[{"token":"prop"},{"token":"D"},{"token":"delete"}]]]]]]]'
];
script = [
  [
    { 'token': 'N' },
    { 'token': 'test' },
    { 'token': 'N' },
    [
      [
        { 'token': 'prop' },
        { 'token': 'X' },
        { 'token': 'set' },
        { 'value': 10 }
      ],
      [
        { 'token': 'if' },
        { 'token': 'X' },
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
    { 'token': 'N' },
    { 'token': 'test' },
    { 'token': 'N' },
    {
      'block': [
        'prop X set 10',
        'if X gt 0 [[',
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
  nblockblock
};
