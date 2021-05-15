/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable new-cap */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Seeded Random Number Generator

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const seedrandom = require('lib/vendor/seedrandom.js');

/// RANDOM NUMBER GENERATOR ///////////////////////////////////////////////////
///
/// Set up Random Number Generator
///   --  With 'gemgem' seed, first random value should be 0.7957001450067326
///   --  Second is 0.8061188889889285
///
/// To Use
/// 1. `import RNG from 'modules/sim/sequencer';`
/// 2. `const num = RNG();`
///
const RNG = new Math.seedrandom('gemgem');
export default RNG;
