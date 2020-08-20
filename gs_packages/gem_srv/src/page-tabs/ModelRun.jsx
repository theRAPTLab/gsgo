/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Run/Playback View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
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
import AnnotationPanel from '../components/AnnotationPanel';
import AgentPanel from '../components/AgentPanel';
import TrackingPanel from '../components/TrackingPanel';
import InspectorPanel from '../components/InspectorPanel';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LEFT_SIDEBAR = `
### MODEL RUN
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/ModelRun.jsx

three choices:

1. Code adds agents, and then controls them
2. Place agents by dragging them in Agent area
3. Set general control mode; when someone walks in space they are the thing set to be tracking.

_wireframe based on [Joshua's Whimsical Wireframe](https://whimsical.com/KKQMf7UH6Cm3y9DGAhapV7)_
`;

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Modeler() {
  const classes = useStyles();
  const mode = 'run';
  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed minWidth={160}>
          {/* left side */}
          <MD>{LEFT_SIDEBAR}</MD>
        </CellFixed>
        <Cell>
          {/* right side */}
          <Row>
            <AnnotationPanel />
            <AgentPanel mode={mode} />
            <InspectorPanel mode={mode} />
          </Row>
          <Row>
            <TrackingPanel mode={mode} />
          </Row>
          <hr />
          <MD>{BOTTOM_NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Modeler;
