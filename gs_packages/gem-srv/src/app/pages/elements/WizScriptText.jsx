/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptTextArea

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import 'lib/vendor/prism.css';
import 'lib/vendor/prism_extended.css';
import 'lib/css/prism_linehighlight.css'; // override TomorrowNight
import * as Prism from 'lib/vendor/prism';
import { CodeJar } from 'lib/vendor/codejar';
import * as WIZCORE from 'modules/appcore/ac-wizcore-tests';
import { ScriptToText } from 'modules/sim/script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ScriptText extends React.Component {
  constructor() {
    super();
    this.state = WIZCORE.State();
    this.jarRef = React.createRef();
    this.lastSelectedLine = -1;
    //
    this.handleWizUpdate = this.handleWizUpdate.bind(this);
    this.updateWizText = this.updateWizText.bind(this);
  }

  componentDidMount() {
    const highlight = editor => {
      Prism.highlightElement(editor);
    };
    const editor = this.jarRef.current;
    this.jar = CodeJar(editor, highlight);
    this.wizTimer = null;

    this.jar.onUpdate(text => {
      // do a delayed update
      if (this.wizTimer) clearInterval(this.wizTimer);
      this.wizTimer = setTimeout(() => {
        this.updateWizText(null, text);
        this.wizTimer = undefined;
      }, 500);
    });

    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
  }

  /** INCOMING: handle WIZCORE event updates */
  handleWizUpdate = vmStateEvent => {
    /// CARELESS UPDATE ///
    // this.setState(vmStateEvent);

    /// CAREFUL UPDATE ///
    const { script_tokens, sel_linenum, error } = vmStateEvent;
    //
    if (script_tokens) {
      const text = ScriptToText(script_tokens);
      this.setState({ script_text: text });
      this.jar.updateCode(text);
    }
    //
    if (sel_linenum !== undefined) {
      this.setState({ sel_linenum }, () => {
        if (sel_linenum > 0) {
          Prism.highlightElement(this.jarRef.current);
        } else {
          this.hideLineSelector();
        }
      });
    }

    // when there is an error, extract the error line from
    // the error status string
    if (error && error !== '') {
      console.log('error', error);
      const re = /@(\d+).*/;
      const errLine = Number(re.exec(error)[1]);
      if (errLine !== this.lastSelectedLine) {
        WIZCORE.SendState({ sel_linenum: errLine });
        this.lastSelectedLine = errLine;
      }
    }
  };

  hideLineSelector = () => {
    // style the line highlight div because plugin doesn't
    // seem to provide a way to turn it off
    const matches = document.getElementsByClassName('line-highlight');
    if (matches.length === 1) {
      matches[0].style = 'none';
    }
  };

  /** OUTGOING: send updated text to WIZCORE on change */
  updateWizText = (event, text) => {
    WIZCORE.WizardTextChanged(text);
  };

  // this render function is being called twice for some reason, maybe because
  // CodeJar has its own change handler that is causing rerender
  render() {
    const { script_text, sel_linenum } = this.state;
    return (
      <pre
        id="leftText"
        className="language-gemscript line-numbers match-braces"
        data-line={sel_linenum}
        style={{
          fontSize: '12px',
          lineHeight: 1,
          whiteSpace: 'pre-line'
        }}
      >
        <code
          id="codejar"
          ref={this.jarRef}
          style={{ width: '100%', height: 'auto' }}
        >
          {script_text}
        </code>
      </pre>
    );
  }
}
