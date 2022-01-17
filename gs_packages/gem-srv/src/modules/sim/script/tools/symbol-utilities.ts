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
  ValidateArgTypes,
  DecodeArgType,
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
  ISMCBundle,
  IToken,
  TSymbolMap,
  TSymbolData,
  TSymbolArgType
} from 'lib/t-script.d';
import { VMToken, VMPageLine } from 'lib/t-ui.d';

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
  kwProcessor.annotate(statement);
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
  bundle: ISMCBundle; // current blueprint symbol
  ctx_obj: object; // additional context objects (other blueprints)
  sym_scope: TSymbolData; // current scope as drilling down into objref
  //
  constructor() {
    this.token = null;
    this.bundle = null;
    this.ctx_obj = null;
    this.sym_scope = null;
  }

  setParameters({ token, bundle, context }) {
    this._setToken(token);
    this._setBundle(bundle);
    this._setContext(context); // add prototype
  }

  _setToken(tok: IToken) {
    if (IsValidToken(tok)) this.token = tok;
    else {
      console.warn(...PR('invalid token', tok));
      throw Error('setToken: invalid token');
    }
  }
  _setBundle(bundle: ISMCBundle) {
    const { symbols, name } = bundle;
    const { props, features } = symbols;
    const hasSymbols =
      typeof props !== 'undefined' || typeof features !== 'undefined';
    if (hasSymbols) {
      this.bundle = bundle;
    } else {
      console.warn(...PR('setBundle: not a bundle', bundle));
      throw Error('setBundle: invalid parameter not bundle');
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
  getSymbols() {
    // sym_map is from cur_bdl.symbols for the blueprint
    // ctx_obj is used for evaluating expressions
    const P = 'getSymbols()';
    const { _argtype, _args } = this.token;
    if (Array.isArray(_args)) {
      console.log(...PR('clicked keyword', this.token.identifier, 'args'), _args);
      return;
    }
    const [argName, argType] = DecodeArgType(_argtype);
    let scanArray;
    if (argType === 'objref') {
      const { identifier, objref } = this.token; // we know this is valid because of argtype
      if (Array.isArray(objref)) {
        console.log(`process ${argName} as objref ${objref.join('.')}`);
        scanArray = [...objref];
      } else if (typeof identifier === 'string') {
        console.log(`process ${argName} as objref ${identifier}`);
        scanArray = [identifier];
      }

      // this.sym_scope will be reset in first pass
      this.sym_scope = null;
      for (let ii = 0; ii < scanArray.length; ii++) {
        const part = scanArray[ii];
        const terminal = ii >= scanArray.length - 1;
        if (ii === 0) {
          const agent = this.agentLiteral(part);
          const feature = this.featureName(part);
          const prop = this.propName(part);
          const blueprint = this.blueprintName(part);
          if (agent) {
            this.sym_scope = agent;
            console.log(ii, 'found agent', part, agent);
          } else if (feature) {
            this.sym_scope = feature;
            console.log(ii, 'found feature', part, feature);
          } else if (prop) {
            this.sym_scope = prop;
            console.log(ii, 'found prop', part, prop);
            if (terminal) {
              console.log('exiting loop', ii);
              return this.sym_scope;
            }
          } else if (blueprint) {
            this.sym_scope = blueprint;
            console.log(ii, 'found blueprint', part, blueprint);
          } else {
            console.log(`${P}: unrecognized part 0`);
            break;
          }
        }
        // iteration > 0
        const prop = this.propName(part);
        const feature = this.featureName(part);
        const blueprint = this.blueprintName(part);
        if (prop) {
          this.sym_scope = prop;
          console.log('found prop', ii);
          if (terminal) break; // prop is usually the terminal
        } else if (feature) {
          this.sym_scope = feature;
          if (terminal) break;
        } else if (blueprint) {
          this.sym_scope = blueprint;
        }
        console.log(`${P}: no matching pattern for pass`, ii);
        this.sym_scope = null;
      }
    }
    if (this.sym_scope === null) {
      console.log(...PR('decode() unhandled argtype', _argtype, this.token));
      return;
    }
    return this.sym_scope;
  }

  // level 0 checks
  agentLiteral(part: string) {
    if (part !== 'agent') return undefined;
    return this.bundle.symbols;
  }
  featureName(part: string) {
    const sym = this.sym_scope || this.bundle.symbols;
    const featctx = sym.features || {};
    return featctx[part];
  }
  blueprintName(part: string) {
    const ctx = this.ctx_obj || {};
    return ctx[part];
  }
  propName(part: string) {
    const sym = this.sym_scope || this.bundle.symbols;
    const propctx = sym.props || {};
    console.log('***', part, propctx);
    return propctx[part];
  }
} // end of SymbolHelper class

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
