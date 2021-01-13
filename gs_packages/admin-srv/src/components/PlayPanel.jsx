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

function PlayPanel(props) {
  return (
    <WFChildRow name="PlaybackControls">
      <CellFixed width="100px">
        <WF name="Rec" />
        <WF name="Play" />
      </CellFixed>
      <Cell>
        <WFSlider />
      </Cell>
    </WFChildRow>
  );
}

export default PlayPanel;
