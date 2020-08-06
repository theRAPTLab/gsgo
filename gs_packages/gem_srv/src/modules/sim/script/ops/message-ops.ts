/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Conditions Stack Machine Operations
  see basic-ops.ts for description of stack machine

  These conditions work with the STATE FLAGS object, which sets a number
  of "registers" when a comparison is less-than, equal, or zero.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  T_Agent,
  T_Opcode,
  T_OpWait,
  T_Program,
  T_State,
  T_Stackable
} from '../../types/t-smc';
import T_Message, { GetMessageParts } from '../../lib/class-sm-message';

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentQueue = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentSend = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgMessage = (msg: string): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    console.log(GetMessageParts(msg));
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { agentQueue, agentSend };
export { dbgMessage };
