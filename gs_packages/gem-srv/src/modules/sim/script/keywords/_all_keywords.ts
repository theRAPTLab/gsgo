/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enabled keywords. Each keyword registers itself into the Keyword Dictionary
  when exported through this file. There is no need to import this file
  into your code.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STABLE KEYWORDS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PROGRAM DEFINE
export * from './addProp'; // use during DEFINE
export * from './useFeature';
// export * from './addTest'; // add a named test
/// PROGRAM UPDATE
export * from './prop'; // objref method args
export * from './featProp'; // objref method args
export * from './featCall'; // objref method argss

// utility keywords
export * from './propPush'; // push prop value onto data stack
export * from './propPop'; // pop prop value onto data stack
export * from './featPropPush'; // objref method args
export * from './featPropPop'; // objref method args
export * from './exprPush'; // push expr onto data stack

// conditional keywords
export * from './when'; // filtering global condition
export * from './onEvent'; // script event processing

// system keywords being with _
export * from './_comment'; // embed comment data
export * from './_pragma'; // compiler control
export * from './_blueprint'; // set the name of a blueprint bundle

/// DEVELOPMENT LIMBO /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// KEYWORDS BELOW THIS LINE ARE SUBJECT TO CHANGE !!!

// utility keywords
export * from './randomPos'; // randomizes position (bad use of Math.random()

// conditional keywords
export * from './ifExpr'; // run an expression test
// export * from './ifTest'; // run a named test during agent runtime
// export * from './ifProg'; // experimental placeholder

// subprogram keywords
export * from './exec'; // execute an smc program (?)

// debug keywords (very slow performance)
export * from './dbgOut';
export * from './dbgStack';
export * from './dbgContext';
export * from './dbgError';
export * from './keywordErr';
// export * from './unknownKeyword';
