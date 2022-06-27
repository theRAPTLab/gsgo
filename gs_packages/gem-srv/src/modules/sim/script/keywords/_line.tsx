/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "blank line" object

  NOTE: This is a SYSTEM KEYWORD used for empty lines, and isn't intended
  for direct use.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class _line extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('_line');
    this.args = ['?:{...}'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    return [];
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(_line);
