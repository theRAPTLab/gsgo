/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '@gemstep/ursys/client';
import Feature from './class-feature';

const { makeLogHelper } = UR.util.PROMPTS;
const PR = makeLogHelper('TimerFeature');

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class TimerFeature extends Feature {
  constructor() {
    super('Timer');
    console.log(...PR(`${this.name} initialized`));
  }
  // super.agentInit(agent)
  // super.prop(agent,propName) => gVar
  // super.setProp(agent,propName,gVar) => gVar
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default TimerFeature;
