/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

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
import * as SIM from 'modules/sim/api-sim'; // load features
import * as WIZCORE from 'modules/appcore/ac-wizcore';
// import * as WIZCORE from 'modules/appcore/ac-wizcore';
// import { StyledTokenTest } from './elements/StyledExample';
import { ScriptText } from './wiz-components/WizScriptText';
import { ScriptView } from './wiz-components/WizScriptView';
import { ScriptContextor } from './wiz-components/WizScriptContextor';
import { DevValidateLine } from './wiz-components/elements/DevValidateLine';
import { StatusLine } from './wiz-components/WizStatusLine';
import { ScriptUnitEditor } from './wiz-components/WizScriptUnitEditor';
import { RuntimeScriptView } from './wiz-components/WizRuntimeScriptView';
import { RuntimeSimView } from './wiz-components/WizRuntimeSimView';
import { RuntimeSimTarget } from './wiz-components/WizRuntimeSimTarget'; //
import { ButtonConsole } from './wiz-components/WizButtonConsole';
import {
  sGrid,
  sHead,
  sLeft,
  sRight,
  sFoot
} from './wiz-components/wizard-style';

// import CSS straight into module, will appear as inline style
import 'lib/vendor/pico.min.css';
import 'lib/css/gem-ui.css';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** duplicate the old style from material-ui home.jsx */
function DevHeader(props) {
  const { label } = props;
  return (
    <header style={sHead}>
      <span style={{ fontSize: '32px' }}>{label}</span> {UR.ConnectionString()}
    </header>
  );
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
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
    document.title = 'DEV WIZARD';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    // add top-level click handler
    document.addEventListener('click', WIZCORE.DispatchClick);
    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
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
        <ScriptContextor selection={{ sel_linenum, sel_linepos }} />
      ) : (
        <ScriptText />
      );
    return (
      <div id="gui-wizard" style={sGrid}>
        <DevHeader label="DEV/WIZARD" />
        <div style={sLeft}>
          <ScriptView script_page={script_page} />
          {/* <ScriptUnitEditor /> */}
        </div>
        <div style={sRight}>{RightSide}</div>
        <footer style={sFoot}>
          <StatusLine />
          <DevValidateLine />
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
