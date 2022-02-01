/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-cond-assign */
/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A collection of symbol utilities

  The intent of SymbolHelper is to lookup symbol data from a token.
  Your provide a bundle and context
  It knows how to lookup features, programs, and blueprints.
  It knows how to dig into props.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import {
  GetKeyword,
  GetFeature,
  ValidateArgTypes,
  DecodeArgType,
  GetProgram,
  GetTest,
  GetBlueprint,
  IsValidBundle
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
  TSymbolRefs,
  TSymbolArgType
} from 'lib/t-script.d';
import { VMToken, VMPageLine } from 'lib/t-ui.d';

import { StringToParts } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
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
  refs: TSymbolRefs; // replaces token, bundle, xtx_obj, symscope
  sym_scope: TSymbolData; // current scope as drilling down into objref
  //
  constructor(lookupRefs?: TSymbolRefs) {
    this.refs = {
      bundle: null,
      global: null,
      symbols: null
    };
    this.setReferences(lookupRefs);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** reference are the default lookup dictionaries */
  setReferences(refs: any) {
    const err = 'setReferences:';
    const { bundle, global } = refs || {};
    if (bundle) {
      if (IsValidBundle(bundle)) this.refs.bundle = bundle;
      else throw Error(`${err} invalid bundle`);
    }
    if (global) {
      if (typeof global === 'object') this._attachGlobal(global);
      else throw Error(`${err} invalid context`);
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** add to prototype chain for context object */
  _attachGlobal(ctx: object) {
    // TODO: use prototype chains
    this.refs.global = ctx;
  }
  /// LOOKUP UTILITY METHODS //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** if part is 'agent', return symboldata for the bundle or undefined */
  agentLiteral(part: string) {
    if (part !== 'agent') return undefined;
    return this.refs.bundle.symbols;
  }
  /** check the current sm_scope or bundle for featureName matches or undefined */
  featureName(part: string) {
    const sym = this.sym_scope || this.refs.bundle.symbols;
    const featctx = sym.features || {};
    return featctx[part];
  }
  /** check the global reference object for an sym_scope */
  blueprintName(part: string) {
    const ctx = this.refs.global || {};
    return ctx[part];
  }
  /** check the current sm_cope or bundle for propName matches or undefined */
  propName(part: string) {
    const sym = this.sym_scope || this.refs.bundle.symbols;
    const propctx = sym.props || {};
    return propctx[part];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** an object reference is always an array of string parts, but an
   *  identifier can also be an objref
   */
  parseAsObjRef(token: IToken): string[] {
    const { identifier, objref } = token; // could be either
    if (Array.isArray(objref)) return [...objref];
    if (typeof identifier === 'string') return [identifier];
    return undefined;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given a token that is an smobject reference, return the actual symbol
   *  data for it
   */
  objRefSymbols(token: IToken): TSymbolData {
    const P = 'objRefScope()';
    const scanArray = this.parseAsObjRef(token);
    this.sym_scope = null;
    // this.sym_scope will be reset in first pass
    // scanArray is the array of identifier parts separated by .
    for (let ii = 0; ii < scanArray.length; ii++) {
      const part = scanArray[ii];
      const terminal = ii >= scanArray.length - 1;
      // (1) special case first part
      if (ii === 0) {
        const agent = this.agentLiteral(part);
        const feature = this.featureName(part);
        const prop = this.propName(part);
        const blueprint = this.blueprintName(part);
        if (agent) {
          this.sym_scope = agent;
          if (DBG) console.log(ii, 'found agent', part, agent);
          continue;
        } else if (feature) {
          this.sym_scope = feature;
          if (DBG) console.log(ii, 'found feature', part, feature);
          continue;
        } else if (prop) {
          this.sym_scope = prop;
          if (DBG) console.log(ii, 'found prop', part, prop);
          if (terminal) return this.sym_scope; // prop, exit!
          continue;
        } else if (blueprint) {
          this.sym_scope = blueprint;
          if (DBG) console.log(ii, 'found blueprint', part, blueprint);
        } else {
          console.log(`${P}: unrecognized part 0`);
          break;
        }
      }
      // (2) Scan subsequent parts, updating value of scope
      const prop = this.propName(part);
      const feature = this.featureName(part);
      const blueprint = this.blueprintName(part);
      if (prop) {
        this.sym_scope = prop;
        if (DBG) console.log('found prop', ii);
        if (terminal) return this.sym_scope; // prop is usually the terminal
        continue;
      } else if (feature) {
        this.sym_scope = feature;
        if (terminal) return this.sym_scope;
        continue;
      } else if (blueprint) {
        this.sym_scope = blueprint;
        continue;
      }
      console.error(`${P}: no matching pattern for pass`, ii);
      this.sym_scope = null;
    }
    // return symbol data
    return this.sym_scope;
  }
} // end of SymbolHelper class

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
