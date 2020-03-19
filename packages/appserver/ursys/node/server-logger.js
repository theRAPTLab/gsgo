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
const Tracer = require('tracer');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PROMPTS = require('../../config/prompts');
const DATESTR = require('../common/lib-datestring');
const SETTINGS = require('../../config/app.settings');
const PR = PROMPTS.Pad('LOGGER');
const { RUNTIME_PATH, PROJECT_NAME } = SETTINGS;

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const LOG_DIR = PATH.join(RUNTIME_PATH, 'logs');
const LOG_DELIMITER = '\t';
const LOG_CONFIG = {
  format: '{{line}}  {{message}}',
  dateformat: 'HH:MM:ss.L',
  preprocess(data) {
    data.line = `C ${Number(data.line).zeroPad(4)}`;
  }
};
const LOGGER = Tracer.colorConsole(LOG_CONFIG);
let fs_log = null;
// enums for outputing dates
const e_weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StartLogging() {
  // initialize event logger
  let dir = PATH.resolve(LOG_DIR);
  try {
    console.log(PR, `logging to ${dir}`);
    FSE.ensureDirSync(dir);
    let logname = `${DATESTR.DatedFilename('log')}.txt`;
    let pathname = `${dir}/${logname}`;
    fs_log = FSE.createWriteStream(pathname);
    LogLine(
      `${PROJECT_NAME} APPSERVER SESSION LOG for ${DATESTR.DateStamp()} ${DATESTR.TimeStamp()}`
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
  if (!fs_log) StartLogging();

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
/*/ API: Handle incoming log events
/*/
LOG.PKT_LogEvent = pkt => {
  let { event, items } = pkt.Data();
  if (DBG) console.log(PR, pkt.Info(), event, ...items);
  LogLine(pkt.Info(), event || '-', ...items);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write to log as delimited arguments
/*/
LOG.Write = LogLine;

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = LOG;
