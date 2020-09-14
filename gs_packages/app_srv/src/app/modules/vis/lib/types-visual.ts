/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Visual System Typescript Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// POOLS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface I_PoolMappable {
  refId: any; // id referencing original (agentInstance)
  poolId: number; // refId is the original reference object
  dispose: () => void; // deallocate resources on destruction
  init: () => void; // reset the object to default state
  validate: (state: boolean) => void; // set validation state
  isValid: () => boolean; // is a valid pool item
}

/// VISUALS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface I_Visual {
  refId: any; // id referencing original (agentInstance)
  draw: () => void; // draw the visual
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface I_PoolOptions {
  Constructor: () => I_PoolMappable; // constructor to use
  size?: number; // size of initial array
  batchSize?: number; // number of elements to add when growing
  autoGrow?: boolean; // whether to automatically increase size or error out
}
