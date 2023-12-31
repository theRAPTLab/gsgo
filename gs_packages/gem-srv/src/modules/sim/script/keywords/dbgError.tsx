/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgError" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgError extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgError');
    this.args = ['*:{...}'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, error] = unit;
    const progout = [];
    progout.push(() => {
      const err = unit.join(', ');
      console.log(
        `%cERROR%c ${error || 'bad keyword'}: '${err}'`,
        'color:red',
        'color:black'
      );
      // throw Error(`unknown keyword: ${err}`);
    });
    return progout;
  }

  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok, errTok] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.anyString(errTok));
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgError);
