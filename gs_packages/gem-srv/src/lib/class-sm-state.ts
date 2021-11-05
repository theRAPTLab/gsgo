import { IState, TStackable, IScopeable, IComparator } from './t-script';
import SM_Comparator from './class-sm-comparator';

export default class SM_State implements IState {
  stack: TStackable[]; // data stack (pass values in/out)
  scope: IScopeable[]; // scope stack (current execution context)
  ctx: { agent?: IScopeable; global?: IScopeable };
  flags: IComparator; // comparison flags set by ALU operations
  //
  constructor(argStack: TStackable[] = [], ctx?: any) {
    this.stack = argStack;
    this.scope = [];
    this.ctx = ctx;
    this.flags = new SM_Comparator();
  }
  peek(n: number = 0): TStackable {
    return this.stack[this.stack.length - 1 - n];
  }
  push(...args: any): void {
    if (Array.isArray(args)) this.stack.push(...args);
    else this.stack.push(args);
  }
  pop(num: number = 1): TStackable[] {
    if (num > this.stack.length) throw Error('stack underflow');
    if (num === 0) throw Error('null stack operation with 0 num');
    const arr = [];
    for (let i = num; i--; i > 0) arr.unshift(this.stack.pop());
    if (num === 1) return arr[0];
    return arr;
  }
  reset(): void {
    this.stack = [];
    this.scope = [];
    this.ctx = {};
    this.flags.reset();
  }
}
