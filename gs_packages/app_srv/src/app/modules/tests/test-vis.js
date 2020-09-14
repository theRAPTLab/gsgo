/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper Tests

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { DiffMaps } from '../vis/lib/class-pool-map';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST = true;

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function makeMap(prefix = '', ids) {
  const x = new Map();
  ids.forEach(id => x.set(id, { id, name: `${prefix}-${id}` }));
  return x;
}
function arraysSame(a, b) {
  if (a.length !== b.length) return false;
  a.sort(); // warning: in-place sort!
  b.sort();
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
const s = makeMap('source', [1, 2, 3, 4, 5, 0]);
const m = makeMap('mapped', [2, 3, 5, 6, 7]);
const tmp = DiffMaps(s, m, {
  addFunc: () => {},
  updateFunc: () => {},
  removeFunc: () => {},
  removeTest: item => item.id === 6 // only remove id 6
});

if (TEST) {
  console.log('running visual class tests');
  const { added, updated, removed } = tmp;
  console.assert(arraysSame(updated, [2, 3, 5]), 'fail updated', updated);
  console.assert(arraysSame(added, [0, 1, 4]), 'fail added', added);
  console.assert(arraysSame(removed, [6]), 'fail removed', removed);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { DiffMaps };
