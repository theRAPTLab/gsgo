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
import { ScriptToText } from '../../modules/sim/script/transpiler-v2';
import { ProgramPrinter } from './components/ProgramPrinter';
import * as WIZCORE from '../../modules/appcore/ac-gui-mvvm';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('DEWIZ', 'TagApp');

/// cheeseball event handlers for testing
let M_STATE;
function m_SetStateUpdater(handler) {
  M_STATE = handler;
}
const HANDLE_SELECT = event => {
  const data = event.target.getAttribute('data');
  console.log(`selected ${data}`);
};
const HANDLE_TOK = (event, tok, settok, state) => {
  if (!Array.isArray(tok)) {
    console.log('handle tok', tok);
    const data = event.target.getAttribute('data');
    settok({ token: 'foo' });
    event.stopPropagation();
    if (M_STATE) M_STATE();
  } else {
    console.log('got a block', tok);
  }
};

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
    this.handleWIZCORE = this.handleWIZCORE.bind(this);
    this.updateWIZCORE = this.updateWIZCORE.bind(this);
  }

  componentDidMount() {
    document.title = 'DEV WIZARD';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer

    // add event handlers for root component
    document.addEventListener('click', this.handleClick);
    m_SetStateUpdater(this.handleWIZCORE); // this is the old handler

    // add a subscriber
    WIZCORE.SubscribeState(this.handleWIZCORE);
  }

  /** handle WIZCORE event updates */
  handleWIZCORE = (evt, state) => {
    // hack: just send the entire local state to WIZCORE to force
    // complete rerender
    const { script_tokens } = state;
    const script_text = ScriptToText(script_tokens);
    this.setState({ script_tokens, script_text }, () => {
      if (DBG) console.log('handleWIZCORE() completed');
    });
  };

  /** send state to WIZCORE */
  updateWIZCORE = () => {
    WIZCORE.SendState({ script_tokens: this.state.script_tokens }, () => {
      if (DBG) console.log('updateWIZCORE() completed');
    });
  };

  /** local click handling */
  handleClick = event => {
    // handle click-outside
    if (this.box && !this.box.current.contains(event.target)) {
      console.log('you just clicked outside of box!');
      return;
    }
    const data = event.target.getAttribute('data');
    console.log(`data clicked ${JSON.stringify(data)}`);
  };

  render() {
    const { classes } = this.props;
    const { script_tokens, script_text } = this.state;
    //
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: 'auto 720px',
          gridTemplateRows: '50px 720px auto',
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
          className={clsx(classes.cell, classes.left)}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px',
            whiteSpace: 'pre',
            overflow: 'hidden'
          }}
        >
          {script_text}
        </div>
        <div
          ref={this.box}
          id="root-renderer"
          className={classes.main}
          style={{
            width: '720px',
            height: '720px',
            gridColumnEnd: 'span 1',
            display: 'inline',
            whiteSpace: 'nowrap',
            overflow: 'scroll'
          }}
        >
          <TestGraphics />
          <hr style={{ clear: 'left', marginTop: '60px' }} />
          <ProgramPrinter
            program={script_tokens}
            updateHandler={this.updateWIZCORE}
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
