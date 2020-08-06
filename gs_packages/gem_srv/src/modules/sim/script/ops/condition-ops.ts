/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Conditions Stack Machine Operations
  see basic-ops.ts for description of stack machine

  These conditions work with the STATE FLAGS object, which sets a number
  of "registers" when a comparison is less-than, equal, or zero.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  T_Agent,
  T_State,
  T_Opcode,
  T_OpWait,
  T_Program,
  T_Stackable
} from '../../types/t-smc';

const DBG = false;

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const clearCondition = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    STATE.flags.reset();
  };
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const compareNumbers = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const [a, b] = STATE.popArgs(2);
    // if (b === 10) console.log(`${agent.name()} a:${a} b:${b}`);
    STATE.flags.compareNumbers(a as number, b as number);
    // console.log(STATE.flags.status());
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const compareStrings = (): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    const val = STATE.pop();
    STATE.flags.checkZero(val as number);
  };
};

/// CONDITIONAL ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifLT = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.LT()) {
      // pass current stack as vars to program
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('lt stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGT = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.GT()) {
      // alternate way to use a substack instead of passing existing
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('gt stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifLTE = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (!STATE.flags.GT()) {
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('lte stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGTE = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.LT()) {
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('gte stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifEQ = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.EQ()) {
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('eq stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifNEQ = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.NEQ()) {
      const results: T_Stackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('neq stack return', results);
    }
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { clearCondition };
export { compareNumbers, compareStrings };
export { ifLT, ifLTE, ifGT, ifGTE, ifEQ, ifNEQ };
