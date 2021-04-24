/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  add console utilities to window object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TOOLS;
const HFUNCS = []; // stack of hfuncs in ur_handle, which

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function addConsoleTools(UR) {
  const PR = UR.PrefixUtil('DEBUG', 'TagSystem');
  const { CallMessage, RaiseMessage, SendMessage } = UR;

  TOOLS = {
    // subscribe

    ur_handle: (mesg, hfunc) => {
      if (mesg === undefined) return 'arg1 must be a message string';
      if (typeof hfunc !== 'function') return 'arg2 must be a function';
      UR.HandleMessage(mesg, hfunc);
      HFUNCS.push({ mesg, hfunc });
      return `console-ur-message '${mesg.toUpperCase()}' declared`;
    },

    ur_handlers: () => {
      if (HFUNCS.length === 0)
        return 'no console-ur-message handlers have been declared';
      console.log('these are the currently-declared console-ur-message handlers');
      HFUNCS.forEach(entry => console.log(`.. '${entry.mesg.toUpperCase()}'`));
      return 'end of message list';
    },

    ur_unhandle: () => {
      if (HFUNCS.length === 0)
        return 'no console-ur-message handlers have been declared';
      console.log(
        `ur_unhandle purging ${HFUNCS.length} console-ur-message handlers...`
      );
      HFUNCS.forEach(entry => {
        const { mesg, hfunc } = entry;
        console.log(`.. deleting message handler for: '${mesg.toUpperCase()}'`);
        UR.UnhandleMessage(mesg, hfunc);
      });
      HFUNCS.splice(0, HFUNCS.length); // clear array
      return 'ur_unhandle complete';
    },

    // call test: transaction expects callback
    ur_call: (mesg = 'NET:HELLO', data = { testData: 'call' }) => {
      console.log('ur_call(mesg, data) transaction (returns promise)');
      return UR.CallMessage(mesg, data).then(rdata => {
        console.log('ur_call received data', rdata);
      });
    },

    // raise test: send message to all implementors regardless of origin
    ur_raise: (mesg = 'NET:HELLO', data = { testData: 'signal' }) => {
      console.log('ur_raise(mesg, data) reflecting signal');
      RaiseMessage(mesg, data);
      return 'raise() is signalling to all implementors to NET:HELLO';
    },

    // send test: send message to implementors that are not same as origin
    ur_send: (mesg = 'NET:HELLO', data = { testData: 'send' }) => {
      console.log('ur_send(mesg, data) non-reflecting send');
      SendMessage(mesg, data);
      return 'send() is sending to other implementors of NET:HELLO';
    },

    // server reflect test: send message to server which returns data
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

    // server service test: request service data
    ur_services: key => {
      CallMessage('NET:SRV_SERVICE_LIST').then(data => {
        const validKey = typeof key === 'string' && key.length > 0;
        let keyOut = '';
        if (validKey) {
          data = data[key] || `invalid key '${key}'`;
          keyOut += `prop[${key}] =`;
        }
        console.log(`NET:SRV_SERVICE_LIST returned ${keyOut}`, data);
      });
      return 'services() is calling NET:SRV_SERVICE_LIST...';
    },

    // client device directory (should be up-to-date automatically)
    ur_devicedir: () => UR.GetDeviceDirectory()
  };

  // add ur_* utilities to console
  console.groupCollapsed(...PR('adding UR console debug functions'));
  Object.entries(TOOLS).forEach(kv => {
    const [key, f] = kv;
    if (typeof window[key] !== 'undefined') return;
    console.log(`• ${key}()`);
    window[key] = f;
  });
  console.groupEnd();
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// invoked from SystemInit
function addConsoleToolHandlers(UR) {
  const PR = UR.PrefixUtil('UR_DBG', 'TagRed');
  if (!UR.HandleMessage) {
    console.error(...PR('addConsoleToolHandlers: bad UR reference'));
    return;
  }

  function f_process_message(data) {
    const { testData } = data;
    if (testData === undefined) {
      console.log('unexpected lack of data; aborting handler');
      return undefined;
    }
    if (testData === 'signal') {
      console.log("test 'raise signal'; no return of data");
      return undefined;
    }
    if (testData === 'send') {
      console.log("test 'send'; no return of data");
      return undefined;
    }
    if (testData === 'call') {
      const rData = { status: 'received' };
      console.log("test 'call', returning transaction data to caller", rData);
      return rData;
    }
    console.log('unknown testData condition, so no special handling');
    return undefined;
  }

  UR.ConsolePhaseInfo('addConsoleToolHandlers');

  UR.HandleMessage('NET:HELLO', data => {
    console.log('NET:HELLO handler received', data);
    return f_process_message(data);
  });

  UR.HandleMessage('LOCAL:SELF_HELLO', data => {
    console.log('LOCAL:SELF_HELLO handler received', data);
    return f_process_message(data);
  });
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = { addConsoleTools, addConsoleToolHandlers };
