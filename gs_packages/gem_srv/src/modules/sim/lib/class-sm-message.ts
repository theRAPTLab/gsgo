/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine Message

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { T_Opcode, T_Message } from '../types/t-smc';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BADMSG_ERR = 'message must be string; got';
const BADFMT_ERR = 'invalid message format; got';
//
let MSG_COUNTER = 100;

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Parse the passed message string of form "CHANNEL:MessageName" and return
 *  array of "CHANNEL:", "MessageName".
 */
function GetMessageParts(msg: string): string[] {
  if (typeof msg !== 'string') throw Error(`${BADMSG_ERR} ${msg}`);
  const bits: string[] = msg.toUpperCase().split(':');
  if (bits.length !== 2) throw Error(`${BADFMT_ERR}: '${msg}'`);
  if (!bits[1]) throw Error(`${BADFMT_ERR}: '${msg}'`);
  return [!bits[0] ? '*:' : `${bits[0]}:`, bits[1]];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** representation of a stack machine message
 */
export default class SM_Message implements T_Message {
  id: number;
  channel: string;
  message: string;
  data: {
    program?: T_Opcode[];
    error?: string;
  };
  constructor(msg: string, data = {}) {
    this.id = MSG_COUNTER++;
    const [channel, message] = GetMessageParts(msg);
    this.channel = channel;
    this.message = message;
    this.data = data;
  }
}
/** export utility methods */
export { GetMessageParts };
