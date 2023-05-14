/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


For testing new featureees ...

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Feature from 'lib/class-sm-feature';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Agent from 'lib/class-sm-agent';
import { IsRunning } from 'modules/sim/api-sim';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'IU';
const PR = UR.PrefixUtil('IUFEATURE');
const DBG = true;
const LOG_ID = 'SCRIPT_LOG';

const CLICK_AGENTS = new Map();
const CLICK_FUNCTIONS = new Map();

// FUNCTIONS
const FUNCTIONS = new Map();

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class IUPack extends SM_Feature {
  constructor(name) {
    super(name);
    this.featAddMethod('logString', this.logString);
    this.featAddMethod('logProperty', this.logProperty);

    this.HandleSimInstanceClick = this.HandleSimInstanceClick.bind(this);
    UR.HandleMessage('SIM_INSTANCE_CLICK', this.HandleSimInstanceClick);

    this.featAddMethod('handleClick', this.handleClick);
    this.featAddMethod('setupFunction', this.setupFunction);
    this.featAddMethod('callFunction', this.callFunction);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);

    this.featAddProp(agent, 'logStringText', new SM_String('INIT'));
    agent.prop.IU.logStringText.setTo('INIT');
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    CLICK_AGENTS.clear();
    CLICK_FUNCTIONS.clear();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// IU FEATURE METHODS
  logProperty(agent: IAgent) {
    this.logString(agent, agent.prop.IU.logStringText.value);
  }

  logString(agent: IAgent, text: string) {
    if (DBG) console.log('Logging character(' + agent.id + '): ' + text);
    UR.LogEvent(LOG_ID, [' character ' + agent.id + '\t' + text]);
  }

  handleClick(agent: IAgent, program: TSMCProgram) {
    CLICK_AGENTS.set(agent.id, agent);
    CLICK_FUNCTIONS.set(agent.id, program);
  }

  setupFunction(agent: IAgent, functionName: string, program: TSMCProgram) {
    // combine the id + function name so that we can have similar sounding ones
    // TODO - make unique to the blueprint?
    let index = agent.id + functionName;
    FUNCTIONS.set(index, program);
  }

  callFunction(agent: IAgent, functionName: string) {
    let index = agent.id + functionName;
    let functionToCall = FUNCTIONS.get(index);
    if (!functionToCall) return;

    agent.exec(functionToCall, { agent: agent });
  }

  HandleSimInstanceClick(data) {
    if (IsRunning()) {
      const agent = CLICK_AGENTS.get(data.agentId);
      if (!agent) return;

      if (!agent.isInert) {
        const clickProgram = CLICK_FUNCTIONS.get(agent.id);
        if (!clickProgram) return;

        agent.exec(clickProgram, { agent: agent });
      }
    }
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(IUPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */ a;
  symbolize(): TSymbolData {
    return IUPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      logStringText: SM_String.SymbolizeCustom({
        setTo: ['logStringText:string']
      })
    },
    methods: {
      'logString': { args: ['text:string'] },
      'logProperty': {},
      'handleClick': { args: ['program:block'] },
      'setupFunction': { args: ['functionName:string', 'program:block'] },
      'callFunction': { args: ['functionName:string'] }
    }
  };
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new IUPack('IU');
RegisterFeature(INSTANCE);
