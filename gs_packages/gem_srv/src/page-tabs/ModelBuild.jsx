/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Build View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import { WF, RowWF, CellWF } from '../page-blocks/URWireframe';

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
            {/* ScriptEditor */}
            <CellWF name="ScriptEditor" summary="code stuff" />
            {/* AgentInterface */}
            <CellWF name="AgentInterface" summary="" expanded>
              <Row>
                <CellWF name="TrackingArea" summary="tracking area" />
                <CellWF name="NotTracked" summary="tracking area" />
              </Row>
              {/* LibraryControls */}
              <RowWF name="LibraryControls" expanded>
                <CellWF name="Button" />
                <CellWF name="Button" />
                <CellWF name="Button" />
              </RowWF>
            </CellWF>
            {/* end AgentInterface */}{' '}
          </Row>
          <RowWF name="ControlMode" summary="model control?" expanded>
            {/* control mode */}
            <CellWF name="Tracking" summary="active" />
            <CellWF name="Agent Int" summary="either" />
            <CellWF name="Agent Int" summary="active" />
            {/* end control mode */}
          </RowWF>
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
