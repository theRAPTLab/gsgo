## GENERAL NOTES

* push/pop operations are always to data stack
* scope stack contains `scope` or `scoped` in the opcode name

## BASIC OPERATIONS

#### DATA STACK 

SMC uses a stack to hold parameters and results. Before you perform any calculation, you need to push the arguments onto the stack. They will be consumed by the method.

* `push(value)` - push a literal value (string, boolean, number) on stack
* `pushAgent()` - push the agent instance on the stack
* `pushAgentProp('prop')` - push the specified agent's property on the stack
* `pushAgentPropValue('prop')` - push the agent's property *value* on the stack
* `popAgentPropValue('prop')` - pop the top of stack into agent's property value.
* `pop(n)` - discard the top n elements in the stack
* `dupe()` - duplicate the top of the stack

#### DIRECT OBJECT MANIPULATION

* `setAgentPropValue('prop',value)` - directly set an agent's property value

#### STACK UTILITIES

Occasionally you may need to use a property or agent on the data stack
to call its methods (for example, an opcode that returns an agent
instance would return it on the data stack). 

* `stackToScope()` - move the top of the data stack to scope stack
* `scopeToStack()` - move the top of the scope stack to data stack

#### SCOPE STACK 

The scope stack is used for 'scoped' opcodes, which allows SMC to access the properties, methods, and functions of a particular agent, agent property, or feature. To define a scope, use these opcodes

* `agentToScope()` - push current agent on scope stack
* `agentPropToScope('prop')` - push current agent prop on scope stack
* `agentFeatureToScope('feature')` - push feature on scope stack
* `scopePop()` - remove the top element of scope stack

#### SCOPED INVOCATIONS

The top of the scope stack is used as the context for these property, method, and function invocations. 

* `scopedProp('prop')` - push scoped object's 'prop' on data stack
* `scopedPropValue('prop')` - push scoped object's 'prop' value on data stack
* `scopedMethod('method, args)` - invoke scoped object's method with args, receive results on data stack
* `scopedFunction('function',args)` - invoke a function defined directly on the scoped object (not stored in method dict), return results on data stack
* `scopedFunctionWithAgent('function',args)` - same as `scopedFunction()` but passes agent as first parameter

## CONDITION OPERATIONS

Conditions execute in three parts. First, two values to compare are pushed on the data stack. Then, the comparison sets various flags (zero, equal, less than) which are stored in SM_State's condition flag object. Lastly, a conditional opcode runs a SM_Program based on whether flags are set. The comparison flags remain set so you can run several condition opcodes in a row, until you reset it.

* `clearCondition()` - clear the condition state before doing a comparison
* `compareNumbers()` - compare [A, B] numbers on stack, changing the LT, EQ flags
* `compareStrings()` - compare [A, B] strings on stack, changing the EQ flags
* `ifLT(sm_program)` - if A < B run sm_program
* `ifLTE(sm_program)` - if A <= B run sm_program
* `ifGT(sm_program)` - if A > B run sm_program
* `ifGTE(sm_program)` - if A >= B run sm_program
* `ifEQ(sm_program)` - if A === B run sm_program
* `ifNEQ(sm_program)` - if A !== B run sm_program

## MATH OPERATIONS

Properties have functions that can perform many math operations on their values, like `add(value)`. These opcodes will do the math directly on the stack, which is useful when added values from agent.props and scoped.props

#### STACK ARITHMETIC

* `add(()` - pop [A B] from stack, push (A + B)
* `sub()` - pop [A B] from stack, push (A - B)
* `mul()` - pop [A B] from stack, push (A * `B)
* `div()` - prop [A B] from stack, push (A / B)
* `addImmediate(num)` - pop [A] from stack, push (A+num)
* `subImmediate(num)` - pop [A] from stack, push (A-num)
* `mulImmediate(num)` - pop [A] from stack, push (A*num)
* `divImmediate(num)` - pop [A] from stack, push (A/num)

#### SPECIAL FUNCTIONS

* `abs()` - pop [A], return Math.abs(A)

## WIP: MESSAGE OPERATIONS

Occasionally SMC needs to send a message. Agents can have messages invoked on them directly through `queueUpdate()`, `queueThink()`, and `queueExec()`.  

* `not implemented yet

#### TEMPLATE OPERATIONS

SMC can define both props and features on the current agent instance. This is used during **agent creation** `time, before any initial prop values are set.

* `addProp('prop', Constructor)` - property name 'prop' is assigned the object created by a `new Constructor()` call
* `addfeature('feature')` - the feature named 'feature' is added to the agent, which then decorates the agent with additional properties stored i `props[feature]`.

