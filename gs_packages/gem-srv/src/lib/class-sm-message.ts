/* eslint-disable react/static-property-placement */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Message

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// import { IMessage, TMethod, TSMCProgram } from './t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MSG_COUNTER = 100;

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Parse the passed message string of form "CHANNEL:MessageName" and return
 *  array of "CHANNEL:", "MessageName".
 */
function GetMessageParts(msg: string): string[] {
  if (typeof msg !== 'string') throw Error(`NOT STR: ${msg}`);
  const bits: string[] = msg.split(':');
  if (bits.length === 0) throw Error(`BAD FMT =0: '${msg}'`);
  if (bits.length > 2) throw Error(`BAD FMT >3: '${msg}'`);
  if (!bits[1]) return ['*', bits[0]]; // 'msg'
  return [!bits[0] ? '*:' : `${bits[0]}:`, bits[1]]; // 'chan:msg'
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a stack machine message
 *  this implementation seems inefficient ...but just making it work for now
 */
export default class SM_Message implements IMessage {
  id: number;
  channel?: string;
  message?: string;
  inputs?: any;
  actions?: TMethod[]; // array of array of topcodes!
  context?: any;
  conseq?: TMethod;
  data?: object;
  //
  constructor(msg: string, init: IMessage) {
    this.id = MSG_COUNTER++;
    this.init(msg, init);
  }

  init(msg: string, init: IMessage) {
    const [channel, message] = GetMessageParts(msg);
    this.channel = channel;
    this.message = message;
    if (init.actions) this.actions = init.actions;
    if (init.inputs) this.inputs = init.inputs;
    if (init.context) this.data = init.context;
    this.data = init;
  }
}
/** export utility methods */
export { GetMessageParts };
