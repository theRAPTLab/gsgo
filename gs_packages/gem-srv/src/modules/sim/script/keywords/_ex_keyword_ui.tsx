/* eslint-disable react/prefer-stateless-function */
/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword defTemplate command object
  THIS CODE DOESN'T RUN IN THE CURRENTVERSION

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React from 'react';

import Keyword from '../../../../lib/class-keyword';
import { TOpcode, TScriptUnit } from '../../../../lib/t-script';
import { RegisterKeyword, GetTest, UtilFirstValue } from '../../../datacore';

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class defTemplate extends Keyword {
  // base properties defined in Keyword
  constructor() {
    super('defTemplate');
    this.args = ['templateName string', 'baseTemplate string'];
  }

  /** create smc template code objects for this unit */
  compile(unit: TScriptUnit): TOpcode[] {
    // this is example code for <ScriptElement>, so don't emit anything
    return [];
  }
  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [keyword, arg1, arg2] = unit;
    return <>{keyword}</>;
  }
} // end of DefTemplate

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see exports above
