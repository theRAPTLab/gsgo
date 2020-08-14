/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../../page-blocks/URLayout';
import { WF } from '../../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### MODELER
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
## CLASS vs GROUP

## STUDENT PERSPECTIVE
* group with each student with their own laptop?
* some mixture of shared devices: group server/presenters (higher-end laptop), variable number of input/controllers (chromebooks/laptops (secondary displays), ipads (annotation devices, somewhat more limited)).
* students are working on different aspects of the model, so they will have their own views/subviews of what's going on (the presenter has to be flexible to show things).

### Playing with the System
* an AgentList (left) - where you define and drag agents to the WorldView
* a WorldView (center)
* SelectAgent shows object properties (right)
* ObjectInspection makes "class vs instance" distinction clear
* Distinct Design and Run Phases
* Definition, Training Grounds (shared world), "Show Night" Recording (that can be replayed and annotated).
* What kind of research logging do we want from each object?
* How to visually relate ANNOTATIONS/EVENTS with SOURCES/TARGETS?
* Automatic snapshotting of n-branched "commits" (model/sim/test/run), each with its own commit message, triggered by each and changes. "commit before run".

Inhabitable bee - drag to the worldview
- how to use an existing agent
- how to make my own agent
- how to control the agent with my movement (ptrack)
- how to control the agent with "ai behaviors"
- how to interact with other bees, how many students.
- how do I change the way the bee looks?
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
