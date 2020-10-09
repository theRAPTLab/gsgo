/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import {
  WF,
  WFChildRow,
  CellWF,
  WFList,
  WFLabel,
  WFCheckItem,
  WFChildStack,
  WFSlider
} from '../page-blocks/URWireframe';

function InspectorPanel(props) {
  return (
    <WFChildStack name="InspectorPanel" summary="modes: edit, run" expanded>
      <MD>{`
* selecting an agent shows the properties
* during run mode, properties update in real time
* during edit mode, can edit initial values
  `}</MD>
      <Row>
        <Cell>
          <WFList name="name">
            <WFLabel text="Type" />
            <WFLabel text="Name" />
            <WFLabel text="Property" />
          </WFList>
        </Cell>
        <Cell>
          <WFList name="value">
            <WFLabel text="Squirrel" />
            <WFLabel text="Sammy" />
            <WFLabel text="12" />
          </WFList>
        </Cell>
      </Row>
    </WFChildStack>
  );
}

export default InspectorPanel;
