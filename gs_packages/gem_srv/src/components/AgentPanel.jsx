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

import PlayPanel from './PlayPanel';
import LibraryPanel from './LibraryPanel';
import InspectorPanel from './InspectorPanel';

function NullPanel(props) {
  return <div>no panel mode</div>;
}

function AgentPanel(props) {
  const { mode } = props;
  let subpanel = <NullPanel />;
  if (mode === 'edit') subpanel = <LibraryPanel />;
  if (mode === 'run') subpanel = <PlayPanel />;

  return (
    <CellWF name="AgentPanel" summary="Used in both Edit and Run Mode" expanded>
      <MD>{`
Note: The Agent Interface has a number of functions:

* triggerable agent buttons ("poop", "flash color") for student control
* debug (multiple agents?)
* controls only one agent at a time per student
  `}</MD>

      <Row>
        <CellWF name="TrackingArea" summary="tracking area" expanded>
          Visual Model (tracked)
        </CellWF>
        <CellWF name="NotTracked" summary="tracking area" expanded>
          Visual Model (not tracked)
        </CellWF>
      </Row>
      {subpanel}
    </CellWF>
  );
}

export default AgentPanel;
