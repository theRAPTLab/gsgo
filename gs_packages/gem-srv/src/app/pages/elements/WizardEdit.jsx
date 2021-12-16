/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WizardEdit is the edit box that appears when there is a valid selection
  of line and position in WIZCORE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Unimplemented(props) {
  const { selection } = props;
  const { token: tok, lineNum, linePos, tokenList } = selection;
  return (
    <form>
      <label forhtml="select">Unimplemented Edit Box</label>
      <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(tok)}</span>
    </form>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Keyword(props) {
  const { selection } = props;
  const { token: tok, lineNum, linePos, tokenList } = selection;
  const { lineStatement } = tokenList;
  const text = WIZCORE.GetLineScriptText(lineStatement);
  return (
    <form>
      <label forhtml="select">
        editing: <code>{text}</code> <br />
        <span style={{ fontSize: '1.5rem' }}>
          <strong>{tok.identifier}</strong> select new keyword?
        </span>
      </label>
      <select id="select" defaultValue={0} name="select" required>
        <option>Select…</option>
        <option>prop</option>
        <option>call</option>
        <option>if</option> <option>when</option> <option>onEvent</option>
      </select>
    </form>
  );
}

/// COMPONENT DEFINITION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return component if valid line, null otherwise. used by DevWizard */
export function WizardEdit(/* props */) {
  let content = null;
  const sel = WIZCORE.SelectedToken();
  if (sel) {
    const { token: tok, lineNum, linePos, tokenList } = sel;
    if (linePos === 1 && tok.identifier !== undefined)
      content = <Keyword selection={sel} />;
    else content = <Unimplemented selection={sel} />;
  }
  if (!content) return content;
  return (
    <div
      className="WizardEdit"
      onClick={event => WIZCORE.DispatchEditorClick(event)}
      style={{ backgroundColor: 'rgba(255, 166, 0, 0.10)', padding: '10px' }}
    >
      {content}
    </div>
  );
}
