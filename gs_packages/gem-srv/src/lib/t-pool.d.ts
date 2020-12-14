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
  _pool_id: any; // used for fast pool lookup
  refId?: any; // optional local class instance counter
  dispose: () => void; // deallocate resources on destruction
  init: (id?: any) => void; // reset the object to default state
  validate: (state: boolean) => void; // set validation state
  isValid: () => boolean; // is a valid pool item
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IPoolOptions {
  Constructor: IPoolableConstructor; // constructor to use (class instance)
  name?: string; // name of pool (help with debug)
  size?: number; // size of initial array
  batchSize?: number; // number of elements to add when growing
  autoGrow?: boolean; // whether to automatically increase size or error out
}

/// MAPPED POOLS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type PoolableMap = Map<any, IPoolable>;
export type PoolableSet = Set<IPoolable>;
export type PoolableArray = IPoolable[];

export type TestFunction = (obj: any, active: Map<any, IPoolable>) => boolean;
export type AddFunction = (srcObj: IPoolable, newObj: IPoolable) => void;
export type UpdateFunction = (srcObj: IPoolable, updateObj: IPoolable) => void;
export type RemoveFunction = (removeObj: IPoolable) => void;

export interface MapFunctions {
  onAdd?: AddFunction;
  onUpdate?: UpdateFunction;
  shouldRemove?: TestFunction;
  onRemove?: RemoveFunction;
}

/// SYNCMAPS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface ISyncResults {
  added: IPoolable[];
  updated: IPoolable[];
  removed: IPoolable[];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface ISyncMap {
  setMapFunctions: (config: MapFunctions) => void;
  onAdd: (f: AddFunction) => void;
  onUpdate: (f: UpdateFunction) => void;
  onRemove: (f: RemoveFunction) => void;
  shouldRemove: (f: TestFunction) => void;
  syncFromMap: (srcMap: PoolableMap) => ISyncResults;
  syncFromArray: (sobjs: PoolableArray) => ISyncResults;
  mapObjects: () => void;
  getDeltaArrays: () => ISyncResults;
}
