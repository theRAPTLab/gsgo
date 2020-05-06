/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  System Home View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import { WF } from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### SYSTEM HOME
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
* On initial load, only WELCOME and OBSERVE tabs are enabled.
LoginStatus and Login are always visible
* On successful login, the SESSIONS and IMAGES are enabled, but
MODEL/SIM/ANNOTATE are inactive until a session is loaded.
OBSERVE tab becomes ANNOTATE.

## May 6 2020
after talking through some initial UI/UX stuff for student-facing experience,
I'm thinking of focusing on layout of to just flesh things out.
* AgentList
* AgentPropertyPanel
* InstanceAgentProperty Popup
* WorldView
`;

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SystemHome() {
  const classes = useStyles();

  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed minWidth={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WF name="LoginStatus" summary="shows logged in" />
          <WF name="Login" summary="" />
          <WF name="ClassroomInfo" summary="" />
          <WF name="GroupInfo" summary="" />
          <WF name="StudentInfo" summary="" />
          <WF name="ConnectionStatus" summary="" />
          <WF name="ProjectInfo" summary="" />
          <WF name="TeacherMessage" summary="" />
          <WF name="WelcomeHelp" summary="" />
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemHome;
