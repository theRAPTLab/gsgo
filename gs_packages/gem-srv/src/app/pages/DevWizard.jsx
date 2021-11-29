/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Wizard - Rendering shapes

  EVENT ROUTING - The React front-end just handles view state that is sent from
  appcore modules. It also reroutes view state changes to appcore modules.
  The primary way that this.setState() is called is if an appcore module
  fires a notification to it.

  <DevWizard>
  document.onClick ->   this.handleDocClick
                        checks the event target for top-level for out-of-box
                        selection, otherwise extracts data from clicked element
  TextArea.onChange ->  this.handleTextInput
                        reads text and sends to WIZCORE
  handleWizUpdate <-    main this.setState() handler, as we loop all events
                        through WIZCORE

  <ProgramPrinter>
  GToken.onClick ->     UPDATE_HANDLER()

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';
import '../../lib/css/gem-ui.css';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from './helpers/page-styles';
//
import { WizardView } from './elements/ProgramPrinter';
import * as WIZCORE from '../../modules/appcore/ac-wizcore';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
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
    document.addEventListener('click', this.handleDocClick);

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
    WIZCORE.SendState({ script_tokens: this.state.script_tokens }, () => {
      if (DBG) console.log('updateWizToks() completed');
    });
  };
  /** OUTGOING: send updated text to WIZCORE on change */
  updateWizText = () => {
    WIZCORE.SendState({ script_text: this.state.script_text }, () => {
      if (DBG) console.log('updateWizText() completed');
    });
  };

  /** local click handling */
  handleDocClick = event => {
    // handle click-outside
    if (this.boxRef && !this.boxRef.current.contains(event.target)) {
      if (DBG) console.log('you just clicked outside of box!');
      return;
    }
    const data = event.target.getAttribute('data');
    if (DBG) console.log(`data clicked ${JSON.stringify(data)}`);
  };

  /** local textarea changes */
  handleTextInput = event => {
    const script_text = event.target.value;
    this.setState({ script_text }, this.updateWizText);
  };

  render() {
    const { classes } = this.props;
    const { script_tokens, script_text } = this.state;
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
        <textarea
          id="console-left"
          className={clsx(classes.cell, classes.left)}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px',
            whiteSpace: 'pre',
            overflow: 'hidden'
          }}
          value={script_text}
          onChange={this.handleTextInput}
        />

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
          <WizardView vmPage={this.state.script_page} />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          console-bottom {this.state.DBGDRAW}
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(DevWizard);
