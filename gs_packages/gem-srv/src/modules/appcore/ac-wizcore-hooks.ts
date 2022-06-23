import UR from '@gemstep/ursys/client';
import * as PROJ_v2 from 'modules/datacore/dc-project-v2';
import * as BLUEPRINT_TESTER from 'test/test-blueprint';
import { ENABLE_SYMBOL_TEST_BLUEPRINT } from 'config/dev-settings';
import { ASSETDIR, DEV_PRJID, DEV_BPID } from 'config/gem-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('WIZ-HOOKS', 'TagCyan');
const DBG = true;

/// MODULE STATE INITIALIZATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// this is a dependent store, so we do not initialize it with _inializeState()
/// the main WIZCORE will handle that for us, but we just want to hook up
/// our routing here first
const { StateMgr } = UR.class;
const STORE = new StateMgr('ScriptWizard');

/// PHASE MACHINE HOOKS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEFERRED CALL: LOAD_ASSETS will fire after module loaded (and above code)
UR.HookPhase('UR/LOAD_ASSETS', async () => {
  // return promise to hold LOAD_ASSETS until done
  console.log(
    `%cInitializing 'assets/${ASSETDIR}' as project source...`,
    'background-color:rgba(255,0,0,0.15);color:red;padding:1em 2em'
  );
  return PROJ_v2.LoadAssetDirectory(`/assets/${ASSETDIR}/`);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DEFERRED CALL: APP_CONFIGURE fires after LOAD_ASSETS (above) completes
UR.HookPhase('UR/APP_CONFIGURE', () => {
  // check for override load to use built-in test script
  if (ENABLE_SYMBOL_TEST_BLUEPRINT) {
    console.log(
      `%cUsing TEST_SCRIPT because ENABLE_SYMBOL_TEST_BLUEPRINT is true...`,
      'background-color:rgba(255,255,0,0.15);color:red;padding:1em 2em'
    );
    const script_text = BLUEPRINT_TESTER.GetTestScriptText();
    STORE.SendState({ script_text });
    // BLUEPRINT_TESTER.TestValidate();
    return;
  }

  // normal load
  const cur_prjid = DEV_PRJID;
  const cur_bpid = DEV_BPID;
  let out = `%cLooking for '${DEV_PRJID}.prj' with blueprint name '${DEV_BPID}' `;
  out += `in 'assets/${ASSETDIR}'...`;
  out += '%c\n\n';
  out += `If you see an error, check that ASSETDIR, DEV_PRJID, and DEV_BPID `;
  out += `are correctly defined in local-settings.json`;
  // This retrieves the uncompiled/unbundled bpDef object {name, scriptText} from gem proj
  console.log(
    out,
    'background-color:rgba(255,0,0,0.15);color:red;padding:1em 2em',
    'color:maroon',
    '\n\n'
  );
  const bp = PROJ_v2.GetProjectBlueprint(cur_prjid, cur_bpid);
  const { scriptText: script_text } = bp;
  const vmState = { cur_prjid, cur_bpid, script_text };
  STORE.SendState(vmState);
  console.log(...PR(`loaded blueprint '${DEV_BPID}' from '${DEV_PRJID}'`));
  // BLUEPRINT_TESTER.TestValidate();
});

/// DEPENDENCY LOADER /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** dummy export to allow module to load and initialize */
function LoadDependencies(PROMPTER = str => PR(str)) {
  console.log(...PROMPTER('loaded wizcore-hooks'));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadDependencies // test interface
};
