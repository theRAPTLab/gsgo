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
List of Models in the system
`;
NOTES += MD.cblock(`
table:      modelName | group | class
            [create] [duplicate] [delete] [share]
`);

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const placeholder = function ModelList() {
  return (
    <WFComponent name={`${placeholder.name}`} summary={SUMMARY}>
      <MD>{NOTES}</MD>
    </WFComponent>
  );
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default placeholder;
