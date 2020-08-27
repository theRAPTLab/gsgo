/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable react/jsx-curly-brace-presence */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Modeler Run/Playback View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { makeStyles } from '@material-ui/core/styles';
import * as PIXI from 'pixi.js';
import { Stage, Sprite } from 'react-pixi-fiber';

import { View, Row, Cell, CellFixed, MD } from '../page-blocks/URLayout';
import {
  WF,
  WFChildRow,
  CellWF,
  WFList,
  WFLabel,
  WFCheckItem,
  WFChildStack,
  WFSlider
} from '../page-blocks/URWireframe';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BOTTOM_NOTES = `
file: page-tabs/FakeTrack.jsx

This is testing the PixiJS React integration
`;

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function FakeTrack() {
  const classes = useStyles();
  useEffect(() => {}, []);
  //
  const mode = 'run';
  return (
    <View className={classes.inset}>
      <Stage options={{ backgroundColor: 0xf00000, height: 600, width: 800 }}>
        <Sprite texture={PIXI.Texture.from('sprites/bunnys.png')} />
      </Stage>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default FakeTrack;
