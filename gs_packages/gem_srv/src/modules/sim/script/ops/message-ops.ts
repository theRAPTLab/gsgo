/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Conditions Stack Machine Operations
  see basic-ops.ts for description of stack machine

  These conditions work with the STATE FLAGS object, which sets a number
  of "registers" when a comparison is less-than, equal, or zero.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { I_Agent, T_Opcode, T_OpWait, I_State } from '../../types/t-smc';
import { GetMessageParts } from '../../lib/class-sm-message';

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentQueue = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentSend = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgMessage = (msg: string): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    console.log(GetMessageParts(msg));
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { agentQueue, agentSend };
export { dbgMessage };
