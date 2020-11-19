import { IState, TStackable, IScopeable, IComparator } from './t-script';
import SM_Comparator from './class-sm-comparator';

export default class SM_State implements IState {
  stack: TStackable[]; // data stack (pass values in/out)
  scope: IScopeable[]; // scope stack (current execution context)
  ctx: { agent?: IScopeable };
  flags: IComparator; // comparison flags set by ALU operations
  constructor(argStack: TStackable[] = [] as TStackable[], ctx?: {}) {
    this.stack = argStack;
    this.scope = [];
    this.ctx = ctx;
    this.flags = new SM_Comparator();
  }
  peek(n: number = 0): TStackable {
    return this.stack[this.stack.length - 1 - n];
  }
  pop(): TStackable {
    return this.stack.pop();
  }
  popArgs(num: number = 1): TStackable[] {
    if (num > this.stack.length) throw Error('stack underflow');
    if (num === 0) throw Error('null stack operation with 0 num');
    const arr = [];
    for (let i = num; i--; i > 0) arr.unshift(this.stack.pop());
    return arr;
  }
  pushArgs(...args: number[]): void {
    this.stack.push(...args);
  }
}
