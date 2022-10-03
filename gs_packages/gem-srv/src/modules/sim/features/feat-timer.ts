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
import SM_Feature from 'lib/class-sm-feature';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TimerPack');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class TimerPack extends SM_Feature {
  constructor(name) {
    super(name);
    this.featAddMethod('setRoundTimer', this.setRoundTimer);
    this.featAddMethod('stopRound', this.stopRound);
    if (DBG) console.log(...PR('construct'));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
  }

  /// TIMER METHODS ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRoundTimer(agent: IAgent) {
    console.error('setRoundTimer not implemented yet.');
  }
  stopRound(agent: IAgent) {
    UR.RaiseMessage('NET:HACK_SIM_STOP');
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(TimerPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return TimerPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {},
    methods: {
      setRoundTimer: {},
      stopRound: {}
    }
  };
}

/// import { RegisterFeature } from 'modules/datacore/dc-sim-data';
/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new TimerPack('Timer');
RegisterFeature(INSTANCE);
