/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Stack Machine (SM) Arithmetic/Logical Opcodes

  These opcodes emulate a simple stack-based microprocessor that can
  (1) set FLAGS based on the last loaded value (2) perform stack-based
  COMPARISONS which also set FLAGS (3) perform stack-based arithmetic.

  As these opcodes are executed one-after-the-other, they all share the same STATE
  and AGENT as shared memory, which is passed to each opcode function so they can
  read/mutate them.

  In practice, it's not necessary to use the stack to hold calculations
  with GEMscript through the more complicated KEYWORD functions that can call
  code anywhere in the system. However, these opcode serve as the example for
  how the machine works, and the availability of a stack can be helpful
  when executing a series of opcodes that rely on temporary variable
  storage on a stack without blindly writing to object properties in the
  agent .

  ---

  A StackMachine opcode is a higher order function returning
  a function that receives an agent instance and a stack, scope, and
  conditions object. This function is the "compiled" output of the
  operation.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  IAgent,
  IState,
  TOpcode,
  TOpWait,
  TSMCProgram,
  TStackable
} from 'lib/t-script';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function clearCondition(): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.flags.reset();
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function compareNumbers(): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    // if (b === 10) console.log(`${agent.name()} a:${a} b:${b}`);
    STATE.flags.compareNumbers(a as number, b as number);
    // console.log(STATE.flags.status());
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function compareStrings(): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [s1, s2] = STATE.pop(2);
    STATE.flags.compareStrings(s1.toString(), s2.toString());
  };
}

/// STACK OPCODES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** push object (usually a prop or agent) on stack */
export function push(gv: TStackable) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(gv);
  };
}
/** discard values from stack (default 1) */
export function pop(num: Number = 1) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    for (let i = 0; i < num; i++) STATE.stack.pop();
  };
}
/** duplicate top of stack */
export function dupe() {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.stack.push(STATE.peek());
  };
}

/// CONDITIONAL ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifLT(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.LT()) {
      // pass current stack as vars to program
      const results: TStackable[] = agent.exec(program, STATE.ctx);
      if (DBG) console.log('lt stack return', results);
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifGT(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.GT()) {
      // alternate way to use a substack instead of passing existing
      const results: TStackable[] = agent.exec(program, STATE.stack);
      if (DBG) console.log('gt stack return', results);
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifLTE(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.LTE()) {
      const results: TStackable[] = agent.exec(program, STATE.stack);
      if (DBG) console.log('lte stack return', results);
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifGTE(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.GTE()) {
      const results: TStackable[] = agent.exec(program, STATE.stack);
      if (DBG) console.log('gte stack return', results);
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifEQ(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.EQ()) {
      const results: TStackable[] = agent.exec(program, STATE.stack);
      if (DBG) console.log('eq stack return', results);
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function ifNEQ(program: TSMCProgram): TOpcode {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.NEQ()) {
      const results: TStackable[] = agent.exec(program, STATE.stack);
      if (DBG) console.log('neq stack return', results);
    }
  };
}

/// ARITHMETIC OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function add() {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) + (b as number));
  };
}
export function addImmediate(num: number) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) + num);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function sub() {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((b as number) - (a as number));
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function subImmediate(num: number) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) - num);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function mul() {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) * (b as number));
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function mulImmediate(num: number) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) * num);
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const div = (): TOpcode => {
  return function newFunctionName(agent: IAgent, STATE: IState) {
    const [a, b] = STATE.pop(2);
    STATE.push((a as number) / (b as number));
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function divImmediate(num: number) {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push((a as number) / num);
  };
}

/// BOUNDING OPERATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function abs() {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a] = STATE.pop(1);
    STATE.push(Math.abs(a as number));
  };
}
