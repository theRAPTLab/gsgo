/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Returns a simple PIXI line graph

  TO USE

  Pass a PIXI Graphics object to DrawGraph.

      import { DrawGraph } from './util-pixi-graph';
      const graph = new PIXI.Graphics();
      DrawGraph(graph, data, {
        scale: 4, // scale 1 = 100 pixels
        scaleY: 1
      });
      container.addChild(graph);

  data is a flat array of x, y values, with the first
  four values setting the minX, maxX, minY, and maxY of the graph.
  If the minX and maxX values match, then we assume the graph
  should auto-set the bounds (same is true for minY and maxY):

  e.g. [0,0, 0,0,   1,2, 3,4] will result in auto bounds of Y = 1 to 4
  e.g. [0,0, 0,10,  1,2, 3,4] will result in bounds of Y = 0 to 10

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';

const SIZE = 100;
const PAD = 10;
const BGCOLOR = 0xffffff;
const COLOR = 0xffffff;

const style = new PIXI.TextStyle({
  // Axis label style
  fontFamily: 'Arial',
  fontSize: 18,
  fill: ['#ffffff99'],
  // stroke: '#333333cc', // stroke actually makes it harder to read
  // strokeThickness: 3,
  wordWrapWidth: 125,
  wordWrap: true
});

// not necessary, just use position
function m_Offset(path: number[], x: number, y: number) {
  return path.map((val, index) => (index % 2 ? val + x : val + y));
}

function m_GetBounds(path: number[]) {
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  path.forEach((val, index) => {
    if (index % 2) {
      ymin = Math.min(val, ymin, 0);
      ymax = Math.max(val, ymax);
    } else {
      xmin = Math.min(val, xmin);
      xmax = Math.max(val, xmax);
    }
  });
  return { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin };
}

/// Normalize to [0-100]
/// We use 100, not 1 because line drawing at widths < 1 results in uneven lines
function m_Normalize(
  path: number[],
  bounds: { x: number; y: number; width: number; height: number }
) {
  const w = bounds.width;
  let h = bounds.height;
  let hoffset = 0;
  if (bounds.y < 0) {
    h *= 2;
    hoffset = 0.5;
  }
  return path.map((val, index) => {
    if (index % 2) return ((val - bounds.y) / h + hoffset) * (SIZE - PAD);
    return ((val - bounds.x) / w) * SIZE;
  });
}

/**
 *
 * @param graph
 * @param data flat array of x, y values, e.g. [0,0, 1,2, 3,4]
 * @param options
 */
export function DrawLineGraph(
  graph: PIXI.Graphics,
  data: number[],
  options?: {
    scale?: number;
    scaleY?: number;
    color?: number;
    offsetX?: number;
    offsetY?: number;
    skipBackground?: boolean;
    skipAxis?: boolean;
  }
): any {
  // const path = [0, 0, 2, -10, 3, -12, 4, 9, 5, 5, 6, 0];
  // const path = [0, 0, 2, 10, 3, 12, 5, 9, 5, 5, 6, 0];

  const path = data;
  const minX = path.shift();
  const maxX = path.shift();
  const minY = path.shift();
  const maxY = path.shift();
  let bounds = m_GetBounds(path); // auto bounds
  if (minX !== maxX) {
    bounds.x = minX; // override bounds if minX and maxX are set differently
    bounds.width = maxX - minX;
  }
  if (minY !== maxY) {
    bounds.y = minY; // override bounds if minY and maxY are set differently
    bounds.height = maxY - minY;
  }
  const HAS_NEGATIVE_Y = bounds.y < 0;

  const color = options.color || COLOR;
  const scale = options.scale || 1;
  const scaleY = options.scaleY || scale;
  const offsetX = options.offsetX || 0;
  const offsetY = options.offsetY || 0;

  const normalized = m_Normalize(path, bounds);

  graph.clear();

  // draw background box
  if (!options.skipBackground) {
    graph.beginFill(BGCOLOR, 0.2);
    graph.drawRect(0, 0, 100, 100);
    graph.endFill();
  }

  // draw axis
  if (!options.skipAxis) {
    graph.lineStyle(1, BGCOLOR, 0.2);
    graph.lineTo(0, 100);
    if (HAS_NEGATIVE_Y) {
      graph.moveTo(0, 50);
      graph.lineTo(100, 50);
    } else {
      graph.moveTo(0, 0);
      graph.lineTo(100, 0);
    }
  }

  // draw axis labels
  const gap = 3;
  let minYLabel = graph.getChildByName('minY') as PIXI.Text;
  const minYLabelText = Math.abs(bounds.y) === Infinity ? '0' : String(bounds.y); // default to 0
  if (
    minYLabel === undefined ||
    minYLabelText !== (minYLabel && minYLabel.text)
  ) {
    if (minYLabel) graph.removeChild(minYLabel);
    minYLabel = new PIXI.Text(minYLabelText, style);
    minYLabel.name = 'minY';
    minYLabel.position.set(-minYLabel.width - gap, minYLabel.height);
    minYLabel.scale.set(1, -1); // flip b/c graph is flipped
    graph.addChild(minYLabel);
  }
  let maxYLabel = graph.getChildByName('maxY') as PIXI.Text;
  const maxYLabelText =
    Math.abs(bounds.height) === Infinity ? '100' : String(bounds.height); // default to 100
  if (
    maxYLabel === undefined ||
    maxYLabelText !== (maxYLabel && maxYLabel.text)
  ) {
    if (maxYLabel) graph.removeChild(maxYLabel);
    maxYLabel = new PIXI.Text(maxYLabelText, style);
    maxYLabel.name = 'maxY';
    maxYLabel.position.set(-maxYLabel.width - gap, 100);
    maxYLabel.scale.set(1, -1); // flip b/c graph is flipped
    graph.addChild(maxYLabel);
  }

  // draw graph
  const parms = {
    width: 1,
    color: color,
    alignment: 0.5,
    native: true,
    join: PIXI.LINE_JOIN.ROUND,
    cap: PIXI.LINE_CAP.ROUND,
    miterLimit: 10
  };
  graph.lineStyle(parms);
  // graph.moveTo(0, bounds.y < 0 ? 50 : 0); // we don't necessarily want to start at 0,0
  const l = normalized.length;
  graph.moveTo(normalized[0], normalized[1]);
  for (let i = 2; i < l; i += 2) {
    graph.lineTo(normalized[i], normalized[i + 1]);
  }
  graph.endFill();

  // position and scale
  graph.position.set(
    offsetX + (-SIZE * scale) / 2, // center
    // offsetY + (SIZE * scaleY) / 2 // center
    // offsetY + SIZE * scaleY + PAD // bottom
    offsetY // bottom-aligned at center
  ); // centered
  graph.scale.set(scale, -scaleY);
}
