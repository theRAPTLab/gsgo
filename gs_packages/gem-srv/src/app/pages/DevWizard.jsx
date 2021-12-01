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
    // EASY VERSION REQUIRING CAREFUL WIZCORE CONTROL
    this.setState(vmStateEvent);

    // CAREFUL VERSION
    // const { script_page } = vmStateEvent;
    // if (script_page) this.setState({ script_page });
  };

  render() {
    const { classes } = this.props;
    const { script_page, sel_line_num, sel_line_pos, error } = this.state;
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
          <div>selection: {selText}</div>
          <div
            style={{
              textAlign: 'right',
              backgroundColor: 'red',
              color: 'white'
            }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(DevWizard);
