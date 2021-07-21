// consistent sources for testing script parsing without keyword generation
let script;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// test simple block
const block = [
  `
A touch A [[
  prop A set 10
  prop B set 20
]]
`,
  '[[{"comment":"blank"}],[{"token":"A"},{"token":"touch"},{"token":"A"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":20}]]],[{"comment":"blank"}]]'
];
script = [
  [{ 'comment': 'blank' }],
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
  ],
  [{ 'comment': 'blank' }]
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
  '[[{"comment":"blank"}],[{"token":"A"},{"token":"then"},[[{"token":"prop"},{"token":"A"},{"token":"set"},{"value":30}],[{"token":"prop"},{"token":"B"},{"token":"set"},{"value":40}]],[[{"token":"prop"},{"token":"A"},{"token":"sub"},{"value":10}],[{"token":"prop"},{"token":"B"},{"token":"sub"},{"value":20}]]],[{"comment":"blank"}]]'
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
  '[[{"comment":"blank"}],[{"token":"B"},{"token":"touch"},{"token":"B"},[[{"token":"prop"},{"token":"C"},{"token":"set"},{"value":10}],[{"token":"if"},{"token":"C"},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]]]]],[{"comment":"blank"}]]'
];
script = [
  [{ 'comment': 'blank' }],
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
  ],
  [{ 'comment': 'blank' }]
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
  '[[{"comment":"blank"}],[{"token":"N"},{"token":"test"},{"token":"N"},[[{"token":"prop"},{"token":"X"},{"token":"set"},{"value":10}],[{"token":"if"},{"token":"X"},{"token":"gt"},{"value":0},[[[{"token":"prop"},{"token":"D"},{"token":"add"},{"value":1}]]],[[[{"token":"prop"},{"token":"D"},{"token":"delete"}]]]]]],[{"comment":"blank"}]]'
];
script = [
  [{ 'comment': 'blank' }],
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
  ],
  [{ 'comment': 'blank' }]
];
export const Blocks = {
  block,
  blockblock,
  nblock,
  nblockblock
};
