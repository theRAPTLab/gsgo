/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enabled keywords. Each keyword registers itself into the Keyword Dictionary
  when exported through this file. There is no need to import this file
  into your code.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STABLE KEYWORDS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// USE DURING PROGRAM DEFINE
export * from './addProp'; // use during DEFINE to name a prop
export * from './addFeature'; // use during DEFINE to import a feature
// /*DEPRECATED*/ export * from './useFeature'; // import a feature
// export * from './addTest'; // add a named test

/// USE DURING PROGRAM UPDATE
export * from './prop'; // prop_objref method args
export * from './call'; // prop_objref method args (same as prop?)
/*DEPRECATED*/ export * from './featProp'; // objref method args
/*DEPRECATED*/ export * from './featCall'; // objref method args

// utility keywords
/*DEPRECATED*/ export * from './propPush'; // push prop value onto data stack
/*DEPRECATED*/ export * from './propPop'; // pop prop value onto data stack
/*DEPRECATED*/ export * from './featPropPush'; // objref method args
/*DEPRECATED*/ export * from './featPropPop'; // objref method args

// conditional keywords
export * from './if'; // run code conditionally
export * from './when'; // filtering global condition
export * from './onEvent'; // script event processing
export * from './every'; // script event processing

// system keywords being with _
export * from './_comment'; // embed comment data
export * from './_line'; // a blank line
export * from './_pragma'; // compiler control

/// DEVELOPMENT LIMBO /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// KEYWORDS BELOW THIS LINE ARE SUBJECT TO CHANGE !!!

// utility keywords
export * from './randomPos'; // randomizes position
/*DEPRECATED*/ export * from './exprPush'; // push expr onto data stack

// conditional keywords
/*DEPRECATED*/ export * from './ifExpr'; // run code conditionally

// debug keywords (very slow performance)
export * from './dbgOut';
export * from './dbgStack';
export * from './dbgContext';
export * from './dbgError';
export * from './keywordErr';
// export * from './unknownKeyword';

// placedholder stack keywords
export * from './stackAdd';
export * from './stackSub';
export * from './stackMul';
export * from './stackDiv';
