/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Compiler - Script Parsing and Compiling

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import * as KEYDICT from 'modules/sim/script/keyword-dict';
import TESTKEYGEN from 'modules/tests/test-keygen';
import { parseToSource } from 'lib/util-source-parser';

// this is where classes.* for css are defined
import { useStylesHOC } from './page-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('COMPILER', 'TagBlue');
const HCON = UR.HTMLConsoleUtil('console-left');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const defaultSource = `
defTemplate Bee
defProp nectarAmount GSNumber 0
useFeature FishCounter
useFeature BeanCounter
endTemplate
defTemplate HoneyBee Bee
defProp honeySacks GSNumber 0
endTemplate
`.trim();

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class Compiler extends React.Component {
  constructor() {
    super();
    // prep
    this.state = { jsx: <div />, source: defaultSource };
    // bind
    this.dataUpdate = this.dataUpdate.bind(this);
    this.doReact = this.doReact.bind(this);
    this.updateText = this.updateText.bind(this);
    // hook
    UR.RegisterMessage('SCRIPT_UI_RENDER', this.dataUpdate);
  }

  componentDidMount() {
    document.title = 'GEMSTEP';
    // run test installed by converter.ts
    TESTKEYGEN.TestListSource();
    TESTKEYGEN.TestSourceToProgram();
    TESTKEYGEN.TestSourceToUI();
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    UR.UnregisterMessage('SCRIPT_UI_RENDER', this.dataUpdate);
  }

  dataUpdate(jsx) {
    console.log('update');
    this.setState({ jsx });
  }

  updateText(evt) {
    this.setState({ source: evt.target.value });
  }
  /**/
  /**/
  /**/
  /**/
  /**/
  doReact() {
    console.group(...PR('doreact'));
    //
    console.log('0. grab source from text field');
    //
    console.log('1. convert source to array of lines');
    const sourceStrings = this.state.source.split('\n'); // pc line endings would screw this
    // result is strings...need to break them into sourceLines [keyword, ...args]
    console.log('2. convert sourceStrings to sourceLines');
    const sourceLines = [];
    sourceStrings.forEach(str => {
      str = str.trim();
      if (str.length) sourceLines.push(parseToSource(str));
    });
    console.log('sourceLines', sourceLines);
    console.log('3. process array of sourceLines using KEYGEN.RenderSource');
    const jsx = KEYDICT.RenderSource(sourceLines);
    console.log('jsx', jsx);
    console.log('4. use KEYGEN to shove JSX into React side of things.');
    UR.RaiseMessage('SCRIPT_UI_RENDER', jsx);
    console.groupEnd();
  }
  /**/
  /**/
  /**/
  /**/
  /**/
  /**/

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root} style={{ gridTemplateColumns: '50% 50%' }}>
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>COMPILER/TEST</span>
        </div>
        <div id="console-left" className={clsx(classes.cell, classes.left)}>
          <h3>DEVELOPER TEST INPUT</h3>
          <textarea
            rows={20}
            style={{ boxSizing: 'border-box', width: '100%' }}
            defaultValue={this.state.source}
            onChange={this.updateText}
          />
          <button type="button" name="toReact" onClick={this.doReact}>
            Source To React
          </button>{' '}
          <button type="button" name="toSMC">
            Source To SMC
          </button>
        </div>
        <div id="console-right" className={clsx(classes.cell, classes.right)}>
          <h3>UI PROTO</h3>
          {this.state.jsx}
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          console-bottom
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(Compiler);
