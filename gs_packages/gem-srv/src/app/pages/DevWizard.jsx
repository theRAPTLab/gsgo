/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Wizard - Rendering shapes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React, { useState } from 'react';
import '../../lib/css/gem-ui.css';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { useStylesHOC } from './helpers/page-styles';
//
import { ProgramPrinter } from './components/ProgramPrinter';
import * as WIZCORE from '../../modules/appcore/ac-gui-mvvm';

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
    this.box = React.createRef(); // used for current box
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

    // add event handlers for root component
    document.addEventListener('click', this.handleClick);

    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
  }

  /** handle WIZCORE event updates */
  handleWizUpdate = (evt, vmState) => {
    this.setState(vmState, () => {
      if (DBG) console.log('handleWizUpdate() completed');
    });
  };

  /** send updated toks to WIZCORE on change */
  updateWizToks = () => {
    WIZCORE.SendState({ script_tokens: this.state.script_tokens }, () => {
      if (DBG) console.log('updateWizToks() completed');
    });
  };
  /** send updated text to WIZCORE on change */
  updateWizText = () => {
    WIZCORE.SendState({ script_text: this.state.script_text }, () => {
      if (DBG) console.log('updateWizText() completed');
    });
  };

  /** local click handling */
  handleClick = event => {
    // handle click-outside
    if (this.box && !this.box.current.contains(event.target)) {
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
          ref={this.box}
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
          <ProgramPrinter
            program={script_tokens}
            updateHandler={this.updateWizToks}
          />
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
