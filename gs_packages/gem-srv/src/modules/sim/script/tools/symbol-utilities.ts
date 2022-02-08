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
  TSymKeywordArg
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
  keyword: string;
  //
  constructor(keyword: string = '?') {
    this.refs = {
      bundle: null,
      global: null
      // TSymbolRefs symbols is stored in this.sym_scope for ease of access
    };
    this.keyword = keyword;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** reference are the default lookup dictionaries. This is more than
   *  just the global context, including the entire
   */
  setReferences(refs: any) {
    const fn = 'setReferences:';
    const { bundle, global } = refs || {};
    if (bundle) {
      if (IsValidBundle(bundle)) this.refs.bundle = bundle;
      else throw Error(`${fn} invalid bundle`);
    }
    if (global) {
      if (typeof global === 'object') this._attachGlobal(global);
      else throw Error(`${fn} invalid context`);
    }
    // reset symbol scope pointer to top of bundle
    this.scopeBundle();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns a list of valid keywords for this line
   *  I'm not sure how this will really work, but stuffing it in here for now as
   *  a placeholder
   */
  WIP_scopeKeywords(): TSymbolData {
    return {
      keywords: ['prop', 'addProp', 'call', 'if', 'when', 'onEvent', 'every']
    };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** reset the symbol scope pointer to the top of the bundle */
  scopeBundle() {
    const fn = 'scopeBundle:';
    if (this.refs.bundle === null) {
      console.warn(
        `${fn} ${this.keyword} missing refs.bundle (keyword needs update)`
      );
      return {};
    }
    this.sym_scope = this.refs.bundle.symbols || {};
    return this.sym_scope;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** add to prototype chain for context object */
  _attachGlobal(ctx: object) {
    // TODO: use prototype chains
    this.refs.global = ctx;
  }
  /// LOOKUP UTILITY METHODS //////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** if part is 'agent', return the bundle symbols or undefined */
  agentLiteral(part: string) {
    if (part !== 'agent') return undefined;
    if (this.sym_scope === null) {
      console.warn(
        'agentLiteral: sym_scope must be defined by scopeInit() first'
      );
      return undefined;
    }
    if (this.sym_scope !== this.refs.bundle.symbols) return undefined;
    return this.refs.bundle.symbols; // current symbol data
  }
  /** check the current sm_scope or bundle for featureName matches or undefined */
  featureName(part: string) {
    const features = this.scopeBundle().features;
    if (features === undefined) return undefined;
    return features[part];
  }
  /** check the global reference object for an sym_scope. Blueprint names
   *  are always valid because they are stored in refs, not bundle.symbols.
   *  returns undefined if blueprint doesn't exist, which is the case if
   *  the global object doesn't contain all the blueprints that were defined
   *  in the overall .gemprj file. This is set by the call to setReferences.
   */
  blueprintName(part: string) {
    if (part === 'agent') return undefined;
    const ctx = this.refs.global || {};
    const bp = ctx[part];
    if (bp) return bp.symbols;
    return undefined;
  }
  /** check the current sm_cope or bundle for propName matches or undefined */
  propName(part: string) {
    const ctx = this.sym_scope || {};
    const propctx = ctx.props;
    if (propctx) return propctx[part];
    return undefined;
  }

  /// TOKEN PARSERS ///////////////////////////////////////////////////////////
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
  /** a method or property name is always an identifier, never an objref or
   *  quoted string
   */
  parseAsIdentifier(token: IToken): string {
    const { identifier } = token;
    return identifier;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** WIP the idea is to return a symbol data structure that shows all the
   *  allowable argument types groups. For types of 'test' it should be the
   *  list of tests in the system, for 'anyval' it coul be  literal, expr,
   *  objref, etc
   */
  scopeArgSymbols(token: IToken): TSymbolData {}

  /// SCOPE DRILLING //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Given a token that is an smobject reference, return the actual symboldata
   *  for it and then sets it as the current scope context.
   *  NOTE: expects that scopeInit() was called first.it resets the sym_scope
   */
  scopeObjRef(token: IToken): TSymbolData {
    const mn = 'objRefScope()';
    const scanArray = this.parseAsObjRef(token);
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
        /** test output **/
        /** test output **/
        /** test output **/
        console.group('part', ii, part);
        console.log('agent', agent);
        console.log('feature', feature);
        console.log('prop', prop);
        console.log('blueprint', blueprint);
        console.groupEnd();
        /** test output **/
        /** test output **/
        /** test output **/
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
          console.log(`${mn}: unrecognized part 0`);
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
      console.error(`${mn}: no matching pattern for pass`, ii);
      this.sym_scope = null;
    }
    // return symbol data
    return this.sym_scope;
  }

  /** given an existing symboldata scope set in this.sym_scope, looks for a method */
  scopeMethod(token: IToken): TSymbolData {
    if (this.sym_scope === null)
      return {
        error: {
          code: 'noparse',
          info: 'scopeMethod needs sym_scope!==null'
        }
      };
    const methodName = this.parseAsIdentifier(token);
    if (methodName === undefined)
      return { error: { code: 'noparse', info: 'expected identifier token' } };
    if (typeof methodName !== 'string')
      return { error: { code: 'noscope', info: 'identifier is not string' } };
    const { methods } = this.sym_scope;
    if (methods === undefined)
      return {
        error: {
          code: 'noexist',
          info: 'no method symbols are defined in current symscope'
        }
      };
    const methodArgs = methods[methodName];
    if (methodArgs) {
      // is { args?: TSymKeywordArg[]; returns?: TSymKeywordArg }
      // scope is set to current method
      this.sym_scope = { [methodName]: methodArgs };
      // but return the list of methods
      return methods;
    }
    return undefined;
  }

  /** the incoming tokens are a variable-length array that are method
   *  arguments that are allowed per token. These are TSymKeywordArg
   *  which include enums and special values for tests, programs, etc
   *
   *  assumes that symscope is set to { [methodName:string]:TSymMethodArg}
   */
  scopeArgs(tokens: IToken[]): TSymbolData[] {
    const fn = 'scopeArgs:';
    const methodNames = [...Object.keys(this.sym_scope)];
    if (methodNames.length !== 1)
      throw Error(`${fn} expects one method with TSymMethodArg payload`);
    const methodName = methodNames[0];
    const methodSignature = this.sym_scope[methodName];
    const { args, returns } = methodSignature;
    const vargs = [];

    // note that tokens array is just the argument tokens, which are
    // any tokens after the methodName token
    if (tokens.length > args.length) console.warn('token overflow');
    if (tokens.length < args.length) console.warn('token underflow');

    let ii = 0;
    for (ii; ii < tokens.length; ii++) {
      // check for overflow
      if (ii > args.length - 1) {
        vargs.push({
          error: {
            code: 'over',
            info: 'more tokens than method signature symbols'
          }
        });
        continue;
      }
      // normal push
      const tok = tokens[ii];
      const argType = args[ii];
      /** MAGIC EXPAND **/
      const symbols = this.scopeArgSymbols(argType);
      /** RESULT IS RENDERABLE LIST **/
      vargs.push({ symbols });
    }
    // check for underflow
    if (ii < args.length - 1)
      for (ii; ii < args.length; ii++) {
        vargs.push({
          error: {
            code: 'under',
            info: 'fewer tokens than method signature symbols'
          }
        });
      }

    return vargs;
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
