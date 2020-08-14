/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Run/Playback View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import { WF, RowWF, CellWF } from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LEFT_SIDEBAR = `
### MODEL RUN
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/ModelRun.jsx

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
            <CellWF name="Annotations" expanded>
              <Row>
                <CellWF name="ButtonAll" />
                <CellWF name="ButtonClear" />
              </Row>
              <MD>{`
#### List of Annotations
* Nathan
* Kalani
* David
* Sara
                `}</MD>
            </CellWF>
            {/* AgentInterface */}
            <CellWF name="AgentInterface" summary="" expanded>
              <Row>
                <CellWF name="TrackingArea" summary="tracking area" />
                <CellWF name="NotTracked" summary="tracking area" />
              </Row>
              <RowWF name="PlaybackControls">
                <Cell>
                  <WF name="Rec" />
                  <WF name="Play" />
                </Cell>
                <CellWF name="Slider" />
              </RowWF>
            </CellWF>
            {/* end AgentInterface */}
          </Row>
          {/* ControlMode */}
          <Row>
            <CellWF name="ControlMode" summary="model control?" expanded>
              <Row>
                <CellWF name="Tracking" summary="active" />
                <CellWF name="Agent Int" summary="either" />
                <CellWF name="Agent Int" summary="active" />
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
