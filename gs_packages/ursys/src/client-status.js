/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT-SIDE LOGGER
  capture logged categories for later review
  for network logging, see index-client

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PROMPTS = require('./util/prompts');
const PhaseMachine = require('./class-phase-machine');
const { addConsoleTool } = require('./util/client-debug');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = PROMPTS.makeStyleFormatter('LOGGER');
const MISSING = [];

/// LOG ASSET ERRORS //////////////////////////////////////////////////////////
/** API: used by asset manager if it's unable to load an asset */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MissingAsset(str) {
  const mStatusString = PhaseMachine.GetMachineStates();
  MISSING.push(`'${str}' during ${mStatusString}`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** console debug utility to list missing assets */
if (DBG)
  addConsoleTool({
    'dump_missing_assets': () => {
      console.log('MISSING ASSET LOG');
      MISSING.forEach((line, ii) => console.log(`${ii}\t${line}`));
    }
  });

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { MissingAsset };
