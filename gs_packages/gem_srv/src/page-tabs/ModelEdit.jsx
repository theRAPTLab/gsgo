/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Build View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  View,
  Row,
  Cell,
  CellFixed,
  TextView,
  MD
} from '../page-blocks/URLayout';
import { WF, WFChildRow, CellWF } from '../page-blocks/URWireframe';
import AgentPanel from '../components/AgentPanel';
import TrackingPanel from '../components/TrackingPanel';
import ScriptPanel from '../components/ScriptPanel';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/ModelEdit.jsx

_wireframe based on [Joshua's Whimsical Wireframe](https://whimsical.com/KKQMf7UH6Cm3y9DGAhapV7)_
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
  const mode = 'edit';
  return (
    <View className={classes.inset}>
      <Row>
        <Cell>
          {/* right side */}
          <Row>
            <ScriptPanel mode={mode} />
            {/* ScriptEditor R1C1 */}

            <AgentPanel mode={mode} />
          </Row>
          {/* Controls R2C1 */}
          <Row>
            <TrackingPanel mode={mode} />
          </Row>
          <hr />
          <MD>{BOTTOM_NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Modeler;
