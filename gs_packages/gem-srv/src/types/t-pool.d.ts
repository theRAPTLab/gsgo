/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Pool Typescript Types

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

declare global {
  /// POOLS ///////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface IPoolableConstructor {
    new (id?: any): IPoolable;
  }
  interface IPoolable {
    id: any; // id referencing original (agentInstance)
    _pool_id: any; // used for fast pool lookup
    refId?: any; // optional local class instance counter
    dispose: () => void; // deallocate resources on destruction
    init: (id?: any) => void; // reset the object to default state
    validate: (state: boolean) => void; // set validation state
    isValid: () => boolean; // is a valid pool item
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface IPoolOptions {
    Constructor: IPoolableConstructor; // constructor to use (class instance)
    name?: string; // name of pool (help with debug)
    size?: number; // size of initial array
    batchSize?: number; // number of elements to add when growing
    autoGrow?: boolean; // whether to automatically increase size or error out
  }

  /// MAPPED POOLS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  type PoolableMap = Map<any, IPoolable>;
  type PoolableSet = Set<IPoolable>;
  type PoolableArray = IPoolable[];

  type TestFunction = (obj: any, allObjs?: Map<any, IPoolable>) => boolean;
  type AddFunction = (srcObj: IPoolable, newObj: IPoolable) => void;
  type UpdateFunction = (srcObj: IPoolable, updateObj: IPoolable) => void;
  type RemoveFunction = (removeObj: IPoolable) => void;

  interface MapFunctions {
    onAdd?: AddFunction;
    shouldAdd?: TestFunction;
    onUpdate?: UpdateFunction;
    shouldRemove?: TestFunction;
    onRemove?: RemoveFunction;
  }

  /// SYNCMAPS ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface ISyncResults {
    added: IPoolable[];
    updated: IPoolable[];
    removed: IPoolable[];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  interface ISyncMap {
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
}

/// EXPORT AS MODULE FOR GLOBALS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {};
