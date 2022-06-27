/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the root component for Wizard GUI Development

  It relies heavily on the appcore module WIZCORE to manage clicks and state.
  The goal is not to have any logic in the root component at all.

  The design of the GUI components are such that they all rely on WIZCORE to
  manage viewmodel state, which is React-friendly shallow objects.

  The component reads initial state from WIZCORE in the constructor, and also
  subscribes to WIZCORE state changes. Upon receiving a state change, the
  component calls its own setState() to cause rerendering.

  Likewise, when an event occurs on the document level it is 'dispatched' to the
  Dispatch Click Handler in WIZCORE, which can inspect the event to determine
  what action should be taken. Since WIZCORE holds both viewmodel state for the
  entire UI and has direct access to DATACORE modules, it can make the
  appropriate changes to data and then synchronize viewmodel state.

  Since all Wizard GUI components can subscribe to WIZCORE, they all update
  without props passing or other convoluted message handling. The trick is
  to write all components to work purely as state-driven dumb interfaces,
  as they should be.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as SIM from 'modules/sim/api-sim'; // DO NOT REMOVE
import * as PROJ_v2 from 'modules/datacore/dc-project-v2';
import * as BLUEPRINT_TESTER from 'test/test-blueprint';
import * as WIZCORE from 'modules/appcore/ac-wizcore';
import { VER_DEV_WIZ, ENABLE_SYMBOL_TEST_BLUEPRINT } from 'config/dev-settings';
import { ASSETDIR, DEV_PRJID, DEV_BPID } from 'config/gem-settings';
// edit mode components
import { ScriptTextPane } from './wiz/edit/ScriptTextPane';
import { ScriptViewPane } from './wiz/edit/ScriptViewPane';
import { ScriptEditPane } from './wiz/edit/ScriptEditPane';
// runtime mode components
// always-there components
import { ButtonConsole } from './wiz/ctrl/ButtonConsolePane';
// style objects
import { sGrid, sHead, sLeft, sRight, sFoot } from './wiz/SharedElements';
import { DevHeader } from './components/DevElements';
// css
import 'lib/vendor/pico.min.css';
import 'lib/css/gem-ui.css';

// SEE test-blueprint for the current test script set to load!!!

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

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

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** loads project, extract script text, and updates state through the provide
 *  STORE */
function m_LoadTestProjectData() {
  // check for override load to use built-in test script
  if (ENABLE_SYMBOL_TEST_BLUEPRINT) {
    console.log(
      `%cUsing TEST_SCRIPT because ENABLE_SYMBOL_TEST_BLUEPRINT is true...`,
      'background-color:rgba(255,255,0,0.15);color:red;padding:1em 2em'
    );
    const script_text = BLUEPRINT_TESTER.GetTestScriptText();
    WIZCORE.SendState({ script_text });
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
  WIZCORE.SendState(vmState);
  console.log(...PR(`loaded blueprint '${DEV_BPID}' from '${DEV_PRJID}'`));
  // BLUEPRINT_TESTER.TestValidate();
}

/// ROOT APPLICATION COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DevWizard extends React.Component {
  constructor() {
    super();
    this.state = WIZCORE.State();
    // bind methods that are called asynchronously
    this.handleWizUpdate = this.handleWizUpdate.bind(this);
  }

  componentDidMount() {
    if (DBG) console.log(...PR('root component mounted'));
    document.title = `DEV/WIZARD V.${VER_DEV_WIZ}`;
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    // add top-level click handler
    document.addEventListener('click', WIZCORE.DispatchClick);
    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
    m_LoadTestProjectData(WIZCORE);
  }

  componentWillUnmount() {
    WIZCORE.UnsubscribeState(this.handleWizUpdate);
  }

  /** INCOMING: handle WIZCORE event updates */
  handleWizUpdate(vmStateEvent) {
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    this.setState(vmStateEvent);
    // CAREFUL VERSION
    // const { script_page } = vmStateEvent;
    // if (script_page) this.setState({ script_page });
  }

  render() {
    const { sel_linenum, sel_linepos, script_page, dev_or_user } = this.state;
    const RightSide =
      dev_or_user === 0 ? (
        <ScriptEditPane selection={{ sel_linenum, sel_linepos }} />
      ) : (
        <ScriptTextPane />
      );
    return (
      <div id="gui-wizard" style={sGrid}>
        <DevHeader label="DEV/WIZARD" version={VER_DEV_WIZ} />
        <div style={sLeft}>
          <ScriptViewPane script_page={script_page} />
          {/* <ScriptUnitEditor /> */}
        </div>
        <div style={sRight}>{RightSide}</div>
        <footer style={sFoot}>
          &lt; Insert &quo;Submit to Server&quo; button here &gt;
          {/* <StatusFooter /> */}
          {/* <DBGValidateLine /> */}
        </footer>
        <ButtonConsole />
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default DevWizard;
