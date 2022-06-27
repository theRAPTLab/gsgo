/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  dbgTick does nothing but count to itself

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// KEYWORD STATIC DECLARATIONS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DBGTICK');
const COUNTERS = new Map<number, number>();

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgTick extends Keyword {
  constructor() {
    super('dbgTick');
    this.args = ['*:{...}'];
  }

  compile(unit: TKWArguments): TOpcode[] {
    const progout = [];
    progout.push((agent, state) => {
      let count = COUNTERS.get(agent.id) || 0;
      ++count;
      COUNTERS.set(agent.id, count);
    });
    return progout;
  }

  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok] = unit;
    const vtoks = [this.shelper.anyKeyword(kwTok)];
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterKeyword(dbgTick);
