/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Features can (1) modify the agent (2) use agent properties to update
  its own properties stored in the agent (3) queue an event for a later
  stage in the agent's event queue.

  Features are instantiated once.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Feature from './class-feature';
import { FEATURES } from '../runtime-data';

/// LIBRARY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetByName(name) {
  return FEATURES.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_AddExternal(fpack) {
  FEATURES.set(fpack.name, fpack);
}

// Fake Feature Packs...
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MovementPack = {
  name: 'Movement',
  initialize: pm => {
    pm.Hook('INPUT', this.HandleInput);
  },
  decorate: agent => {
    return MovementPack;
  },
  setController: (agent, x) => {
    return MovementPack;
  }
};
m_AddExternal(MovementPack);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TimerPack = {
  name: 'Timer',
  subscribers: new Map(),
  initialize: pm => {
    pm.Hook('INPUT', this.HandleInput);
  },
  onTick: func => console.log('subscribe onTick'),
  decorate: agent => {
    return TimerPack;
  },
  defineTimer: (agent, timerName, timerOptions) => {
    return TimerPack;
  },
  on: (agent, eventName, subscriberFunc) => {
    return TimerPack;
  }
};
m_AddExternal(TimerPack);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export
export default {
  GetByName: m_GetByName,
  Register: m_AddExternal
};
