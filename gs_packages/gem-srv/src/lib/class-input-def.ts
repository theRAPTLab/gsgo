/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Used with SyncMaps to sync input data with agents.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IPoolable } from './t-pool.d';

class InputDef implements IPoolable {
  // poolable
  id: any;
  refId?: any;
  _pool_id: any;
  // inputDef
  bpname: string; // blueprint name
  name?: string;
  valid: boolean;
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
export default InputDef;
