/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Basic Script Commands, built from basic opcodes.

  These higher order functions perform

  A StackMachine opcode is a higher order function returning
  a function that receives an agent instance and a stack, scope, and
  conditions object. This function is the "compiled" output of the
  operation.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  Agent,
  T_Scopeable,
  T_Stackable,
  T_Opcode,
  T_OpWait
} from '../../types/t-stackmachine';
