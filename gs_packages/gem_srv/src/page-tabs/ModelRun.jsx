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
            {/* Annotations */}
            <CellWF
              name="AnnotationControl"
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
                <CellWF name="ButtonAll" />
                <CellWF name="ButtonClear" />
              </Row>
            </CellWF>
            {/* AgentInterface */}
            <CellWF
              name="AgentInterface"
              summary="Used in both Edit and Run Mode"
              expanded
            >
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
              <WFChildRow name="PlaybackControls">
                <MD>{`

                `}</MD>
                <CellFixed width="100px">
                  <WF name="Rec" />
                  <WF name="Play" />
                </CellFixed>
                <Cell>
                  <WFSlider />
                </Cell>
              </WFChildRow>
              <WFChildStack
                name="AgentInspector"
                summary="floating panel?"
                expanded
              >
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
            </CellWF>
            {/* end AgentInterface */}
          </Row>
          {/* ControlMode */}
          <Row>
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
