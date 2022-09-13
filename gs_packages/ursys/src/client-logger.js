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
const DBG = false;
const PR = PROMPTS.makeStyleFormatter('LOGGER');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let LOGGING_ENABLED = false; // defuault

/// LOG ASSET ERRORS //////////////////////////////////////////////////////////
/** API: used by asset manager if it's unable to load an asset */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MISSING = []; // stores a missing asset that is reported through
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: use to log a 'missing asset' during loading activities. This is
 *  cached locally so you can inspect if DBG is set true (see addConsoleTool
 *  below) Otherwise, in current state this is only useful for local debugging
 *  of asset loaders */
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

/// EVENT LOGGING API /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: log a packet to the server. The payload 'items' is an array of
 *  Javascript primitives that can be encoded in JSON; the server will
 *  write them using the delimitter implemented by LOG.PKT_LogEvent()
 *  (currently it is the tab character)
 *  @param {string} event - an event name you decide on
 *  @param {Array} items - an array of primitives to write
 */
function LogEvent(event, itemsArray) {
  if (!LOGGING_ENABLED) return;
  if (!Array.isArray(itemsArray)) itemsArray = [itemsArray];
  SendMessage('NET:SRV_LOG_EVENT', { event, items: itemsArray });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: log a packet to the server. The payload 'json' is a string
 *  that will be written as one field in the log line.
 *  @param {string} event - an event name you decide on
 *  @param {object} json - a javscript object
 */
function LogJSON(event, json) {
  if (!LOGGING_ENABLED) return;
  SendMessage('NET:SRV_LOG_JSON', { event, json: JSON.stringify(json) });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Set or Unset LogEnabled flag. Call without argument to just
 *  retrieve the current status of the logger
 *  @param {boolean} boolLog - if true/false, set the state. can be undefined
 *  @returns boolean - always current state of the logging
 */
function LogEnabled(boolLog) {
  const fn = 'LogEnabled:';
  // if called without arg, then just return state
  if (boolLog === undefined) return LOGGING_ENABLED;
  // make sure arg is boolean, hard crash if not
  if (typeof boolLog !== 'boolean') {
    throw Error(`${fn} arg must be boolean (true means enabled)`);
  }
  // report logging changes
  if (!LOGGING_ENABLED && boolLog) LogEvent('CLIENT_LOG', ['ENABLED']);
  if (LOGGING_ENABLED && !boolLog) LogEvent('CLIENT_LOG', ['DISABLED']);
  LOGGING_ENABLED = boolLog;
  // always return the state
  return LOGGING_ENABLED;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  LogEnabled, // call without arg to just get status
  LogEvent, // write to the current log
  LogJSON, // write to the
  //
  MissingAsset
};
