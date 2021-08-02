/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  add console utilities to window object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TOOLS;
const HFUNCS = []; // stack of hfuncs in ur_handle, which
const PR = s => [
  `%c[DBGTOOL] ${s}%c`,
  'color:#000;background-color:yellow;padding:3px 5px;border-radius:2px;',
  'color:auto;background-color:auto;'
];
const DBG = false;

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add obj keys to window object, testing to make sure that it doesn't already
 *  exist in the window.UR object
 */
function addConsoleTool(obj) {
  if (typeof obj !== 'object')
    console.warn(...PR('addConsoleTool: invalid argument', obj));
  if (typeof window === 'undefined') {
    console.warn(
      ...PR('addConsoleTool: non-browser environment detected...aborted.')
    );
    return;
  }
  //---
  Object.entries(obj).forEach(kv => {
    let args;
    const [key, f] = kv;
    if (typeof f !== 'function')
      console.warn(...PR('addConsoleTool: key value must be function'));
    try {
      let parts = key.split('.');
      let prop = window;
      let info = '';
      parts.forEach((p, ii) => {
        // feedback
        const isLast = ii === parts.length - 1;
        info += `.${p}`;
        // assignment to next
        if (DBG) console.log(p, prop[p]);
        if (prop[p] === undefined) {
          if (!isLast) {
            prop[p] = {};
            if (DBG) console.log('adding', info);
          }
        } else if (isLast) throw Error(`window${info} not empty.`);

        if (isLast) prop[p] = f;
        prop = prop[p];
      });
      console.log(...PR(`installed window${info}()`));
    } catch (e) {
      console.warn(...PR(`addConsoleTool: ${e}`));
    }
  });
}

/// TEXT COMPARATOR ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** if fail, return a function to call to print results. if success,
 *  return value is undefined
 */
function consoleCompareTexts(text, ref) {
  let index = 0;
  let length = Math.max(text.length, ref.length);
  let comparison = '';
  // scan letter by letter
  while (index < length) {
    if (text.charAt(index) !== ref.charAt(index)) break;
    comparison += text.charAt(index++);
  }
  const endG = text.substring(comparison.length);
  const endE = ref.substring(comparison.length);
  const pass = comparison.length === text.length;
  if (pass) {
    return [
      pass,
      (testName = '') => {
        console.groupCollapsed(
          `%c${testName} passed`,
          'color:green;font-weight:100;background-color:HoneyDew;padding:4px;'
        );
        console.log(
          `OUTPUT\n%c${comparison}%c${endG}`,
          'background-color:LightYellow',
          'background-color:Yellow'
        );
        console.groupEnd();
      }
    ];
  }
  // didn't pass!
  return [
    pass,
    (testName = '') => {
      console.log(
        `%c${testName} match FAILED at index ${index}`,
        'color:red;padding:4px;background-color:MistyRose;font-weight:bold'
      );
      console.log(
        `%cOUTPUT: %c${text.charAt(index)}`,
        'color:red;padding:4px;',
        'padding:4px;background-color:Yellow'
      );
      console.log(
        `%cEXPECT: %c${ref.charAt(index)}`,
        'color:red;padding:4px;',
        'padding:4px;background-color:Cyan'
      );
      console.groupCollapsed(
        '%c[click to view]',
        'color:red;padding:4px;background-color:MistyRose;font-weight:100'
      );
      console.log(
        `OUTPUT\n%c${comparison}%c${endG}`,
        'background-color:LightYellow',
        'background-color:Yellow'
      );
      console.log(
        `REFERENCE\n%c${comparison}%c${endE}`,
        'background-color:LightCyan',
        'background-color:Cyan'
      );
      console.groupEnd();
    }
  ];
}

/// MESSAGE TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// legacy messager tests accessible from console...should move to own test
/// module
function addMessageHandlerTests(UR) {
  if (!UR.HandleMessage) {
    console.error(...PR('addConsoleToolHandlers: bad UR reference'));
    return;
  }
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
module.exports = { addConsoleTool, consoleCompareTexts };
