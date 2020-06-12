/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  System Home View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import UR from '@gemstep/ursys/client';
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
  const [note, setNote] = useState('');
  function handleButton(e) {
    console.groupCollapsed('>>> ASYNC CALL "HELLO_URSYS"');
    UR.Call('HELLO_URSYS', { value: 'cats' }).then(data => {
      console.groupEnd();
      console.groupCollapsed('>>> ASYNC CALL "HELLO_URSYS" COMPLETE');
      let out = 'got aggregated data:';
      Object.keys(data).forEach(key => {
        out += ` [${key}]:${data[key]}`;
      });
      console.log(out);
      setNote(out);
      console.groupEnd();
    });
  }
  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed minWidth={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WF name="URSYS Test" summary="see console for output" expanded>
            <button type="button" name="mow" onClick={handleButton}>
              URSYS Call Test
            </button>
            <div>{note}</div>
          </WF>{' '}
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
