/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-cond-assign */
/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  symbol-utilities test

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

// uses types defined in t-script.d
import { StringToParts } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

// initialize the scope chain
const BROOT = {
  'GLOBAL': 'Global',
  'agent': 'Agent'
};
let HEAD;
// go down the chain
const BLOCK = {
  'Bees': 'Bees',
  'Flowers': 'Flowers'
};
Object.setPrototypeOf(BLOCK, BROOT);
HEAD = BLOCK;
// go down the chain
const BLOCK2 = {
  'Magic': 'Magic'
};
Object.setPrototypeOf(BLOCK2, HEAD);
HEAD = BLOCK2;
// go up the chain
let TEMP = Object.getPrototypeOf(HEAD);
Object.setPrototypeOf(HEAD, null);
HEAD = TEMP;

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// FILTERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestObjref(tok: IToken = { objref: ['Agent', 'x'] }) {
  const { objref } = tok;
}

/// TESTING CONSOLE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  'objref_parse': str => {
    const parts = StringToParts(str);
    if (parts === undefined) return 'bad objref string';
    return TestObjref({ objref: parts });
  },
  'block': () => {
    // eslint-disable-next-line guard-for-in
    for (let ref in HEAD) console.log(ref);
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestObjref };
