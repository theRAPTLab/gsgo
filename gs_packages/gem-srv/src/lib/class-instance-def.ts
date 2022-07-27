// imports types from t-script.d and t-pool.d

class InstanceDef implements IPoolable {
  // poolable
  id: string; // enforce string for ids so numbers don't slip in
  // since GAgents share ids with vobj, dobj, and instanceDef
  // the id type needs to be consistent across them.
  refId?: any;
  _pool_id: any;
  // instanceDef
  blueprint: string;
  name?: string;
  initScript?: TScriptUnit[]; // is defined in TInstanceDef, but not used in sim-agents update
  valid: boolean;
  flag: number;
  x: number;
  y: number;

  constructor(id?: string) {
    this.init(id);
  }

  init(id?: string) {
    this.id = id;
    this.valid = false;
  }

  validate(flag: boolean) {
    this.valid = flag;
  }

  isValid(): boolean {
    return this.valid;
  }

  dispose() {}
}
export default InstanceDef;
