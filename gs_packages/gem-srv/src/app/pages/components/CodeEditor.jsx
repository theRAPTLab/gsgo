/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CodeEditor - A generalized codejar edit field.

  Use this to handle display and editing of gemscript.
  Initially the code is displayed in a static state.
  It provides three buttons for managing the edit: Edit, Save, Cancel.

  Clicking on the <Edit> button will enable editing.
  <Save> will call this.props.onSave and exit edit mode.
  <Cancel> will exit the edit mode and restore the original code.


  HOW TO USE IT
  -------------
  Use it like this:

    <CodeEditor code={script_text} onSave={this.SaveScript} />;

  where `this.SaveScript` is a function that handles saving the
  changed script data on the parent component, e.g.:

    SaveScript(data) {
      console.log('saveScript', data.code);
      // do something with the updated code in `data.code`
    }

  NOTE that `onSave` sends a data object `{ code }`;


  isDirty
  -------
  The "Save" button is only enabled if the code has changed.
  We keep track of the original code state, so if the user
  reverts their changes to the original state, the "Save" button
  is disabled.


  USAGE
  -----
  Currently this is used in:
    * InstanceEditor
  It can be used for Round Editing in the future.


  REVIEW
  ------
    * This duplicates some of the functionality of PanelScript.
      Should we rewrite PanelScript to use CodeEditor?
      (The problem is that we may not want the Edit/Save/Cancel buttons)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { GetAllKeywords } from 'modules/datacore';
import DialogConfirm from './DialogConfirm';

/// CODE EDIT + HIGHLIGHTING //////////////////////////////////////////////////
import * as Prism from '../../../lib/vendor/prism_extended';
import { CodeJar } from '../../../lib/vendor/codejar';
import '../../../lib/vendor/prism_extended.css';
import '../../../lib/css/prism_linehighlight.css'; // override TomorrowNight

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CODEEDITOR');
const DBG = false;

/// PRISM GEMSCRIPT DEFINITION ////////////////////////////////////////////////
const keywords = GetAllKeywords();
const keywords_regex = new RegExp(
  '\\b(' + keywords.reduce((acc, cur) => `${acc}|${cur}`) + ')\\b'
);
if (DBG) console.log(...PR('PRISM gemscript keywords', keywords_regex));
const types = ['Number', 'String', 'Boolean'];
const types_regex = new RegExp(
  '\\b(' + types.reduce((acc, cur) => `${acc}|${cur}`) + ')\\b'
);
if (DBG) console.log(...PR('PRISM gemscript types', types_regex));

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class CodeEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      isDirty: false,
      isBeingEdited: false,
      lineHighlight: undefined,
      origCode: ''
    };
    // codejar
    this.jarRef = React.createRef();
    this.jar = '';
    // The keys (keyword, namespace, inserted) map to token definitions in the prism css file.
    Prism.languages.gemscript = Prism.languages.extend('javascript', {
      'keyword': keywords_regex,
      'namespace': /^# \W*/gm, // multiline
      'inserted': types_regex
    });
    this.enableEditing = this.enableEditing.bind(this);
    this.disableEditing = this.disableEditing.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.stopEdit = this.stopEdit.bind(this);
    this.setDirty = this.setDirty.bind(this);
    this.doSave = this.doSave.bind(this);
    this.onConfirmSave = this.onConfirmSave.bind(this);
  }

  componentDidMount() {
    // initialize codejar
    const highlight = editor => {
      Prism.highlightElement(editor);
    };
    const editor = this.jarRef.current;
    this.jar = CodeJar(editor, highlight);
    this.jar.onUpdate(code => {
      this.text = code;
      const { origCode } = this.state;
      const isDirty = code !== origCode;
      this.setDirty(isDirty);
    });
    this.disableEditing(); // disable by default
  }

  componentWillUnmount() {
    this.jar.destroy();
  }

  enableEditing() {
    // locks codejar to prevent textchanges
    this.jarRef.current.setAttribute('contenteditable', 'plaintext-only');
  }
  disableEditing() {
    // unlocks codejar to allow text changes
    this.jarRef.current.setAttribute('contenteditable', 'false');
  }
  cancelEdit() {
    // restore original text
    const { origCode } = this.state;
    this.jar.updateCode(origCode);
    this.stopEdit();
  }
  startEdit() {
    const { code } = this.props;
    this.setState(
      {
        origCode: code,
        isBeingEdited: true
      },
      () => this.enableEditing()
    );
  }
  stopEdit() {
    this.setDirty(false);
    this.setState({ isBeingEdited: false }, () => this.disableEditing());
  }

  // never set `isDirty` directly, always use `setDirty`
  // so that parent components are informed of the change in status
  setDirty(isDirty, cb) {
    this.setState({ isDirty }, () => {
      const { onDirty } = this.props;
      onDirty(isDirty);
      if (typeof cb === 'function') cb();
    });
  }

  doSave() {
    const code = this.jar.toString();
    const { onSave } = this.props;
    onSave({ code });
    const isDirty = false;
    this.setDirty(isDirty, () => this.stopEdit());
  }

  // User response to DialogConfirmSave
  onConfirmSave(yesSave) {
    if (yesSave) {
      this.doSave();
    } else {
      // User clicked "Don't Save"
      // Equivalent of clicking "Cancel"
      this.cancelEdit();
      const { onSave } = this.props;
      onSave(); // tell parent that we're done
    }
  }

  render() {
    const { code, showConfirmSave, classes } = this.props;
    const { isDirty, isBeingEdited, lineHighlight } = this.state;

    const CancelBtn = (
      <button
        hidden={!isBeingEdited}
        className={classes.buttonSmall}
        onClick={this.cancelEdit}
      >
        Cancel
      </button>
    );
    const SaveBtn = (
      <button
        hidden={!isBeingEdited}
        disabled={!isDirty}
        className={classes.buttonSmall}
        onClick={this.doSave}
      >
        Save
      </button>
    );
    const EditBtn = (
      <button
        hidden={isBeingEdited}
        className={classes.buttonSmall}
        onClick={this.startEdit}
      >
        Edit
      </button>
    );

    const DialogConfirmSave = (
      <DialogConfirm
        open={showConfirmSave}
        message={`You have unsaved changes to the init script. Save changes?`}
        yesMessage="Save Changes"
        noMessage="Don't Save"
        onClose={this.onConfirmSave}
      />
    );

    return (
      <div>
        <pre
          className="language-gemscript line-numbers match-braces"
          data-line={lineHighlight}
          style={{
            fontSize: '10px',
            lineHeight: 1,
            whiteSpace: 'pre-line',
            backgroundColor: isBeingEdited ? '#2d2d2d' : '#000',
            cursor: isBeingEdited ? 'text' : 'default'
          }}
        >
          <code
            id="codejar"
            ref={this.jarRef}
            style={{ width: '100%', height: 'auto' }}
          >
            {code}
          </code>
        </pre>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {CancelBtn}
          {SaveBtn}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
          {EditBtn}
        </div>
        {DialogConfirmSave}
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(CodeEditor);
