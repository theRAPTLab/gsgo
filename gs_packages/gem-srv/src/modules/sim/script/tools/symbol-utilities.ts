/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-cond-assign */
/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  compile-time
  run-time

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TabProps } from '@material-ui/core';
import { IToken } from 'lib/t-script.d';
import { StringToParts } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// ARGUMENT SYMBOL DATA //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the GPROP_SYMBOLS map holds the list of GPROP_TYPES (e.g. GBoolean)
 *  and all the associated properties and methods that are available on it.
 */
enum GPROP_TYPES {
  GBoolean,
  GString,
  GNumber
}
/** T_ARGS is the list of argument types. It's used in two ways:
 *  1. describing the type of GPROP when building symbol tables
 *  2. describing the types of compile-time parameters expected
 */
enum T_ARG {
  // primitive types
  boolean,
  string,
  number,
  // special gemscript types
  expr,
  objref,
  any
}
/** ARG_SYMBOLS is used by keywords to define type purpose and type of arguments
 *  expected from a decoded TScriptUnit
 */
interface ARG_SYMBOLS {
  argInfo: string;
  argType: T_ARG;
}
/** T_PROP_SYMBOLS are a list of SM_Object props, if there are any. GPROPs
 *  don't have them, but AGENTs and FEATUREs do */
type T_PROP_SYMBOLS = {
  [propName: string]: ARG_SYMBOLS;
};
/** T_METHOD_SYMBOLS are the list of SM_Object methods and their arguments.
 *  GPROPs and FEATUREs have methods (e.g. setTo) but AGENTs do not
 */
type T_METHOD_SYMBOLS = {
  [methodName: string]: Array<ARG_SYMBOLS>;
};
/** SM_SYMBOLS contains symbol information for all props and methods of an
 *  SM_OBJECT like a GVAR, AGENT, or FEATURE
 */
interface SM_SYMBOLS {
  props: T_PROP_SYMBOLS;
  methods: T_METHOD_SYMBOLS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GPROP_SYMBOLS = new Map<GPROP_TYPES, SM_SYMBOLS>();

/// BLUEPRINT SYMBOL DATA /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The blueprints dictionary uses AgentType as key to dictionaries of the
 *  added properties, added methods, and added Feature properties and methods.
 *  The undecorated base Agent is always in this table.
 */
interface BLUEPRINT_INFO {
  Features: { [FeatureName: string]: SM_SYMBOLS };
  props: T_PROP_SYMBOLS;
  methods: T_METHOD_SYMBOLS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BLUEPRINT_SYMBOLS = new Map<string, BLUEPRINT_INFO>();

/// MOCKED DATA ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GNumber = {
  props: ['value:number', 'min:number', 'max:number', 'wrap:boolean'],
  methods: {
    value: { returns: 'value:number' },
    setWrap: { args: ['nvalue:number'] },
    setMin: { args: ['nvalue:number'] },
    setMax: { args: ['nvalue:number'] },
    setTo: { args: ['nvalue:number'] },
    setToRnd: { args: ['min:number', 'max:number', 'asInteger:boolean'] },
    add: { args: ['num:number'] }
  }
};
const GBoolean = {
  props: ['fuzzy:number', 'value:boolean'],
  methods: {
    setTo: { args: ['value:boolean'] },
    true: { returns: 'value:boolean' },
    false: { returns: 'value:boolean' },
    invert: { returns: 'value:boolean' },
    and: { args: ['comparison:any'] },
    or: { args: ['comparison:any'] },
    eq: { args: ['comparison:any'] },
    slightlyTrue: { returns: 'value:boolean' },
    mostlyTrue: { returns: 'value:boolean' },
    slightlyFalse: { returns: 'value:boolean' },
    mostlyFalse: { returns: 'value:boolean' }
  }
};
const GString = {
  props: ['value:string'],
  methods: {
    setTo: { args: ['value:string'] },
    eq: { args: ['str:string'], returns: 'isEqual:boolean' },
    clear: {}
  }
};
const GVAR_LOOKUP = {
  number: GNumber,
  string: GString,
  boolean: GBoolean
};
const DEFAULT_PROPS = ['x:number', 'y:number', 'skin:string', 'visible:boolean'];
const BLUEPRINT_LOOKUP: any = {
  Agent: {
    Features: [
      'AgentWidget',
      'Costume',
      'Cursor',
      'Global',
      'Movement',
      'Physics',
      'Population',
      'Template',
      'Timer',
      'Touches',
      'Vision'
    ],
    props: [...DEFAULT_PROPS],
    methods: []
  }
};
const KEYWORD_LOOKUP = {
  prop: ['refArg:objref', 'propMethod:identifier', 'value:any'],
  call: ['refArg.objref', 'propMethod:identifier', '...args'],
  if: ['condition:expr', 'conseq:block', '?alter:block'],
  when: [
    ['Agent:agent', 'test:program', 'conseq:block'], // signature 1
    ['AgentA:agent', 'test:program', 'AgentB:agent', 'conseq:block'] // signature 2
  ],
  every: ['period:number', '...args', 'conseq:block'],
  onEvent: ['eventName:identifier', 'conseq:block']
};
const ARGUMENT_DECODE_TABLE = {
  'objref': () => {},
  'identifier': () => {},
  'any': () => {},
  '...args': () => {},
  'block': () => {},
  'program': () => {},
  'agent': () => {},
  'number': () => {},
  'string': () => {},
  'boolean': () => {},
  'expr': () => {}
};
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
console.log('WHAT THE FUCK');
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
