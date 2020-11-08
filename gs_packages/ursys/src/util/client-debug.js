/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  add console utilities to window object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TOOLS;

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function addConsoleTools(UR) {
  const PR = UR.PrefixUtil('URSYS DEBUG', 'TagRed');
  console.groupCollapsed(...PR('adding window debug tools'));

  TOOLS = {
    call: (mesg = 'NET:HELLO', data = { type: 'call' }) => {
      UR.NetCall(mesg, data).then(data => {
        console.log('NET:HELLO returned', data);
      });
      return 'call() is calling NET:HELLO...';
    },
    signal: (mesg = 'NET:HELLO', data = { type: 'signal' }) => {
      UR.NetSignal(mesg, data);
      return 'signal() is signalling to all implementors to NET:HELLO';
    },
    publish: (mesg = 'NET:HELLO', data = { type: 'publish' }) => {
      UR.SendMessage(mesg, data);
      return 'publish() is sending to other implementors of NET:HELLO';
    },
    reflect: (data = { type: 'reflect' }) => {
      if (typeof data === 'string') {
        console.log(`packaging string '${data}' as { data:'${data}' }`);
        data = { data };
      }
      UR.NetCall('NET:SRV_REFLECT', data).then(data => {
        console.log('NET:SRV_REFLECT returned', data);
      });
      return 'reflect() is calling NET:SRV_REFLECT...';
    },
    services: () => {
      UR.NetCall('NET:SRV_SERVICE_LIST').then(data => {
        console.log('NET:SRV_SERVICE_LIST returned', data);
      });
      return 'services() is calling NET:SRV_SERVICE_LIST...';
    }
  };
  Object.entries(TOOLS).forEach(kv => {
    const [key, f] = kv;
    if (typeof window[key] !== 'undefined') return;
    console.log(...PR(`.. window.${key}()`));
    window[key] = f;
  });
  console.groupEnd();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { addConsoleTools };
