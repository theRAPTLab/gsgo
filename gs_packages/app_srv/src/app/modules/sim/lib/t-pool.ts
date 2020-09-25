/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Pool Typescript Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// POOLS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IPoolableConstructor {
  new (id?: number): IPoolable;
}
export interface IPoolable {
  id: any; // id referencing original (agentInstance)
  _pool_id: number; // used for fast pool lookup
  dispose: () => void; // deallocate resources on destruction
  init: (id?: number) => void; // reset the object to default state
  validate: (state: boolean) => void; // set validation state
  isValid: () => boolean; // is a valid pool item
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IPoolOptions {
  Constructor: IPoolableConstructor; // constructor to use (class instance)
  size?: number; // size of initial array
  batchSize?: number; // number of elements to add when growing
  autoGrow?: boolean; // whether to automatically increase size or error out
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface ISyncResults {
  added: IPoolable[];
  updated: IPoolable[];
  removed: IPoolable[];
}
