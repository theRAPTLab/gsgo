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

/// MOCKED ARGUMENT SYMBOL DATA ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the GPROP_SYMBOLS map holds the list of GPROP_TYPES (e.g. GBoolean)
 *  and all the associated properties and methods that are available on it.
 */
enum GPROP_TYPES {
  GBoolean,
  GString,
  GNumber
}
/** T_ARGS is the list of GPROP */
enum T_ARG {
  // literal js types
  boolean,
  string,
  number,
  // special gemscript types
  expr,
  objref,
  any
}
type T_PROPS = {
  [propName: string]: {
    argInfo: string;
    argType: T_ARG;
  };
};
type T_METHODS = {
  [methodName: string]: {
    argInfo: string;
    argType: T_ARG;
  };
};
interface GPROP_INFO {
  props: T_PROPS;
  methods: T_METHODS;
}
const GPROP_SYMBOLS = new Map<GPROP_TYPES, GPROP_INFO>();

/// MOCKED BLUEPRINT SYMBOL DATA //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The blueprints dictionary uses AgentType as key to dictionaries of the
 *  added properties, added methods, and added Feature properties and methods.
 *  The undecorated base Agent is always in this table.
 */
interface BLUEPRINT_INFO {
  Features: { [FeatureName: string]: GPROP_INFO };
  props: T_PROPS;
  methods: T_METHODS;
}
const BLUEPRINT_SYMBOLS = new Map<string, BLUEPRINT_INFO>();

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
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
