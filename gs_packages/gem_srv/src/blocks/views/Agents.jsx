/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../URLayout';
import AgentList from '../../components/AgentList';
import AgentPropPanel from '../../components/AgentPropPanel';
import ModelList from '../../components/ModelList';
import ViewModelPanel from '../../components/ViewModelPanel';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### AGENTS
* ${MD.cq('AgentList')}
* ${MD.cq('ModelList')}
* ${MD.cq('AddAgentBtn')}
* ${MD.cq('DelAgentBtn')}
* ${MD.cq('EditAgentBtn')}
* ${MD.cq('AgentPropPanel')}
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
          <ViewModelPanel />
          <ModelList />
          <AgentList />
          <AgentPropPanel />
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Agents;
