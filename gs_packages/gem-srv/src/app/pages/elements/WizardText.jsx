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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class WizardText extends React.Component {
  constructor() {
    super();
    this.state = WIZCORE.State();
    this.jarRef = React.createRef();
    //
    this.handleWizUpdate = this.handleWizUpdate.bind(this);
  }

  componentDidMount() {
    const highlight = editor => {
      Prism.highlightElement(editor);
    };
    const editor = this.jarRef.current;
    this.jar = CodeJar(editor, highlight);
    this.jar.onUpdate(code => {
      this.setState({ script_text: code });
    });
    // add a subscriber
    WIZCORE.SubscribeState(this.handleWizUpdate);
  }

  /** INCOMING: handle WIZCORE event updates */
  handleWizUpdate = vmStateEvent => {
    this.setState(vmStateEvent, () => {});
  };

  render() {
    const { script_text, sel_line_num } = this.state;
    console.log('rendering', sel_line_num);
    return (
      <pre
        className="language-gemscript line-numbers match-braces"
        data-line={sel_line_num}
        style={{
          fontSize: '10px',
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
