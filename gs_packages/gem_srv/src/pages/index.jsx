/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with PageNav and full page layout

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// material ui
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { FullScreen, View, Row, Cell, CellFixed } from '../blocks/URLayout';
import MD from '../components/ReactMarkdown';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  pagemode: theme.urFullScreenApp,
  viewmode: theme.urFullScreenView
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FullScreen>
      <URSiteNav />
      <URTabbedView>
        <View label="Agents" className={classes.viewmode}>
          <Row>
            <CellFixed width={200}>
              <MD>{`
## Agents
* Bee
* Flower
* * properties
* * costume
* Add Agent
* Edit
* Delete
          `}</MD>
            </CellFixed>
            <Cell>
              <MD>{`
## Description
this cell stretches to the remaining width
              `}</MD>
            </Cell>
            <Cell>
              <Button color="primary" variant="contained">
                A button
              </Button>
              <Button color="primary" variant="contained">
                A button
              </Button>
              <Button color="primary" variant="contained">
                A button
              </Button>
            </Cell>
          </Row>
        </View>
        <View label="Interactions" className={classes.viewmode}>
          <MD>{`
## Interactions
          `}</MD>
        </View>
        <View label="Move" className={classes.viewmode}>
          <MD>{`
## Move
          `}</MD>
        </View>
        <View label="Playback" className={classes.viewmode}>
          <MD>{`
## Playback
          `}</MD>
        </View>
      </URTabbedView>
    </FullScreen>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
