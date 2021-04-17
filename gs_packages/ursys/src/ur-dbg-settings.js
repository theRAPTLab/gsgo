/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server debug - centralized debugging utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = {
  init: true, // urnet initialization
  mesg: false, // urnet message logic
  sock: false, // socket logic
  calls: false, // message brokering
  reg: false, // message registration
  devices: false, // device connections
  cframe: false, // controlFrame data
  xact: false, // server-urnet mRouteMessage
  track: false, // step tracking system
  handle: false // check for unhandled messages
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DBG;
// server-wide debug flags
