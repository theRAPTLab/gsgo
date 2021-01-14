/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

const TimerPack = {
  name: 'Timer',
  initialize: pm => {
    pm.hook('INPUT', this.HandleInput);
  },
  agentInit: agent => {
    this.agent = agent;
    return TimerPack;
  },
  defineTimer: timerName => {
    console.log(`deftimer ${timerName}`);
    return TimerPack;
  },
  on: (eventName, f) => {
    console.log(`${TimerPack.name} handler for '${eventName}'`);
    return TimerPack;
  }
};

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// URSYS PROMPT //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TimerPack');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class TimerPack extends GFeature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
  }
}

/// import { Register } from 'modules/datacore/dc-features';
/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new TimerPack('Timer');
Register(INSTANCE);
