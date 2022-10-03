/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Used with SyncMaps to sync input data with agents.

  07-17-2022 TODO: some dangling mess from conforming bpid, bpname in other code
  but apparently not here in the data type declaration. We had settled this
  in the refactoring of ac-blueprints and project-server, but the revamp
  didn't make its way through input and render cores.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

class InputDef implements IPoolable {
  // poolable
  id: string; // match instanceDef, SM_Agent
  refId?: any;
  _pool_id: any;
  // inputDef hacks
  bpid?: string; // 07172022 - was called bpName, but no one uses it
  label?: string; // 07172022- was called name, but no one uses it
  valid: boolean;
  x: number;
  y: number;
  framesSinceLastUpdate: number;

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
export default InputDef;
