/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Pool Typescript Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// POOLS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface I_Poolable {
  refId: any; // id referencing original (agentInstance)
  poolId: number; // refId is the original reference object
  dispose: () => void; // deallocate resources on destruction
  init: () => void; // reset the object to default state
  validate: (state: boolean) => void; // set validation state
  isValid: () => boolean; // is a valid pool item
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface I_PoolOptions {
  Constructor: () => I_Poolable; // constructor to use
  size?: number; // size of initial array
  batchSize?: number; // number of elements to add when growing
  autoGrow?: boolean; // whether to automatically increase size or error out
}
