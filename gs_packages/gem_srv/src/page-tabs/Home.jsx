/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable prefer-template */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  System Home View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Box, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';

import {
  WF,
  CellWF,
  WFChildRow,
  WFList,
  WFLabel
} from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/Home.jsx

_wireframe based on [Joshua's Whimsical Wireframe](https://whimsical.com/KKQMf7UH6Cm3y9DGAhapV7)_
`;
const ASIDE = `
* Home is where you pick a model and other high-level functions.
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
        <Cell>
          <MD>{`
## Welcome to GEMSTEP
          `}</MD>
          <WF name="ModelList" expanded>
            <WFList name="List of Models">
              <WFLabel text="1 Model, Group, ?" />
              <WFLabel text="2 Model, Group, ?" />
              <WFLabel text="3 Model, Group, ?" />
              <WFLabel text="4 Model, Group, ?" />
              <WFLabel text="5 Model, Group, ?" />
            </WFList>

            <Row>
              <CellWF name="LoadModel" />
              <CellWF name="SaveModel" />
            </Row>
          </WF>
          <hr />
          <MD>{BOTTOM_NOTES}</MD>
        </Cell>
        <Cell>
          <MD>{ASIDE}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemHome;
