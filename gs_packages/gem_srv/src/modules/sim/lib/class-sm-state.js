/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine State
  ALU + SCOPE + STACK
  Passed to every SMC_OP for data flow

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Always return an array of values from mixed GVAR/literal value array
 */
function m_EnsureLiteralValues(arr) {
  return arr.map(val => val.values || val);
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement "processor state" that is passed between "opcode functions"
 */
class SMC_State {
  constructor() {
    this.reset();
  }

  /// STACK ARGUMENTS / RESULTS ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    this.stack = []; // data stack (gvars with value getter/setter)
    this.scope = []; // scope stack (obj with method() and prop())
    this.flags = {}; // calculation results flags
  }

  /// STACK ARGUMENTS / RESULTS ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Push arguments onto stack in preparation for running a program
   */
  stackPushArgs(...args) {
    this.stack.push(...args);
  }
  /** Get arguments from the stack. Returns removed arguments to caller.
   *  Defaults to a single argument
   */
  stackPopArgs(count = 1) {
    const args = [];
    for (let i = count; i > 0; i--) args.unshift(this.stack.pop());
    return args;
  }
  /** Return multiple values on the stack by passing values as
   *  argument list
   */
  stackPushResults(...vals) {
    vals.forEach(val => this.stack.push(val));
  }
  /** Return the stack after program runs, in case there are values on it.
   *  Empties the stack at the same time.
   */
  stackPopResults() {
    const results = [];
    for (let i = this.stack.length; i > 0; i--) results.unshift(this.stack.pop());
    return results;
  }

  /// STACK OPERATIONS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  stackPop() {
    return this.stack.pop();
  }
  stackPush(...val) {
    this.stack.push(...val);
  }
  stackPeek(depth = 0) {
    const index = this.stack.length - 1 - depth;
    return this.stack[index];
  }
  stackDupe() {
    this.stack.push(this.stack.peek());
  }
  stackToScope() {
    const temp = this.stack.pop();
    this.stack.push(this.scope.pop());
    this.scope.push(temp);
  }

  /// SCOPE OPERATIONS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  scopePop() {
    this.setFlags(this.scope.pop());
  }
  scopePush(scobj) {
    this.scope.push(scobj);
  }
  scope(depth = 0) {
    const index = this.scope.length - 1 - depth;
    return this.scope[index];
  }
  scopeToStack() {
    const temp = this.scope.pop();
    this.scope.push(this.stack.pop());
    this.stack.push(temp);
  }

  /// ALU OPERATIONS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  flagsSetFromValue(val) {
    if (typeof val === 'number') {
      this.flags.ZERO = val === 0;
      this.flags.NEG = val < 0;
    }
    this.flags.TRUE = !!val;
  }
  stackAdd() {
    const [a, b] = m_EnsureLiteralValues(this.stackPopArgs(2));
    this.stackPushResults(b + a);
  }
  stackSub() {
    const [a, b] = m_EnsureLiteralValues(this.stackPopArgs(2));
    this.stackPushResults(b - a);
  }
  stackMul() {
    const [a, b] = m_EnsureLiteralValues(this.stackPopArgs(2));
    this.stackPushResults(b * a);
  }
  stackDiv() {
    const [a, b] = m_EnsureLiteralValues(this.stackPopArgs(2));
    this.stackPushResults(b / a);
  }
}

/// CLASS EXPORT //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SMC_State;
