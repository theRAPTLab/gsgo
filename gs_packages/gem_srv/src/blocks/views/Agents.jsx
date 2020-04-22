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
View Model
* List of Agents: interactions (see INTERACTIONS PANEL)
* Add | Edit

Manage Models
* List of Models: group, class
* Create | Duplicate | Delete | Share
* Teacher flag to allow all other models

Agent List Interactions
* select agent: show PROPERTIES PANEL for editing
* only one person can edit an agent at a time
* multiple people can manipulate the same model

Agent Properties Panel
* default properties: type, costumes, color, location
* user defined: list of properties, add property
* display options for REALTIME PROPERTY DISPLAY
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
