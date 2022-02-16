/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit Unknown

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys';
import React from 'react';
import * as WIZCORE from '../../../modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('EditBox', 'TagRed');

/// COMPONENT HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the subcomponent receives props instead of directly accessing WizCore
 *  so it will rerender based on what it receives, rather than what it
 *  retrieves
 */
export function PlaceholderBox(props) {
  const { selection } = props;
  const { scriptToken: tok, lineNum, linePos, vmPageLine } = selection;
  console.log();
  const argtype = tok.kw_argtype || '<unknown argType>';
  // console.log('PlaceholderBox rendering:', tok);
  return (
    <form>
      Unimplemented Edit Box
      <br />
      <table>
        <tbody>
          <tr>
            <td>argtype</td>
            <td>{argtype}</td>
          </tr>
          <tr>
            <td>tok</td>
            <td>{JSON.stringify(tok)}</td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}
