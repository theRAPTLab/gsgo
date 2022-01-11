/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EditKeyword

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';
import { sButtonGrid, sButtonBreak } from './wizard-style';

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function KeywordBox(props) {
  const { selection } = props;
  const { scriptToken: tok, lineNum, linePos, vmTokens } = selection;
  const { lineStatement } = vmTokens;
  const text = WIZCORE.GetLineScriptText(lineStatement);
  const args = tok._args.join(', ');
  const sDel = { ...sButtonBreak, minWidth: '25%', maxWidth: '25%' };
  const sRTL = { ...sButtonGrid, direction: 'rtl' };
  return (
    <>
      <form>
        <table>
          <tbody>
            <tr>
              <td>selected</td>
              <td>{text}</td>
            </tr>
            <tr>
              <td>args</td>
              <td>{args}</td>
            </tr>
          </tbody>
        </table>
        <div style={sButtonGrid}>
          <button type="button" value="move">
            MOVE UP
          </button>
          <button type="button" value="move">
            MOVE DOWN
          </button>
          <button type="button" value="ins_before">
            INS ABOVE
          </button>
          <button type="button" value="ins_after">
            INS BELOW
          </button>
        </div>
        <button
          type="button"
          value="del"
          style={{
            flexDirection: 'column-reverse',
            marginLeft: 'auto',
            width: '100px',
            backgroundColor: 'red'
          }}
        >
          DELETE
        </button>
      </form>
      <p>
        Note: you can not change a keyword once it is set, because that could
        invalidate entire nested blocks of code. Instead, we will allow either
        moving a keyword + its statements/nested statements by dragging it, or
        deleting it, or inserting a line.
      </p>
    </>
  );
}
