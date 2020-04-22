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
List of Agents in the system
`;
NOTES += MD.cblock(`
table:      agentName | interactions | lockedBy
`);

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const placeholder = function AgentList() {
  return (
    <WFComponent name={`${placeholder.name}`} summary={SUMMARY}>
      <MD>{NOTES}</MD>
    </WFComponent>
  );
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default placeholder;
