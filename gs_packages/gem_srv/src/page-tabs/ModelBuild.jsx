/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Build View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  View,
  Row,
  Cell,
  CellFixed,
  TextView,
  MD
} from '../page-blocks/URLayout';
import { WF, WFChildRow, CellWF } from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LEFT_SIDEBAR = `
### MODEL BUILDING
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/ModelBuild.jsx

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
            {/* ScriptEditor R1C1 */}
            <CellWF name="ScriptEditor" summary="code stuff" expanded>
              <TextView>{`drag-and-drop style "script wizard"`}</TextView>
            </CellWF>
            {/* AgentInterface R1C2 */}
            <CellWF name="AgentInterface" summary="" expanded>
              <Row>
                <CellWF name="TrackingArea" summary="tracking area" expanded>
                  This shows the representation of the world
                </CellWF>
                <CellWF name="NotTracked" summary="tracking area" expanded>
                  This might be a holding area for unused agents?
                </CellWF>
              </Row>
              {/* LibraryControls */}
              <WFChildRow name="LibraryControls" expanded>
                This is where you would load/save other agents
              </WFChildRow>
            </CellWF>
            {/* end AgentInterface */}
          </Row>
          {/* Controls R2C1 */}
          <Row>
            <Cell>
              <WF name="ControlMode" summary="model control?" expanded>
                <Row>
                  <Cell>
                    <TextView>I am not sure what this does</TextView>
                  </Cell>
                </Row>
                <Row>
                  <CellWF name="Tracking" summary="active" />
                  <CellWF name="Agent Int" summary="either" />
                  <CellWF name="Agent Int" summary="active" />
                </Row>
              </WF>
            </Cell>
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
