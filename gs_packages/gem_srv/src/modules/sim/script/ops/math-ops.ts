/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mathematics Stack Machine Operations
  see basic-ops.ts for description of stack machine

  Mathematics ops use RPN stack mathematics, returning the result
  on the stack.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { I_Agent, I_State, T_Opcode, T_OpWait } from '../../types/t-smc';

const DBG = false;

/// ARITHMETIC OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const add = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a, b] = STATE.popArgs(2);
    STATE.push((a as number) + (b as number));
  };
};
const addImmediate = (num: number): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a] = STATE.popArgs(1);
    STATE.push((a as number) + num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const sub = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a, b] = STATE.popArgs(2);
    STATE.push((b as number) - (a as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const subImmediate = (num: number): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a] = STATE.popArgs(1);
    STATE.push((a as number) - num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const mul = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a, b] = STATE.popArgs(2);
    STATE.push((a as number) * (b as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const mulImmediate = (num: number): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a] = STATE.popArgs(1);
    STATE.push((a as number) * num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const div = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a, b] = STATE.popArgs(2);
    STATE.push((a as number) / (b as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const divImmediate = (num: number): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a] = STATE.popArgs(1);
    STATE.push((a as number) / num);
  };
};

/// BOUNDING OPERATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const abs = (): T_Opcode => {
  return (agent: I_Agent, STATE: I_State): T_OpWait => {
    const [a] = STATE.popArgs(1);
    STATE.push(Math.abs(a as number));
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { add, addImmediate, sub, subImmediate };
export { mul, mulImmediate, div, divImmediate };
export { abs };
