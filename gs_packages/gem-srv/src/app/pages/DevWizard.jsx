/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Wizard - Rendering Visual UI for Script Editing

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import '../../lib/css/gem-ui.css';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from './helpers/page-styles';
//
import { WizardText } from './elements/WizardText';
import { WizardView } from './elements/WizardView';
import * as WIZCORE from '../../modules/appcore/ac-wizcore';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestGraphics() {
  return (
    <div>
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
    this.updateWizToks = this.updateWizToks.bind(this);
    this.updateWizText = this.updateWizText.bind(this);
    this.handleTextInput = this.handleTextInput.bind(this);
  }

  componentDidMount() {
    console.log(...PR('root component mounted'));
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
    this.setState(vmStateEvent, () => {
      if (DBG) console.log('handleWizUpdate() completed', vmStateEvent);
    });
  };

  /** OUTGOING: send updated toks to WIZCORE on change */
  updateWizToks = () => {
    const { script_tokens } = this.state;
    WIZCORE.SendState({ script_tokens }, () => {
      if (DBG) console.log('updateWizToks() completed');
    });
  };
  /** OUTGOING: send updated text to WIZCORE on change */
  updateWizText = () => {
    const { script_text } = this.state;
    WIZCORE.SendState({ script_text }, () => {
      if (DBG) console.log('updateWizText() completed');
    });
  };

  /** route document clicks to WIZCORE dispatcher */
  handleDocClick = event => {};

  /** local textarea changes */
  handleTextInput = event => {
    const script_text = event.target.value;
    this.setState({ script_text }, this.updateWizText);
  };

  render() {
    const { classes } = this.props;
    const { script_page, sel_line_num, sel_line_pos } = this.state;
    const selText =
      sel_line_num < 0 ? 'no selection' : `${sel_line_num},${sel_line_pos}`;
    //
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: '50% auto',
          gridTemplateRows: '50px auto 50px',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>DEV/WIZARD</span>{' '}
          {UR.ConnectionString()}
        </div>

        <div
          id="console-left"
          className={clsx(
            classes.cell,
            classes.left,
            'language-gemscript',
            'line-numbers'
          )}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px',
            whiteSpace: 'pre',
            overflow: 'hidden',
            backgroundColor: '#2d2d2d'
          }}
        >
          <WizardText />
        </div>

        <div
          ref={this.boxRef}
          id="root-renderer"
          className={classes.main}
          style={{
            gridColumnEnd: 'span 1',
            display: 'inline-list-item',
            whiteSpace: 'nowrap',
            overflowY: 'scroll',
            overflowX: 'none'
          }}
        >
          <TestGraphics />
          <hr style={{ clear: 'left', marginTop: '60px' }} />
          <WizardView vmPage={script_page} />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          selection: {selText}
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(DevWizard);
