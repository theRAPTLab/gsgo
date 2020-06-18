/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The World Agent is global context for every agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import rxjs from 'rxjs';
import GSNumber from '../properties/value-number';
import GSString from '../properties/value-string';
import Agent from './class-agent';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class WorldAgent extends Agent {
  constructor() {
    super();
    // this.props = Map 'prop' => ValueClass
    // this.features = Map 'feature' => FeatureClass
    // this.eventQ = [] of incoming events
    this.timers = [];
    this.globals = {};
  }
}

/// SINGLETON /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const World = new WorldAgent();

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default World;
