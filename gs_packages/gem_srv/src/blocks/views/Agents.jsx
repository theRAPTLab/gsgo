/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../URLayout';
import { WF, WFComponent } from '../URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### AGENTS
* ${MD.cq('???')}
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
WIP...need to remake these given the new objects/controls/modules breakdown.
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
        <CellFixed width={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WFComponent name="Hello" summary="fish balls">
            Hello there les mond
          </WFComponent>
          <WF name="Hello" summary="fish balls">
            Hello there les mond
          </WF>
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Agents;
