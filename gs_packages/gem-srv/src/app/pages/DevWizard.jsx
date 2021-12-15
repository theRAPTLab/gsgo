/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Wizard - Rendering Visual UI for Script Editing

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from '../../modules/appcore/ac-wizcore';
import { WizardText } from './elements/WizardText';
import { WizardView } from './elements/WizardView';
import { WizardEdit } from './elements/WizardEdit';
//
import '../../lib/css/gem-ui.css';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

/// LAYOUT CSS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BG_COL = '#ddd';
const PAD = '10px';
const sParent = {
  display: 'grid',
  width: '100vw',
  height: '100vh',
  gridTemplateRows: 'auto 1fr auto',
  gridTemplateColumns: '50% auto' // force
};
const sHead = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};
const sLeft = {
  gridColumn: '1 / 2',
  // extra styling
  boxSizing: 'border-box',
  whiteSpace: 'pre',
  overflowY: 'scroll',
  overflowX: 'none',
  backgroundColor: '#2d2d2d'
};
const sRight = {
  gridColumn: '2 / 3',
  // extra styling
  padding: PAD,
  overflowY: 'scroll',
  overflowX: 'none'
};
const sFoot = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};
/// STYLING CSS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const sError = {
  textAlign: 'right',
  backgroundColor: 'red',
  color: 'white'
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Header(props) {
  const { label } = props;
  return (
    <header style={sHead}>
      <span style={{ fontSize: '32px' }}>{label}</span> {UR.ConnectionString()}
    </header>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** prototype SVG-based background styling of boxes */
function TestGraphics() {
  return (
    <div className="testGraphics">
      <div className="gunit gk0" />
      <div className="gunit gk">
        <div className="glabel">keyword</div>
      </div>
      <div className="gunit gk1" />
      <div className="gunit ga0" />
      <div className="gunit ga">
        <div className="glabel">assign</div>
      </div>
      <div className="gunit ga1" />
      <br />
      <hr style={{ clear: 'left', marginTop: '40px' }} />
    </div>
  );
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DevWizard extends React.Component {
  constructor() {
    super();
    this.boxRef = React.createRef(); // used for current box
    this.state = WIZCORE.State();
    // bind methods that are called asynchronously
    this.handleWizUpdate = this.handleWizUpdate.bind(this);
  }

  componentDidMount() {
    if (DBG) console.log(...PR('root component mounted'));
    document.title = 'DEV WIZARD';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer

    // add top-level click andler
    document.addEventListener('click', WIZCORE.DispatchClick);

    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
  }

  /** INCOMING: handle WIZCORE event updates */
  handleWizUpdate = vmStateEvent => {
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    this.setState(vmStateEvent);
    // CAREFUL VERSION
    // const { script_page } = vmStateEvent;
    // if (script_page) this.setState({ script_page });
  };

  render() {
    const { script_page, sel_line_num, sel_line_pos, error } = this.state;
    const selText =
      sel_line_num < 0 ? 'no selection' : `${sel_line_num},${sel_line_pos}`;
    //a
    return (
      <div id="gui-wizard" style={sParent}>
        <Header label="DEV/WIZARD" />
        <section style={sLeft}>
          <WizardText />
        </section>
        <section style={sRight}>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
              height: '100%'
            }}
          >
            <TestGraphics />
            <WizardView script_page={script_page} />
            <WizardEdit />
          </div>
        </section>
        <footer style={sFoot}>
          <div>selection: {selText}</div>
          <div style={sError}>{error}</div>
        </footer>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default DevWizard;
