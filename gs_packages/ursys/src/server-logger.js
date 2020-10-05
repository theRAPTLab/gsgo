/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LOGGER - WIP
  porting PLAE logger for now to get it minimally working

  SUPER UGLY PORT WILL CLEAN UP LATER AVERT YOUR EYES OMG

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PATH = require('path');
const FSE = require('fs-extra');
/// for server-side modules,
const TOUT = require('./util/prompts').makeTerminalOut(' URLOG');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const DATESTR = require('./util/datestring');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let LOG_DIR;
const LOG_DELIMITER = '\t';
let fs_log = null;

function StartLogging(options = {}) {
  if (!options.runtimePath) throw Error('runtime path is required');
  if (!options.serverName) options.serverName = '<UNNAMED SERVER>';
  // initialize event logger
  LOG_DIR = PATH.join(options.runtimePath, 'logs');
  let dir = PATH.resolve(LOG_DIR);
  try {
    TOUT(`logging to ${dir}`);
    FSE.ensureDirSync(dir);
    let logname = `${DATESTR.DatedFilename('log')}.txt`;
    let pathname = `${dir}/${logname}`;
    fs_log = FSE.createWriteStream(pathname);
    LogLine(
      `${
        options.serverName
      } APPSERVER SESSION LOG for ${DATESTR.DateStamp()} ${DATESTR.TimeStamp()}`
    );
    LogLine('---');
  } catch (err) {
    if (err) throw new Error(`could not make ${dir} directory`);
  }
}

/**	LOGGING FUNCTIONS ******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Log a standard system log message
/*/
function LogLine(...args) {
  if (!fs_log) throw Error('must call StartLogging with runtimePath first');

  let out = `${DATESTR.TimeStamp()} `;
  let c = args.length;
  // arguments are delimited
  if (c) {
    for (let i = 0; i < c; i++) {
      if (i > 0) out += LOG_DELIMITER;
      out += args[i];
    }
  }
  out += '\n';
  fs_log.write(out);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let LOG = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Handle incoming log events
 */
LOG.PKT_LogEvent = pkt => {
  let { event, items } = pkt.Data();
  if (DBG) console.log(TOUT, pkt.Info(), event, ...items);
  LogLine(pkt.Info(), event || '-', ...items);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Write to log as delimited arguments
 */
LOG.Write = LogLine;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Initialize Logger
 */
LOG.StartLogging = StartLogging;

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = LOG;
