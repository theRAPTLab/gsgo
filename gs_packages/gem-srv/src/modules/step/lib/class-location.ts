/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PTrack coordinates and scaling is often rotated and skewed depending on
  the physical setup of the cameras and calibration.

  SimWorld coordinates are in pixels with the 0,0 origin in the center of
  the display space.

  LocationTransform handles transformation of position data from a PTRACK
  system into SimWorld coordinates.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { Matrix4 } from './t-tracking';

export class LocationTransform {
  sx: number;
  sy: number;
  sz: number;
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
  tz: number;
  // room dimensions
  width: number;
  depth: number;
  // axis control
  invertX: boolean;
  invertY: boolean;
  // align origin and coordinate axes
  // 0,0 is in center of room
  matrixAlign: Matrix4;
  // normalize tracker space to +/- 1
  tHalfWidth: number;
  tHalfDepth: number;
  // expand to gameworld pixel dimensions
  gHalfWidth: number;
  gHalfDepth: number;
}

export type LocationDict = Map<string, LocationTransform>;
