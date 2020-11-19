/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Blueprint

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { BLUEPRINTS } from 'modules/runtime-datacore';
import { ISMCBundle, TScriptUnit } from 'lib/t-script';
import { CompileSource } from 'script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.PrefixUtil('C-BP');
const log = console.log;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class Blueprint {
  name: string;
  programs: ISMCBundle;

  constructor(name: string) {
    this.name = name;
  }

  /** compile passed source and save by name */
  save(units: TScriptUnit[]) {
    const bp: ISMCBundle = CompileSource(units);
    const name = bp.name;
    if (DBG) {
      if (BLUEPRINTS.has(name)) log(...PR(`updating ${name}`));
      else log(...PR(`new blueprint ${name}`));
    }
    // save, deleting old bundle name if necessary
    BLUEPRINTS.set(name, bp);
    if (name !== this.name) {
      BLUEPRINTS.delete(this.name);
      this.name = name;
    }
  }
} // end class Blueprint

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
