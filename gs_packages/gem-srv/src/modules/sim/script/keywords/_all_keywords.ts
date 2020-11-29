/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enabled keywords. Each keyword registers itself into the Keyword Dictionary
  when exported through this file. There is no need to import this file
  into your code.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STABLE KEYWORDS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export * from './addProp';
export * from './prop';
export * from './propMethod';
export * from './useFeature';
export * from './featureProp';
export * from './featureCall';

// utility keywords
export * from './randomPos'; // randomizes position

/// UNDER DEVELOPMENT /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// KEYWORDS BELOW THIS LINE ARE SUBJECT TO CHANGE !!!

// system keywords being with _
export * from './comment'; // embed comment data
export * from './pragma'; // compiler control
export * from './defBlueprint'; // set the name of a blueprint bundle

// keywords under development
export * from './addTest'; // add a named test
export * from './ifExpr'; // run an expression test
export * from './ifTest'; // run a named test during agent runtime
export * from './ifProg'; // experimental placeholder
export * from './onCondition'; // experimental placeholder
export * from './onAgent'; // experimental placeholder
export * from './onTick'; // experimental placeholder

// debug keywords (very slow performance)
export * from './dbgOut';
export * from './dbgStack';
export * from './dbgError';
export * from './unknownKeyword';
