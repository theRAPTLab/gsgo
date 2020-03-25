/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MASTER SERVER for URSYS

  URWEB   - ursys application web server
  URLOG   - ursys logger
  URNET   - ursys interapplication message server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
const ip = require('ip');
const URWEB = require('./server-express');
const URNET = require('./server-network');
const URLOG = require('./server-logger');
const URDB = require('./server-database');
const PROMPTS = require('../../config/prompts');

/// TERMINAL CONSTANTS ////////////////////////////////////////////////////////
const { TERM_URSYS: CS, CCRIT: CC, CR, TR } = PROMPTS;
const LPR = 'URSERV';
const PR = `${CS}${PROMPTS.Pad(LPR)}${CR}`;

/// SERVER CONSTANTS //////////////////////////////////////////////////////////
const SERVER_INFO = {
  main: `http://localhost:3000`,
  client: `http://${ip.address()}:3000`
};

/// API CREATE MODULE /////////////////////////////////////////////////////////
let URSERV = {};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URSERV.StartWebServer = callback => {
  URLOG.Write(LPR, `starting web server`);
  // returns an optional promise hook
  console.log(PR, `${CS}STARTING WEB SERVER${CR}`);
  (async () => {
    try {
      await URWEB.Start();
      let out = `\n---\n`;
      out += `${CS}SYSTEM INITIALIZATION COMPLETE${CR}\n`;
      out += `GO TO ONE OF THESE URLS in CHROME WEB BROWSER\n`;
      out += `LOCAL  - ${SERVER_INFO.main}/#/admin\n`;
      out += `REMOTE - ${SERVER_INFO.client}\n`;
      out += `---\n`;
      if (typeof callback === 'function') callback(out);
      console.log(out);
    } catch (err) {
      console.log(PR, `${CC}${err}${CR}`);
      console.log(PR, `... exiting with errors\n`);
      process.exit(0);
    }
  })();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
URSERV.StartNetwork = () => {
  URLOG.Write(LPR, `starting network`);
  URNET.StartNetwork();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Server message handlers. All messages with the prefix 'NET:SRV_' are always
 * handled by the server.
 */
URSERV.RegisterHandlers = () => {
  URLOG.Write(LPR, `registering network services`);
  // start logging message
  URNET.NetSubscribe('NET:SRV_LOG_EVENT', URLOG.PKT_LogEvent);

  // register remote messages
  URNET.NetSubscribe('NET:SRV_REG_HANDLERS', URNET.PKT_RegisterRemoteHandlers);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Main Entry Point
 */
URSERV.Initialize = (options = {}) => {
  URLOG.Write(LPR, `initializing network`);
  if (options.apphost) console.log(PR, `${CC}APPHOST OPTIONS${TR} ${options.apphost}`);
  if (process.env.DATASET) console.log(PR, `${CC}DATASET=${TR} ${process.env.DATASET}`);
  console.log(PR, `${CS}STARTING UR SOCKET SERVER${CR}`);
  URSERV.RegisterHandlers();
  // don't even bother with database yet
  // URDB.InitializeDatabase(options);
  return URNET.InitializeNetwork(options);
};
/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = URSERV;
