/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../URLayout';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### AGENTS
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
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Agents;
