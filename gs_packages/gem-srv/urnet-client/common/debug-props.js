/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server debug - centralized debugging utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = {
  init: true, // urnet initialization
  mesg: true, // urnet message logic
  sock: true, // socket logic
  calls: true, // message brokering
  reg: true, // message registration
  devices: true, // device connections
  controller: false, // controller returned from device subs
  cframe: false, // controlFrame data
  xact: false, // server-urnet mRouteMessage
  track: false, // step tracking system
  handle: false // check for unhandled messages
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DBG;
// server-wide debug flags
