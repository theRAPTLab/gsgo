/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Debugging Stack Machine Operations
  see basic-ops.ts for description of stack machine

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, IState, TOpcode, TOpWait } from 'lib/t-smc';

/// DEBUG OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// support util functions ////////////////////////////////////////////////////
function u_dump(num: number = 0, stack: any[], prompt: string = '<dump>') {
  if (num === 0 || num > stack.length) {
    console.log(`${prompt}:`, stack);
    return;
  }
  const end = stack.length - 1;
  const arr = [];
  for (let i = num; i--; i > 0) arr.push(stack[end - i]);
  console.log(`${prompt}-top ${num}:`, arr);
}
/** Dump the current stack contents to console. Defaults to all.
 *  Optionally dump number of items to dump
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgStack = (num: number = 0, desc: string = 'stack'): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { stack } = STATE;
    u_dump(num, stack, desc);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgStackCount = (num: number, desc: string = 'dbgStackCount') => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const slen = STATE.stack.length;
    if (slen !== num) throw Error(`stack.length ${slen}!==${num} (${desc})`);
  };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Dump the current scope contents to console. Defaults to all.
 *  Optionally dump number of items to dump
 */
const dbgScope = (num: number = 0): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const { scope } = STATE;
    u_dump(num, scope, 'scope');
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dbgAgent = (match?: string): TOpcode => {
  return (agent: IAgent): TOpWait => {
    if ((match && agent.name() === match) || !match)
      console.log(`agent[${agent.name()}] serialize:`, agent.serialize());
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement a pause */
const dbgOut = (...args: any): TOpcode => {
  return (): TOpWait => {
    console.log(...args);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement a pause */
const nop = (): TOpcode => {
  return (): TOpWait => {};
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// debug opcodes
export { dbgStack, dbgScope, dbgAgent, dbgOut, nop, dbgStackCount };
