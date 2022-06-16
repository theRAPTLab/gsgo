/* eslint-disable react/no-unescaped-entities */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is the root component for Unit Testing

  While our test suites are no longer working, this will be the way we
  run them until we get a real test system working.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

/// RUN UNIT TESTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// import 'test/unit-script-parser'; // test script parser
// import 'test/unit-expr-parser'; // test parser evaluation
// import 'test/unit-keywords'; // test individual keywords
// import 'test/unit-compiler'; // test compiler
// import 'test/unit-script-runtime'; // test runtime keyword functions
import * as TEST_SYMBOLS from 'test/x-symbol-tests';
import * as WIZUTIL from 'modules/appcore/ac-wizcore-util';

// style objects
import { sGrid, sHead, sLeft, sRight, sFoot } from './wiz/SharedElements';
// css
import 'lib/vendor/pico.min.css';
import 'lib/vendor/xterm.css';
import 'lib/vendor/xterm';

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('CODE TEST', 'TagApp');

UR.HookPhase('UR/APP_CONFIGURE', () => {
  // check for override load to use built-in test script
  console.log(
    `%cUsing TEST_SCRIPT because ENABLE_SYMBOL_TEST_BLUEPRINT is true...`,
    'background-color:rgba(255,255,0,0.15);color:red;padding:1em 2em'
  );
  const script_text = TEST_SYMBOLS.GetTestScriptText();
  // TEMPORARY TEST
  WIZUTIL.TestScriptToEditableTokens(script_text);
  // TEST_SYMBOLS.TestValidate();
});

/// LOCAL COMPONENTS //////////////////////////////////////////////////////////
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

/// ROOT APPLICATION COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DevCodeTester extends React.Component {
  constructor(props) {
    super(props);
    this.terminalRef = React.createRef();
  }

  componentDidMount() {
    if (DBG) console.log(...PR('root component mounted'));
    document.title = 'DEV TESTS';
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    const terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(this.terminalRef.current);
    // fitAddon.fit();
    this.term = terminal;
    this.term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m\n\r');
  }

  render() {
    const styles = { ...sGrid, gridTemplateColumns: '25% 75%' };
    return (
      <div id="code-tester" style={styles}>
        <DevHeader label="DEV/CODE TEST" />
        <div style={{ padding: '1em' }}>
          <p style={{ fontSize: '2em' }}>
            <strong>Sri&#39;s Janky Unit Tester</strong>
          </p>
          <p style={{ fontWeight: 'bold', color: 'maroon' }}>
            Open the Javascript Console to see Test Results!
          </p>
        </div>
        <div style={{ padding: '1.5em' }}>
          <p>
            This is a placeholder app for when we start to add more working tests;{' '}
            <strong>none of the unit tests are working</strong> due to changes in
            the system over the past year.
          </p>
          <pre>
            <code>
              {`  // IMPORTS
  import 'test/unit-script-parser';  // test script parser
  import 'test/unit-expr-parser';    // test parser evaluation
  import 'test/unit-compiler';       // test compiler
  import 'test/unit-script-runtime'; // test runtime keyword functions
  import 'test/unit-keywords';       // test individual keywords`}
            </code>
          </pre>
          <div id="terminal" ref={this.terminalRef}></div>
        </div>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default DevCodeTester;
