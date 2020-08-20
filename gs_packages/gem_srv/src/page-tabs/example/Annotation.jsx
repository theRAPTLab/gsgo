/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Annotate View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../../page-blocks/URLayout';
import { WF } from '../../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### ANNOTATION
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
function Agents() {
  const classes = useStyles();

  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed minWidth={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WF name="SimWorld" summary="" />
          <WF name="SimEventsFilter" summary="" />
          <WF name="AgentListFilter" summary="" />
          <WF name="InteractionListFilter" summary="" />
          <WF name="SessionTrackFilter" summary="" />
          <WF name="FilteredProps" summary="" />
          <WF name="AnotationSelection" summary="" />
          <WF name="AnotationControls" summary="" />
          <WF name="SessionStatus" summary="" />
          <WF name="SessionTrackSelector" summary="" />
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Agents;
