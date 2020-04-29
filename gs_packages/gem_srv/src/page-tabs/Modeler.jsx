/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import { WF } from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### MODELER
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
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
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WF name="SimWorld" summary="" />
          <WF name="SimWorldActions" summary="" />
          <WF name="SimWorldInputs" summary="" />
          <WF name="AgentList" summary="" />
          <WF name="AgentListActions" summary="" />
          <WF name="AgentScriptEditor" summary="" />
          <WF name="AgentPropEditor" summary="" />
          <WF name="InteractionList" summary="" />
          <WF name="InteractionListActions" summary="" />
          <WF name="SelectedAgentProps" summary="" />
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Modeler;
