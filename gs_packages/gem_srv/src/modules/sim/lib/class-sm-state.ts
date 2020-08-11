import { I_State, T_Stackable, I_Scopeable, I_Comparator } from '../types/t-smc';
import SM_Comparator from './class-sm-comparator';

export default class SM_State implements I_State {
  stack: T_Stackable[]; // data stack (pass values in/out)
  scope: I_Scopeable[]; // scope stack (current execution context)
  flags: I_Comparator; // comparison flags set by ALU operations
  constructor(argStack: T_Stackable[] = [] as T_Stackable[]) {
    this.stack = argStack;
    this.scope = [];
    this.flags = new SM_Comparator();
  }
  peek(n: number = 0): T_Stackable {
    return this.stack[this.stack.length - 1 - n];
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
  push(...args: number[]): void {
    this.stack.push(...args);
  }
}
