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
    STATE.flags.compareNumbers(a, b);
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
      agent.exec_smc(program, STATE.stack);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGT = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.GT()) {
      // alternate way to use a substack instead of passing existing
      const results: T_Stackable[] = agent.exec_smc(program);
      if (results.length) console.log('got stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifLTE = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    // if (STATE.flags.LTE()) console.log('run subuprogram', program);
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGTE = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.GTE()) {
      agent.exec_smc(program, STATE.stack);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifEQ = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    if (STATE.flags.EQ()) {
      agent.exec_smc(program, STATE.stack);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifNEQ = (program: T_Program): T_Opcode => {
  return (agent: T_Agent, STATE: T_State): T_OpWait => {
    //if (STATE.flags.NEQ()) console.log('run subuprogram', program);
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { clearCondition };
export { compareNumbers, compareStrings };
export { ifLT, ifLTE, ifGT, ifGTE, ifEQ, ifNEQ };
