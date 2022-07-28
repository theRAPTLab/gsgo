/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enabled keywords. Each keyword registers itself into the Keyword Dictionary
  when exported through this file. There is no need to import this file
  into your code.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STABLE KEYWORDS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// USE DURING PROGRAM DEFINE or INIT
export * from './addProp'; // define a property before use
export * from './addFeature'; // specify a feature before use

/// USE DURING PROGRAM DEFINE, INIT, or UPDATE
export * from './prop'; // prop_objref method args
export * from './call'; // prop_objref method args (same as prop?)
export * from './featProp'; // objref method args
export * from './featCall'; // objref method args

/// V1.0 SHORTCUT KEYWORDS
/// these will eventually be replaced by improvements to the parser
/// but are necessary for now
export * from './propPush'; // push prop value onto data stack
export * from './propPop'; // pop prop value onto data stack
export * from './featPropPush'; // objref method args
export * from './featPropPop'; // objref method args
export * from './exprPush'; // push expr onto data stack
export * from './ifExpr'; // run code conditionally

// console debug keywords (deprecated but still in use)
export * from './dbgOut';

// conditional keywords
export * from './if'; // run code conditionally
export * from './when'; // filtering global condition
export * from './onEvent'; // script event processing
export * from './every'; // script event processing

// system keywords being with _
export * from './_comment'; // embed comment data
export * from './_line'; // a blank line
export * from './_directive'; // compiler control

/// DEVELOPMENT LIMBO /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// KEYWORDS BELOW THIS LINE ARE SUBJECT TO CHANGE !!!

// utility keywords
export * from './randomPos'; // randomizes position

// debug keywords (very slow performance)
export * from './dbgTick';
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
