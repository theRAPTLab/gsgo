/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TextView,
  View,
  Row,
  Cell,
  CellFixed,
  MD
} from '../page-blocks/URLayout';
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

function AnnotationPanel(props) {
  return (
    <CellWF
      name="AnnotationPanel"
      summary="list reflects current annotations by peers"
      expanded
    >
      <WFList name="Annotations">
        <WFCheckItem text="Nathan" />
        <WFCheckItem text="Kalani" />
        <WFCheckItem text="David" />
        <WFCheckItem text="Sara" />
      </WFList>
      <Row>
        <TextView>Various buttons to select annotation layers</TextView>
      </Row>
    </CellWF>
  );
}

export default AnnotationPanel;
