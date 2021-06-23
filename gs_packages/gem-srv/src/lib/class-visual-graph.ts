/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Returns a simple PIXI line graph

  TO USE

  Pass a PIXI Graphics object to DrawGraph.

      const graph = new PIXI.Graphics();
      DrawGraph(graph, data, {
        scale: 4, // scale 1 = 100 pixels
        scaleY: 1
      });
      container.addChild(graph);


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';

const SIZE = 100;
const PAD = 10;
const BGCOLOR = 0xffffff;
const COLOR = 0xffffff;

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
export function DrawGraph(
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
  const bounds = m_GetBounds(path);
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

  // draw graph
  graph.lineStyle({
    width: 1,
    color: color,
    alignment: 0.5,
    native: true,
    join: PIXI.LINE_JOIN.ROUND,
    cap: PIXI.LINE_CAP.ROUND,
    miterLimit: 10
  });
  graph.moveTo(0, bounds.y < 0 ? 50 : 0);
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
