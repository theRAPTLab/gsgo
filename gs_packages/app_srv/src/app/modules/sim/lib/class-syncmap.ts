/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SyncMap manages a set of 'derived objects' that are created from other
  'source objects'. The set of derived objects are created, updated,
  and removed to track the source objects.

  Both source and derived objects MUST implement I_Poolable, which mandates
  certain properties and methods to facilitate managing a Pool of objects.

  USAGE:

  const PTracker = new SyncMap('note',{ Constructor: DisplayObject });
  PTracker.setObjectHandlers({ onAdd, onUpdate, shouldRemove, onRemove });

  const entities = INPUT.GetEntities(); // returns array
  PTracker.syncFromArray(entities); // alternative: syncFromMap()

  const derived = PTracker.getSyncedObjects();

  NOTE: When

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Pool, { I_Poolable, I_PoolOptions } from '../../vis/lib/class-pool';
import MappedPool, {
  SyncFunctions,
  TestFunction,
  AddFunction,
  UpdateFunction,
  RemoveFunction,
  PoolableMap,
  PoolableArray
} from '../../vis/lib/class-mapped-pool';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SMAP');

interface ISyncResults {
  added: I_Poolable[];
  updated: I_Poolable[];
  removed: I_Poolable[];
}

/// NULL FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const f_NullAdd = (srcObj: I_Poolable, newObj: I_Poolable) => {};
const f_NullUpdate = (srcObj: I_Poolable, updobj: I_Poolable) => {};
const f_AlwaysTrue = (testObj: I_Poolable) => true;
const f_NullRemove = (remObj: I_Poolable) => {};

/// SYNCMAP CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  A SyncMap manages objects that are created by "syncing" to another
 *  Map or Asset of Poolable objects.
 */
class SyncMap {
  pool: Pool;
  map: MappedPool;

  constructor(poolName: string, poolOptions: I_PoolOptions) {
    // pool options have a Constructor at minimum
    this.pool = new Pool(poolName, poolOptions);
    // the default mapped pool uses null functions
    // the MappedPool handles id copying, so just copy special props
    this.map = new MappedPool(this.pool, {
      onAdd: f_NullAdd,
      onUpdate: f_NullUpdate,
      shouldRemove: f_AlwaysTrue,
      onRemove: f_NullRemove
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** "Object Handlers" are callbacks for derived objects that are added,
   *  updated, and removed. Used to copy/manipulate props of the derived object
   *  if necessary. Null handlers that don't do anything are provided by
   *  default.
   */
  setObjectHandlers(config: SyncFunctions) {
    this.map.setObjectHandlers(config);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Callback receives (sobj, dobj) for initializing and copying props
   *  to new dobj */
  onAdd(onAdd: AddFunction) {
    this.map.setObjectHandlers({ onAdd });
  }
  /** Callback receives (sobj, dobj) for copying props to dobj*/
  onUpdate(onUpdate: UpdateFunction) {
    this.map.setObjectHandlers({ onUpdate });
  }
  /** Callback receives (dobj) and returns true if it should be removed.
   *  This can be used to prevent derived objects from being removed immediately
   */
  shouldRemove(shouldRemove: TestFunction) {
    this.map.setObjectHandlers({ shouldRemove });
  }
  /** Callback receives (dobj) for cleaning up anything that might have to
   *  happen (Sprites deallocating textures, etc)
   */
  onRemove(onRemove: RemoveFunction) {
    this.map.setObjectHandlers({ onRemove });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Updates derived objects from source objects in map
   *  param: srcMap Map<id:number,obj:I_Poolable>
   *  return: { added,updated,removed } arrays
   *
   *  WARNING: some Maps used in the system are not organized by numeric id
   *  and object (e.g. AGENTS). In those cases, use syncFromArray() instead
   */
  syncFromMap(srcMap: PoolableMap) {
    return this.map.syncFromMap(srcMap);
  }
  /** Updates derived objects from an array of source objects
   *  param: sobjs I_Poolable[]
   *  return: { added,updated,removed } arrays
   */
  syncFromArray(sobjs: PoolableArray) {
    return this.map.syncFromArray(sobjs);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return all the objects that are in use, which are stored in pool
   *  that was passed to the mapped pool.
   */
  getSyncedObjects(): I_Poolable[] {
    return this.pool.getAllocated();
  }
  getSyncedIds(): number[] {
    return this.pool.getAllocatedIds();
  }
  hasSyncedId(objId: number): boolean {
    return this.pool.has(objId);
  }
  getSyncedObject(objId: number): I_Poolable {
    return this.pool.get(objId);
  }
  clearSyncedObjects(): void {
    this.pool.reset();
  }
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SyncMap;
