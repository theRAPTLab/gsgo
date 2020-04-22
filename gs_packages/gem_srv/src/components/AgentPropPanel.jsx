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
This panel appears when an agent is selected, allowing the user to set
default properties and add/delete their own.
`;
NOTES += MD.cblock(`
defaults:   type | costume | color | location
user:       propname | value
            ---------------------------------
            [add property]
            [realtime display options]
`);

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const placeholder = function AgentPropPanel() {
  return (
    <WFComponent name={`${placeholder.name}`} summary={SUMMARY}>
      <MD>{NOTES}</MD>
    </WFComponent>
  );
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default placeholder;
