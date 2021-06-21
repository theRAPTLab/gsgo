/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DATABASE

  Communicates with server-db

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PhaseMachine = require('./class-phase-machine');
const PROMPTS = require('./util/prompts');
const DATACORE = require('./client-datacore');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('URDB', 'TagDkRed');

/// STUFF GOES HERE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
