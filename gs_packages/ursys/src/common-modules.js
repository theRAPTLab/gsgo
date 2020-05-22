/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODULES USED IN BOTH URSYS CLIENT and SERVER
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Messager = require('./class-messager');
const NetPacket = require('./class-netpacket');
const DateString = require('./util/datestring');
const Session = require('./util/session');
const Prompts = require('./util/prompts');

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  Messager,
  NetPacket,
  DateString,
  Session,
  Prompts
};
