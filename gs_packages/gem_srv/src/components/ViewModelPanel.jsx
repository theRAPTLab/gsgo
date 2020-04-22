/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  generated with wfcompo snippet
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { WFComponent, MD } from '../blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SUMMARY = '';
let NOTES = `
List of Agents with an Interactions Panel. Can add/edit movels?
_This is a bit unclear from the functional spec draft_
`;
NOTES += MD.cblock(`
<CODE BLOCK>
`);

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const placeholder = function ViewModelPanel() {
  return (
    <WFComponent name={`${placeholder.name}`} summary={SUMMARY}>
      <MD>{NOTES}</MD>
    </WFComponent>
  );
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default placeholder;
