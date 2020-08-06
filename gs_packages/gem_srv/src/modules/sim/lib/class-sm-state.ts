import { T_State, T_Stackable, T_Scopeable, T_Condition } from '../types/t-smc';
import SM_Condition from './class-sm-condition';

export default class SM_State implements T_State {
  stack: T_Stackable[]; // data stack (pass values in/out)
  scope: T_Scopeable[]; // scope stack (current execution context)
  flags: T_Condition; // condition flags
  constructor(argStack: T_Stackable[] = [] as T_Stackable[]) {
    this.stack = argStack;
    this.scope = [];
    this.flags = new SM_Condition();
  }
  peek(): T_Stackable {
    return this.stack[this.stack.length - 1];
  }
  pop(): T_Stackable {
    return this.stack.pop();
  }
  popArgs(num: number = 1): T_Stackable[] {
    if (num > this.stack.length) throw Error('stack underflow');
    if (num === 0) throw Error('null stack operation with 0 num');
    const arr = [];
    for (let i = num; i--; i > 0) arr.unshift(this.stack.pop());
    return arr;
  }
}
