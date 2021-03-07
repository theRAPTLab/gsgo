/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  add console utilities to window object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TOOLS;

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function addConsoleTools(UR) {
  const PR = UR.PrefixUtil('UR_DBG', 'TagRed');
  const { CallMessage, RaiseMessage, SendMessage } = UR;
  console.group(...PR('adding console debug tools'));

  TOOLS = {
    ur_call: (mesg = 'NET:HELLO', data = { type: 'call' }) => {
      console.log('ur_call(mesg, data) transaction');
      UR.CallMessage(mesg, data).then(rdata => {
        console.log('ur_call received data', rdata);
      });
      return `call() is calling ${mesg}...`;
    },
    ur_raise: (mesg = 'NET:HELLO', data = { type: 'signal' }) => {
      console.log('ur_raise(mesg, data) reflecting signal');
      RaiseMessage(mesg, data);
      return 'raise() is signalling to all implementors to NET:HELLO';
    },
    ur_send: (mesg = 'NET:HELLO', data = { type: 'publish' }) => {
      console.log('ur_send(mesg, data) non-reflecting send');
      SendMessage(mesg, data);
      return 'send() is sending to other implementors of NET:HELLO';
    },
    ur_reflect: (data = { type: 'reflect' }) => {
      if (typeof data === 'string') {
        console.log(`packaging string '${data}' as { data:'${data}' }`);
        data = { data };
      }
      CallMessage('NET:SRV_REFLECT', data).then(rdata => {
        console.log('NET:SRV_REFLECT returned', rdata);
      });
      return 'reflect() is calling NET:SRV_REFLECT...';
    },
    ur_services: () => {
      CallMessage('NET:SRV_SERVICE_LIST').then(data => {
        console.log('NET:SRV_SERVICE_LIST returned', data);
      });
      return 'services() is calling NET:SRV_SERVICE_LIST...';
    }
  };
  Object.entries(TOOLS).forEach(kv => {
    const [key, f] = kv;
    if (typeof window[key] !== 'undefined') return;
    console.log(`.. ${key}()`);
    window[key] = f;
  });
  console.groupEnd();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { addConsoleTools };
