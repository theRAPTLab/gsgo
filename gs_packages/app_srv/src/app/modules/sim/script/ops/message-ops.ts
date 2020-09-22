/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Conditions Stack Machine Operations
  see basic-ops.ts for description of stack machine

  These conditions work with the STATE FLAGS object, which sets a number
  of "registers" when a comparison is less-than, equal, or zero.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, TOpcode, TOpWait, IState } from '../../lib/t-smc';
import { GetMessageParts } from '../../lib/class-sm-message';

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentQueue = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const agentSend = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {};
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgMessage = (msg: string): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    console.log(GetMessageParts(msg));
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { agentQueue, agentSend };
export { dbgMessage };
