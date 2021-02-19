/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  server datacore - a pure data module

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// URNET DATA STRUCTURES /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOCKETS = new Map();
const MESSAGE_DICT = new Map(); // message map by uaddr
const SVR_HANDLERS = new Map(); // message map storing sets of functions
const NET_HANDLERS = new Map(); // message map storing other handlers

/// MUTABlE SHARED VALUES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { SOCKETS, MESSAGE_DICT, SVR_HANDLERS, NET_HANDLERS };
