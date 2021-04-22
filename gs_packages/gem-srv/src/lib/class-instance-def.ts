import { TScriptUnit } from 'lib/t-script.d';
import { IPoolable } from './t-pool.d';

class InstanceDef implements IPoolable {
  // poolable
  id: any;
  refId?: any;
  _pool_id: any;
  // instanceDef
  blueprint: string;
  name?: string;
  initScript?: TScriptUnit[]; // is defined in TInstance, but not used in sim-agents update
  valid: boolean;
  flag: number;
  x: number;
  y: number;

  constructor(id?: any) {
    this.init(id);
  }

  init(id?: any) {
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
