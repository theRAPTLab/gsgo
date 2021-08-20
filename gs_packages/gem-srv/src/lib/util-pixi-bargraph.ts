/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Returns a simple PIXI bar graph

  TO USE

  Pass a PIXI Graphics object to DrawGraph.

      import { DrawGraph } from './util-pixi-graph';
      const graph = new PIXI.Graphics();
      DrawGraph(graph, data, {
        scale: 4, // scale 1 = 100 pixels
        scaleY: 1
      });
      container.addChild(graph);

  data is a simple array, e.g. [5, 10, 15].

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';

const SIZEW = 200;
const SIZEH = 100;
const PAD = 2;
const BGCOLOR = 0xffffff;
const COLOR = 0xffffff;

const LABELTEXT = [];

const labelStyle = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 11,
  fill: ['#ffffffcc'],
  stroke: '#333333cc',
  strokeThickness: 1
});

// not necessary, just use position
function m_Offset(path: number[], x: number, y: number) {
  return path.map((val, index) => (index % 2 ? val + x : val + y));
}

// Min and Max Y values
function m_GetBounds(path: number[]) {
  let ymin = Infinity;
  let ymax = -Infinity;
  path.forEach((val, index) => {
    ymin = Math.min(val, ymin, 0);
    ymax = Math.max(val, ymax);
  });
  return { y: ymin, height: ymax - ymin };
}

/// Normalize to [0-100]
/// We use 100, not 1 because line drawing at widths < 1 results in uneven lines
function m_Normalize(path: number[], bounds: { y: number; height: number }) {
  let h = bounds.height;
  let hoffset = 0;
  if (bounds.y < 0) {
    h *= 2;
    hoffset = 0.5;
  }
  return path.map(val => {
    return ((val - bounds.y) / h + hoffset) * (SIZEH - PAD);
  });
}

/**
 *
 * @param graph
 * @param data flat array of x, y values, e.g. [0,0, 1,2, 3,4]
 * @param options
 */
export function DrawBarGraph(
  graph: PIXI.Graphics,
  data: number[],
  labels: string[],
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

  const bounds = m_GetBounds(data);
  const HAS_NEGATIVE_Y = bounds.y < 0;

  const color = options.color || COLOR;
  const scale = options.scale || 1;
  const scaleY = options.scaleY || scale;
  const offsetX = options.offsetX || 0;
  const offsetY = options.offsetY || -10; // Room to clear text label

  const normalized = m_Normalize(data, bounds);

  graph.clear();

  // draw background box
  if (!options.skipBackground) {
    graph.beginFill(BGCOLOR, 0.2);
    graph.drawRect(0, 0, SIZEW, SIZEH);
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

  // draw bars
  graph.beginFill(color);
  const l = normalized.length;
  const barW = SIZEW / l;
  for (let i = 0; i < l; i += 1) {
    const x = i * barW;
    const y = 0;
    const w = barW - PAD;
    const h = normalized[i];
    graph.drawRect(x, y, w, h);

    if (i >= LABELTEXT.length) {
      const str = labels ? labels[i] : '';
      console.log('creating label', str);
      const label = new PIXI.Text(str, labelStyle);
      label.position.set(x, y - PAD); // left justified
      label.scale.set(1, -1); // FLIP
      graph.addChild(label);
      LABELTEXT.push(label);
    }
  }
  graph.endFill();

  // position and scale
  graph.position.set(
    offsetX + (-SIZEW * scale) / 2, // center
    // offsetY + (SIZE * scaleY) / 2 // center
    // offsetY + SIZE * scaleY + PAD // bottom
    offsetY // bottom-aligned at center
  ); // centered
  graph.scale.set(scale, -scaleY); // NOTE: Flipped Y
}
