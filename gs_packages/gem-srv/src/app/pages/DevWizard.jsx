/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the root component for Wizard GUI Development

  It relies heavily on the appcore module WIZCORE to manage clicks and
  state. The goal is not to have any logic in the root component at all.

  The design of the GUI components are such that they all rely on WIZCORE
  to manage viewmodel state, which is React-friendly shallow objects.

  The component reads initial state from WIZCORE in the constructor,
  and also subscribes to WIZCORE state changes. Upon receiving a state
  change, the component calls its own setState() to cause rerendering.

  Likewise, when an event occurs on the document level it is 'dispatched'
  to the Dispatch Click Handler in WIZCORE, which can inspect the event to
  determine what action should be taken. Since WIZCORE holds both viewmodel
  state for the entire UI and has direct access to DATACORE modules, it can
  make the appropriate changes to data and then synchronize viewmodel state.

  Since all Wizard GUI components can subscribe to WIZCORE, they all update
  without props passing or other convoluted message handling. The trick is
  to write all components to work purely as state-driven dumb interfaces,
  as they should be.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as SIM from 'modules/sim/api-sim'; // load features
import * as WIZCORE from 'modules/appcore/ac-wizcore-tests';
// import * as WIZCORE from 'modules/appcore/ac-wizcore';
// import { StyledTokenTest } from './elements/StyledExample';
import { ScriptText } from './elements/WizardDevText';
import { ScriptView } from './elements/WizardScriptView';
import { ValidateLineBox } from './elements/WizardValidateLine';
import { StatusLine } from './elements/WizardStatusLine';
import { EditBox } from './elements/WizardEditBox';
import {
  sGrid,
  sHead,
  sLeft,
  sRight,
  sRightGrid,
  sFoot
} from './elements/wizard-style';

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
    const { script_page } = this.state;
    return (
      <div id="gui-wizard" style={sGrid}>
        <DevHeader label="DEV/WIZARD" />
        <ScriptText style={sLeft} />
        <div style={sRight}>
          <div style={sRightGrid}>
            <ScriptView script_page={script_page} />
            <EditBox />
          </div>
        </div>
        <footer style={sFoot}>
          <StatusLine />
          <ValidateLineBox />
        </footer>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default DevWizard;
