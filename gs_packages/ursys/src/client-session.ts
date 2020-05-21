/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CLIENT-SESSION centralizes shared data structures about the session.
  This is a pure data module that can be referenced by any URSYS client.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 *  @module ClientSession
 */

/// DEBUG  ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
interface NetProps {
  broker: MessageBroker;
}
interface MessageBroker {
  host: string;
  port: number;
  uaddr: string;
  urnet_version: number;
}

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let NET_BROKER: MessageBroker;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InitializeNetProps(props: NetProps) {
  if (DBG) console.log('info - setting netprops', props);
  const { broker } = props;
  NET_BROKER = broker;
  console.log('session broker', broker);
}
function GetNetBroker() {
  return NET_BROKER;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { InitializeNetProps, GetNetBroker };
