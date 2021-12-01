/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ScriptTextArea

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as Prism from '../../../lib/vendor/prism';
import { CodeJar } from '../../../lib/vendor/codejar';
import '../../../lib/vendor/prism.css';
import '../../../lib/vendor/prism_extended.css';
import '../../../lib/css/prism_linehighlight.css'; // override TomorrowNight
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class WizardText extends React.Component {
  constructor() {
    super();
    this.state = WIZCORE.State();
    this.jarRef = React.createRef();
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
    const { script_tokens, sel_line_num, error } = vmStateEvent;
    if (DBG && script_tokens) console.log('tokens updated');
    if (sel_line_num && sel_line_num > 0) {
      this.setState({ sel_line_num }, () => {
        Prism.highlightElement(this.jarRef.current);
      });
    }
    if (error && error !== '') {
      console.log('error', error);
      const re = /@(\d+).*/;
      const errLine = Number(re.exec(error)[1]);
      WIZCORE.SendState({ sel_line_num: errLine });
    }
  };

  /** OUTGOING: send updated text to WIZCORE on change */
  updateWizText = (event, text) => {
    WIZCORE.WizardTextChanged(text);
  };

  render() {
    const { script_text, sel_line_num } = this.state;
    return (
      <pre
        className="language-gemscript line-numbers match-braces"
        data-line={sel_line_num}
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
