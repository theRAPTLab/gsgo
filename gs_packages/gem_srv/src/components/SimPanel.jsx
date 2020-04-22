/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { WFComponent, MD } from '../blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { cq } = MD;
let SUMMARY = '';
let NOTES = '';
NOTES += `
The ${cq('SimPanel')} component displays the active world
`;
NOTES += MD.cblock(`
<CODE BLOCK>
`);

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const placeholder = function SimPanel() {
  return (
    <WFComponent name={`${placeholder.name}`} summary={SUMMARY}>
      <MD>{NOTES}</MD>
    </WFComponent>
  );
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default placeholder;
