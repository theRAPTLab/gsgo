/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IScopeable } from 'lib/t-smc';
import { ISMCBundle, ScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/runtime-datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Random(min: number, max: number, floor: boolean = true) {
  const n = Math.random() * (max - min) + min;
  if (floor) return Math.floor(n);
  return n;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class RandomPos extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('randomPos');
    this.args = ['min:number', 'max:number', 'floor:boolean'];
  }

  /** create smc blueprint code objects */
  compile(parms: any[]): ISMCBundle {
    const min = parms[0];
    const max = parms[1];
    const floor = parms[2] || false;
    const progout = [];
    progout.push((agent: IScopeable) => {
      const x = m_Random(min, max, floor);
      const y = m_Random(min, max, floor);
      agent.prop('x')._value = x;
      agent.prop('y')._value = y;
    });
    return {
      define: [],
      defaults: [],
      conditions: progout,
      update: progout // hack for testing
    };
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): ScriptUnit {
    const { min, max, floor } = state;
    return [this.keyword, min, max, floor];
  }

  /** return rendered component representation */
  render(index: number, args: any, children?: any[]): any {
    const min = args[1];
    const max = args[2];
    const floor = args[3];
    return (
      <div key={this.generateKey()} className="randomPos">
        random between ({min},{max}) (floor={floor})
      </div>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(RandomPos);
