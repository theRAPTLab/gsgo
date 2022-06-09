/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NOTE: THESE ARE EARLY EXAMPLES USED TO DESIGN THE SCRIPT ENGINE
  AND THEN IT TURNED OUT WE DIDN'T NEED THESE OPCODES AT ALL

  Stack Machine (SM) Debugging Opcodes

  These opcodes dare used to debug low level stack maching operations

  ---

  A StackMachine opcode is a higher order function returning
  a function that receives an agent instance and a stack, scope, and
  conditions object. This function is the "compiled" output of the
  operation.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DEBUG OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_dump(num: number, stack: any[], prompt: string) {
  num = num || 0;
  prompt = prompt || '<dump>';
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
export function dbgStack(num: number = 0, desc: string = 'stack') {
  return (agent: IAgent, STATE: IState): void => {
    const { stack } = STATE;
    u_dump(num, stack, desc);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function dbgStackCount(num: number, desc: string = 'dbgStackCount') {
  return (agent: IAgent, STATE: IState): void => {
    const slen = STATE.stack.length;
    if (slen !== num) throw Error(`stack.length !== ()`);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function dbgAgent(match?: string) {
  return (agent: IAgent): void => {
    if ((match && agent.name === match) || !match)
      console.log(`agent[${agent.name}] serialize:`, agent.serialize());
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement a pause */
export function dbgOut(...args: any) {
  return (): void => {
    console.log(...args);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement a pause */
export function nop() {
  return (): void => {};
}
