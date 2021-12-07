/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

implementation of keyword "randomPos" keyword object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import React from 'react';
import Keyword from 'lib/class-keyword';
import { IScopeable, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Random(min: number, max: number, floor: boolean = true) {
  const n = RNG() * (max - min) + min;
  if (floor) return Math.floor(n);
  return n;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class randomPos extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('randomPos');
    this.args = ['min:number', 'max:number', 'floor:boolean'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, min, max, floor] = unit;
    const progout = [];
    progout.push((agent: IScopeable) => {
      const x = m_Random(Number(min), Number(max), Boolean(floor) || false);
      const y = m_Random(Number(min), Number(max), Boolean(floor) || false);
      agent.prop.x.value = x;
      agent.prop.y.value = y;
    });
    return progout;
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [keyword, min, max, floor] = unit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(randomPos);
