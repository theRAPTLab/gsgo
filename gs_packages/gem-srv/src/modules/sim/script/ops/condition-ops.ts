/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Conditions Stack Machine Operations
  see basic-ops.ts for description of stack machine

  These conditions work with the STATE FLAGS object, which sets a number
  of "registers" when a comparison is less-than, equal, or zero.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  IAgent,
  IState,
  TOpcode,
  TOpWait,
  TProgram,
  TStackable
} from 'lib/t-smc';

const DBG = false;

/// STATE FLAG OPERATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const clearCondition = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    STATE.flags.reset();
  };
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const compareNumbers = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const [a, b] = STATE.popArgs(2);
    // if (b === 10) console.log(`${agent.name()} a:${a} b:${b}`);
    STATE.flags.compareNumbers(a as number, b as number);
    // console.log(STATE.flags.status());
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const compareStrings = (): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    const val = STATE.pop();
    STATE.flags.checkZero(val as number);
  };
};

/// CONDITIONAL ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifLT = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.LT()) {
      // pass current stack as vars to program
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('lt stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGT = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.GT()) {
      // alternate way to use a substack instead of passing existing
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('gt stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifLTE = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.LTE()) {
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('lte stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifGTE = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.GTE()) {
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('gte stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifEQ = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.EQ()) {
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('eq stack return', results);
    }
  };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ifNEQ = (program: TProgram): TOpcode => {
  return (agent: IAgent, STATE: IState): TOpWait => {
    if (STATE.flags.NEQ()) {
      const results: TStackable[] = agent.exec_smc(program, STATE.stack);
      if (DBG) console.log('neq stack return', results);
    }
  };
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { clearCondition };
export { compareNumbers, compareStrings };
export { ifLT, ifLTE, ifGT, ifGTE, ifEQ, ifNEQ };
