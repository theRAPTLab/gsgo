/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-cond-assign */
/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A collection of symbol utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import {
  GetKeyword,
  GetFeature,
  GetProgram,
  GetTest,
  GetBlueprint
} from 'modules/datacore';
import {
  IsValidToken,
  UnpackToken
} from 'script/tools/class-gscript-tokenizer-v2';
import {
  TScriptUnit,
  IToken,
  TSymbolMap,
  TSymbolArgType,
  ISMCBundle
} from 'lib/t-script.d';
import { StringToParts } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = UR.PrefixUtil('SYMUTIL', 'TagTest');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** support: use keyword processor to annotate script tokens with argument
 *  type
 */
function AnnotateStatement(statement: TScriptUnit): TScriptUnit {
  const keywordUnit = statement[0];
  const [type, keyword] = UnpackToken(keywordUnit); // should be an identifier token
  // skip lines, comments, directives
  if (type !== 'identifier') return statement;
  // process
  const kwProcessor = GetKeyword(keyword);
  if (kwProcessor === undefined)
    throw Error(`AnnotateStatement: no keyword ${keyword}`);
  return kwProcessor.annotate(statement);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Add symbol information to a script (statements comprised of tokens) */
function AnnotateScript(script: TScriptUnit[]): TScriptUnit[] {
  for (const stm of script) AnnotateStatement(stm);
  return script;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this class helps extract contextual information from an IToken
 *  suitable for creating viewmodel data lists for dropdowns/selectors.
 *  create an instance, setParameters(), then call decode method
 */
class SymbolHelper {
  token: IToken; // the token being operated on
  sym_map: TSymbolMap;
  ctx_obj: object;
  //
  constructor() {
    this.token = {};
  }

  setParameters({ token, symbols, context }) {
    this._setToken(token);
    this._setSymbolMap(symbols);
    this._setContext(context); // add prototype
  }

  _setToken(tok: IToken) {
    if (IsValidToken(tok)) this.token = tok;
    else {
      console.warn(...PR('invalid token', tok));
      throw Error('setToken: invalid token');
    }
  }
  _setSymbolMap(symbols: TSymbolMap) {
    const { props, features } = symbols;
    const isSymbols = props instanceof Map && features instanceof Map;
    if (isSymbols) this.sym_map = symbols as TSymbolMap;
    else {
      console.warn(...PR('setSymbolMap: not a map', symbols));
      throw Error('setSymbolMap: invalid parameter not map');
    }
  }
  /** clear the context root and add */
  _setContext(ctx: object) {
    this.ctx_obj = {};
    this._linkContext(ctx);
  }
  /** add to prototype chain for context object */
  _linkContext(ctx: object) {
    // TODO: use prototype chains
    if (typeof ctx === 'object') this.ctx_obj = ctx;
    else {
      console.warn(...PR('setContext: not an object', ctx));
      throw Error('setContext: invalid parameter not object');
    }
  }
  /** remove from prototype chain and return copy */
  _unlinkContext(): any {
    // do somethign
  }

  /** starting from the start of an objref, return the appropriate symbols */
  decode() {
    const { objref, expr, identifier } = this.token;
    if (objref !== undefined) {
      const parts = objref; // an array of strings
      return;
    }
    if (expr !== undefined) {
      console.log(...PR('decode() expression unimplemened'));
      return;
    }
    if (identifier !== undefined) {
      console.log(...PR('decode() identifier unimplemened'));
      return;
    }
    console.log(...PR('decode() unhandled token', this.token));
  }

  isAgentLiteral(part: number) {}
  isFeatureName(part: number) {}
  isPropName(part: number) {}
  isBlueprintName(part: number) {}
  isFeaturePropName(part: number) {}
  isTerminal(part: number) {}
}

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return 'agent' if part is 'agent', undefined otherwise */
function isAgentLiteral(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  const part = parts[index];
  return part === 'agent' ? 'agent' : undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return feature module if part matches, undefined otherwise */
function isFeatureName(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  const featName = parts[index];
  const feat = GetFeature(featName);
  return feat;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return prop if propName matches, undefined otherwise */
function isPropName(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  const propName = parts[index];
  // propName has to check current blueprint. Maybe part of bundle class.
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return Blueprint is bpName maptches, undefined otherwise */
function isBlueprintName(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  const bpName = parts[index];
  return GetBlueprint(bpName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function isFeaturePropName(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  // Feature propName has to be in FeatureMap somewhere
  const featPropName = parts[index];
}

/** if an out-of-bounds part index requested, then 'terminal' */
function isTerminal(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  return index > parts.length - 1;
}
function reportError(
  parts: string[],
  index: number = 0,
  symbols = {},
  context = {}
) {
  console.warn('unhandled objref condition', parts.join('.'));
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RuntimeTest(bdl?: ISMCBundle) {
  console.log('RuntimeTest: has not been defined');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** imported by DevWizard */
export {
  AnnotateScript // adds symbol information to tokens
};
export {
  SymbolHelper // symbol decoder
};
