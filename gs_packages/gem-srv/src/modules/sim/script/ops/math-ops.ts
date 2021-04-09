/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Mathematics Stack Machine Operations
  see stack-ops.ts for description of stack machine

  Mathematics ops use RPN stack mathematics, returning the result
  on the stack.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IAgent, IState, TOpcode, TOpWait } from 'lib/t-script';

const DBG = false;

/// ARITHMETIC OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const add = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) + (b as number));
  };
};
const addImmediate = (num: number): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) + num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const sub = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((b as number) - (a as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const subImmediate = (num: number): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) - num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const mul = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) * (b as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const mulImmediate = (num: number): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) * num);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const div = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) / (b as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const divImmediate = (num: number): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) / num);
  };
};

/// BOUNDING OPERATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const abs = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push(Math.abs(a as number));
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { add, addImmediate, sub, subImmediate };
export { mul, mulImmediate, div, divImmediate };
export { abs };
