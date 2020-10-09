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

function TrackingPanel(props) {
  return (
    <CellWF name="TrackingControl" summary="pick an agent" expanded>
      <Row>
        <WF name="Tracking" summary="active" expanded>
          select agent type to use for people in trackerspace
        </WF>
        <WF name="Agent Int" summary="active" expanded>
          {`select agent type for 'agent control interface'`}
        </WF>
        <WF name="Agent Int" summary="either" expanded>{`???`}</WF>
      </Row>
    </CellWF>
  );
}

export default TrackingPanel;
