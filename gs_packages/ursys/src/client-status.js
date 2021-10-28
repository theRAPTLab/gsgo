/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT-SIDE LOGGER
  capture logged categories for later review

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PROMPTS = require('./util/prompts');
const PhaseMachine = require('./class-phase-machine');
const { addConsoleTool } = require('./util/client-debug');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('LOGGER');
const MISSING = [];

/// LOG ERRORS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MissingAsset(str) {
  const mStatusString = PhaseMachine.GetMachineStates();
  MISSING.push(`'${str}' during ${mStatusString}`);
}

/// PRINT ERRORS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
addConsoleTool({
  'missing_assets': () => {
    console.log('MISSING ASSET LOG');
    MISSING.forEach((line, ii) => console.log(`${ii}\t${line}`));
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { MissingAsset };
