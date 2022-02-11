/* eslint-disable max-classes-per-file */
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
  GetAllKeywords,
  GetFeature,
  GetProgram,
  GetTest,
  GetBlueprint,
  UnpackArg,
  UnpackToken,
  IsValidBundle
} from 'modules/datacore';
import {
  IToken,
  TSymbolData,
  TSymbolRefs,
  TSymbolErrorCodes
} from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMUTIL', 'TagTest');

/// TSYMBOLDATA ERROR UTILITY CLASS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** use as
 *  return new SymbolError('xxx','xxx');
 */
class SymbolError {
  error: { code: TSymbolErrorCodes; info: string };
  symbols?: TSymbolData;
  constructor(
    code: TSymbolErrorCodes = 'debug',
    info: string = '<none provided>',
    symbols?: TSymbolData
  ) {
    // always deliver error
    this.error = {
      code,
      info
    };
    // optionally tack-on symbol data
    if (symbols) this.symbols = symbols;
  }
}

/// TSYMBOLDATA UTILITY METHODS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// SYMBOL HELPER CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this class helps extract contextual information from an IToken
 *  suitable for creating viewmodel data lists for dropdowns/selectors.
 *  create an instance, setParameters(), then call decode method
 */
class SymbolHelper {
  refs: TSymbolRefs; // replaces token, bundle, xtx_obj, symscope
  cur_scope: TSymbolData; // current scope as drilling down into objref
  bdl_scope: TSymbolData; // pointer to the top scope (blueprint bundle)
  keyword: string;
  //
  constructor(keyword: string = '?') {
    this.refs = {
      bundle: null,
      global: null
      // TSymbolRefs symbols is stored in this.cur_scope for ease of access
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
    if (!bundle.symbols)
      throw Error(`${fn} bundle ${bundle.name} has no symbol data`);
    if (global) {
      if (typeof global === 'object') this._attachGlobal(global);
      else throw Error(`${fn} invalid context`);
    }
    this.bdl_scope = this.refs.bundle.symbols;
    this.cur_scope = this.bdl_scope;
  }
  /// SCOPE ACCESSORS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  resetCurrentScope() {
    this.cur_scope = this.bdl_scope;
  }
  getInitialScope(): TSymbolData {
    return this.bdl_scope;
  }
  getCurrentScope(): TSymbolData {
    return this.cur_scope;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns a list of valid keywords for the script engine */
  allKeywords(token: IToken): TSymbolData {
    const keywords = GetAllKeywords();
    if (token === undefined) {
      return new SymbolError('noparse', 'no keyword token', {
        keywords
      });
    }
    return { keywords };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** add to prototype chain for context object */
  _attachGlobal(ctx: object) {
    // TODO: use prototype chains
    this.refs.global = ctx;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** If part is 'agent', return the bundle symbols or undefined.
   *  This lookup is valid only if the scope is pointing the bundle's
   *  symbol entry at the start
   */
  agentLiteral(part: string, scope?: TSymbolData) {
    const fn = 'agentLiteral:';
    if (scope)
      throw Error(`${fn} works only on bdl_scope, so don't try to override`);
    if (part !== 'agent') return undefined;
    this.cur_scope = this.bdl_scope;
    return this.bdl_scope; // valid scope is parent of cur_scope
  }
  /** search the current scope for a matching featureName
   */
  featureName(part: string, scope?: TSymbolData) {
    scope = scope || this.cur_scope;
    const features = scope.features;
    if (features === undefined) return undefined; // no match
    const feature = features[part];
    if (!feature) return undefined;
    this.cur_scope = feature; // advance scope
    return features; // valid scope is parent of cur_scope
  }
  /** search the refs.global expression context object to see if
   *  there is a defined blueprint module in it; use the blueprint
   *  symbols to set the current scope and return symbols
   */
  blueprintName(part: string, scope?: TSymbolData) {
    const fn = 'blueprintName:';
    if (scope)
      throw Error(`${fn} works on context, so don't provide scope override`);
    if (part === 'agent') return undefined; // skip agent prop in refs.global
    const ctx = this.refs.global || {};
    const bp = ctx[part];
    if (!bp) return undefined; // no match
    if (!bp.symbols) throw Error(`missing bundle symbles ${bp.name}`);
    this.cur_scope = bp.symbols; // advance scope pointer
    return bp; // valid scope is parent of cur_scope
  }
  /** check the current sm_cope or bundle for propName matches or undefined */
  propName(part: string, scope?: TSymbolData) {
    scope = scope || this.cur_scope;
    const ctx = scope || {};
    const propDict = ctx.props;
    if (!propDict) return undefined; // no props found
    const prop = propDict[part];
    if (!prop) return undefined; // no matching prop
    this.cur_scope = prop; // advance scope pointer
    return ctx.props; // valid scope is parent of cur_scope
  }

  /// SCOPE DRILLING //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next tokens
   */
  scopeObjRef(token: IToken): TSymbolData {
    const fn = 'scopeObjRef:';
    // error checks
    if (this.cur_scope === null)
      return new SymbolError('noparse', 'scopeObjRef needs cur_scope!==null');
    if (token === undefined) return new SymbolError('noparse', 'undefined token');
    // expect either an identifier or an objref, make parts into a string[] regardless
    let [tokType, parts] = UnpackToken(token);
    if (tokType === 'identifier') parts = [parts];
    if (tokType !== 'objref') {
      const symbols = this.cur_scope;
      return new SymbolError(
        'noparse',
        `token is '${tokType}', not objref`,
        symbols
      );
    }
    // (1) scan the first part and updat the scapee
    let terminal = parts.length === 1;
    let part = parts[0];
    let agent = this.agentLiteral(part);
    let feature = this.featureName(part);
    let prop = this.propName(part);
    let blueprint = this.blueprintName(part);
    if (agent) {
      if (DBG) console.log('agent', agent);
    } else if (feature) {
      if (DBG) console.log('feature', feature);
    } else if (prop) {
      if (DBG) console.log('prop', prop);
      if (terminal) {
        if (DBG) console.log('successful objref resolution');
        return prop; // prop symbols, exit!
      }
    } else if (blueprint) {
      if (DBG) console.log('blueprint', blueprint);
    } else {
      return new SymbolError('noscope', `invalid objref '${part}`);
    }

    // (2) scan remaining parts of objref which updates cur_scope
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      terminal = ii >= parts.length - 1;
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      prop = this.propName(part);
      feature = this.featureName(part);
      blueprint = this.blueprintName(part);
      if (prop) {
        if (terminal) return prop; // prop symbols, exit!
        continue;
      } else if (feature) {
        if (terminal) return feature; // feature symbols, exit
        continue;
      } else if (blueprint) {
        continue;
      }
      if (DBG) console.error(`${fn} can't find objref part ${part}`);
      return new SymbolError('noscope', `invalid objref '${part}'`);
    }
    // (3) if got this far, objref didn't resolve
    const err = `${fn} objref didn't resolve '${parts.join('.')}'`;
    if (DBG) console.error(err);
    return new SymbolError('noparse', err);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** given an existing symboldata scope set in this.cur_scope, looks for a method */
  scopeMethod(token: IToken): TSymbolData {
    // error checks
    if (this.cur_scope === null)
      return new SymbolError('noparse', 'scopeMethod needs cur_scope!==null');
    if (token === undefined) {
      const { methods } = this.cur_scope;
      if (methods)
        return new SymbolError('noparse', 'no token for methodName', { methods });
      return new SymbolError('noparse', 'no symscope with method dict');
    }
    // expect  an identifier
    let [tokType, methodName] = UnpackToken(token);
    if (tokType !== 'identifier') {
      const symbols = this.cur_scope;
      return new SymbolError(
        'noparse',
        `token is '${tokType}', not identifier`,
        symbols
      );
    }
    // more error checks
    if (methodName === undefined)
      return new SymbolError('noparse', 'expected identifier token');
    if (typeof methodName !== 'string')
      return new SymbolError('noscope', 'identifier is not string');

    // (1) does current scope have methods symbols?
    const { methods } = this.cur_scope;
    if (methods === undefined)
      return new SymbolError('noexist', 'no method dict found in symscope');

    const methodArgs = methods[methodName];
    // does the methodName exist in the method symbols?
    if (methodArgs === undefined)
      return new SymbolError(
        'noexist',
        `'${methodName}' is not a valid method name`
      );
    this.cur_scope = { [methodName]: methodArgs }; // advance scope pointer
    return methods; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** the incoming tokens are a variable-length array that are method
   *  arguments that are allowed per token. These are TSymKeywordArg
   *  which include enums and special values for tests, programs, etc
   *
   *  assumes that symscope is set to { [methodName:string]:TSymMethodArg}
   */
  scopeArgs(tokens: IToken[]): TSymbolData[] {
    if (tokens.length === 0)
      return [{ error: { code: 'noparse', info: 'no tokens to parse' } }];
    const vargs = [];
    // (1) we're expecting a SINGLE key indicating that there was a valid
    // method selected before scopeArgs was called
    const methodNames = [...Object.keys(this.cur_scope)];
    if (methodNames.length !== 1) {
      for (let i = 0; i < tokens.length; i++)
        vargs.push(new SymbolError('noexist', 'no methodArgs found in symscope'));
      return vargs;
    }

    const methodName = methodNames[0];
    const methodSignature = this.cur_scope[methodName];
    const { args, returns } = methodSignature;

    // note that tokens array is just the argument tokens, which are
    // any tokens after the methodName token
    if (tokens.length > args.length) console.warn('token overflow');
    if (tokens.length < args.length) console.warn('token underflow');

    let ii = 0;
    for (ii; ii < tokens.length; ii++) {
      // check for overflow

      if (ii > args.length - 1) {
        vargs.push(new SymbolError('over', 'more tokens than expected'));
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
        vargs.push(new SymbolError('under', 'fewer tokens than expecteds'));
      }
    return vargs;
  }
} // end of SymbolHelper class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SymbolHelper, // symbol decoder
  SymbolError // create a TSymbolData error object
};
export function HACK_ForceImport() {
  // force import of this module in Transpiler, otherwise webpack treeshaking
  // seems to cause it not to load
}
