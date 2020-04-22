/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Playback View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../URLayout';
import SimPanel from '../../components/SimPanel';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { cq } = MD;
const ELEMENTS = `
### PLAYBACK
* ${cq('SimPanel')}
* ${cq('AgentList')}
* ${cq('AgentProps')}
* ${cq('AgentControl')}
* ${cq('VideoControl')}
* ${cq('RecordingControl')}
* ${cq('PlaybackControl')}
* ${cq('RecordingList')}
* ${cq('AnnotationControl')}
* ${cq('AnnotationList')}

`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
Model running (real-time)

Environment Map
* simulation window

UI Interactions
* drag instance of specific agent into environment
* set starting values of agent instances
* this is the "starting" point of the model on reset
* agent control: static, AI (if programmed), by user (ptrack, faketrack)
* video background underlay/overlay

Recording
* Start/Stop recording. Only one recording active at a time.
* All connected accounts can control. Socially-managed, no permission locking.
* On stop, recording saves with default name

Playback
* Select, then: play, pause, playback speed, ff, rewind
* Scrub Bar

Manage Recordings
* Recording List. Belongs to the model.
* Recording: group owner. Can Ddelete

Annotating Recordings
* Toggle on/off
* Annotations can be made live, and are tagged by the person/group annotating it


`;

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Playback() {
  const classes = useStyles();

  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed width={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <SimPanel />
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Playback;
