/* eslint-disable react/static-property-placement */
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

import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as ENGINE from 'modules/datacore/dc-sim-data';
import * as TOKENIZER from 'script/tools/script-tokenizer';

// uses types defined in t-script.d

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMUTIL', 'TagTest');

/// TSYMBOLDATA UTILITY CLASSES ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type VSDOpts = {
  gsType: TGSType;
  unitText?: string;
  err_code?: TValidationErrorCodes;
  err_info?: string;
};
class VSDToken implements TSymbolData {
  // implement a subset of TSymbolData fields
  /** @constructor
   *  @param {TSymbolData} symbols optional set of symbols that were available
   *  @param {string} info optional tag, useful for adding context for errors
   */
  constructor(symbols?: TSymbolData, opt?: VSDOpts) {
    // if we want to remember the original scriptText word
    const { unitText, gsType, err_code, err_info } = opt || {};
    if (unitText) (this as any).unitText = unitText;
    if (gsType) (this as any).gsType = gsType;
    if (err_code || err_info) {
      (this as any).error = {
        code: err_code,
        info: err_info
      };
    }
    // add symbol data
    if (symbols) {
      const symbolKeys = [...Object.keys(symbols)];
      symbolKeys.forEach(key => {
        this[key] = symbols[key];
      });
    }
  }
}

/// SYMBOL HELPER CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This class helps maintain a "current context" of symbols depending on
 *  a series of tokens that affect what is "current". The use case is for
 *  a scriptUnit of keyword tokens that establishes an initial context
 *  like a property that is 'drilled into' to retrieve props, methods,
 *  and method arguments.
 *
 *  It is used by the Keyword.validate() base method and its subclassers.
 *  First, set the parent contexts { bundle, globals }
 *
 *  USAGE:
 *    const shelper = new SymbolHelper('label')
 *    shelper.setRefs({ bundle, globals })
 *    // tokens is a single scriptUnit for a statement
 *    const symbols = shelper.getKeywords(tokens[0]);
 */
class SymbolHelper {
  refs: TSymbolRefs; // replaces token, bundle, xtx_obj, symscope
  cur_scope: TSymbolData; // current scope as drilling down into objref
  bdl_scope: TSymbolData; // pointer to the top scope (blueprint bundle)
  keyword: string; // store the name of the keyword that created this instance
  scan_error: boolean; // set if a invalid token was encountered during scoping
  arg_index: number; // reset to 0 when a methodSig is set

  /// CONSTRUCTOR + INITIALIZERS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(keyword: string = '?') {
    this.refs = {
      bundle: null,
      globals: null
      // TSymbolRefs symbols is stored in this.cur_scope for ease of access
    };
    this.keyword = keyword;
    this.scan_error = false;
    this.arg_index = undefined; // numeric when methodSig is available
  }

  /** reference are the default lookup dictionaries. This is more than
   *  just the globals context, including the entire
   */
  setReferences(refs: any) {
    const fn = 'setReferences:';
    const { bundle, globals } = refs || {};
    if (bundle) {
      if (CHECK.IsValidBundle(bundle)) this.refs.bundle = bundle;
      else throw Error(`${fn} invalid bundle`);
    }
    if (!bundle.symbols)
      throw Error(`${fn} bundle ${bundle.name} has no symbol data`);
    if (globals) {
      if (typeof globals === 'object') this.setGlobal(globals);
      else throw Error(`${fn} invalid context`);
    }
    this.bdl_scope = this.refs.bundle.symbols;
    this.reset();
  }

  /// SCOPE ACCESSORS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    this.cur_scope = this.bdl_scope;
    this.scan_error = false;
    this.arg_index = undefined;
  }
  resetScope() {
    this.cur_scope = this.getInitialScope();
  }
  getInitialScope(): TSymbolData {
    return this.getBundleScope();
  }
  getCurrentScope(): TSymbolData {
    return this.cur_scope;
  }
  getBundleScope(): TSymbolData {
    return this.bdl_scope;
  }
  scanError(flag?: boolean) {
    const fn = 'scanError:';
    if (flag !== undefined) this.scan_error = Boolean(flag);
    return this.scan_error;
  }
  setGlobal(ctx: object) {
    this.refs.globals = ctx;
  }
  extendGlobal(ctxChild: object) {
    // TODO: use prototype chains
    const fn = 'extendGlobal:';
    console.log(`TODO: ${fn} should chain`, ctxChild);
  }

  /// SCOPE-INDEPENDENT GLOBAL ACCESSORS //////////////////////////////////////
  /// These methods don't rely on prior scope being set by prior passes,
  /// and are used for the very first units parsed in a line
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns a list of valid keywords for the script engine */
  allKeywords(token: IToken): TSymbolData {
    const [type, value] = TOKENIZER.UnpackToken(token);
    const keywords = ENGINE.GetAllKeywords();
    const gsType = 'keyword';
    if (type === 'comment' || type === 'line') {
      return new VSDToken({ keywords }, { gsType, unitText: value });
    }
    if (type !== 'identifier' && type !== 'directive') {
      this.scan_error = true;
      return new VSDToken(
        { keywords },
        { gsType, err_code: 'invalid', err_info: 'no keyword token' }
      );
    }
    return new VSDToken({ keywords }, { gsType: 'keyword', unitText: value });
  }

  /// STRING-BASED DICT SEARCHES ////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// These accessors use the refs.globals object which contains foreign
  /// blueprints to the current bundle. The when keyword for example has to add
  /// the blueprint name
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** If part is 'agent', return the bundle symbols or undefined. This is only
   *  used for objref check of first part
   */
  strAgentLiteral(part: string, scope?: TSymbolData) {
    const fn = 'agentLiteral:';
    if (scope)
      throw Error(`${fn} works only on bdl_scope, so don't try to override`);
    if (part !== 'agent') return undefined;
    this.cur_scope = this.bdl_scope;
    return this.bdl_scope; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search the refs.globals context object to see if there is a defined
   *  blueprint module in it; use the blueprint symbols to set the current scope
   *  and return symbols
   */
  strBlueprintName(part: string, scope?: TSymbolData) {
    const fn = 'strBlueprintName:';
    if (scope)
      throw Error(`${fn} works on context, so don't provide scope override`);
    if (part === 'agent') return undefined; // skip agent prop in refs.globals
    const ctx = this.refs.globals || {};
    const bp = ctx[part];
    if (!bp) return undefined; // no match
    if (!bp.symbols) throw Error(`missing bundle symbles ${bp.name}`);
    this.cur_scope = bp.symbols; // advance scope pointer
    return bp; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search the current scope for a matching strFeatureName */
  strFeatureName(part: string) {
    const features = this.cur_scope.features;
    if (features === undefined) return undefined; // no match
    const feature = features[part];
    if (!feature) return undefined;
    this.cur_scope = feature; // advance scope
    return features; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** check the current scope or bundle for strPropName matches or undefined. Use
   *  this in the cases where you DO NOT WANT an objectref instead, as you would
   *  for the addProp keyword */
  strPropName(strPropName: string) {
    const ctx = this.cur_scope || {};
    // is there a props dictionary in scope?
    const propDict = this.cur_scope.props;
    if (!propDict) return undefined; // no props found
    // does the strPropName exist?
    const prop = propDict[strPropName];
    if (!prop) return undefined; // no matching prop
    this.cur_scope = prop; // advance scope pointer
    return ctx; // valid scope is parent of cur_scope
  }

  /// SCOPE-BASED DICT SEARCHES ///////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next tokens
   */
  objRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'objRef:';
    const gsType = 'objref';
    this.resetScope();
    let [matchType, parts] = TOKENIZER.UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error?
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          unitText: parts,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // is the token a valid identifier or objref token?
    if (matchType === 'identifier') parts = [parts];
    else if (matchType !== 'objref') {
      this.scanError(true);
      return new VSDToken(this.getBundleScope(), {
        gsType,
        unitText: parts,
        err_code: 'invalid',
        err_info: `${fn} not an objref`
      });
    }
    // OBJREF PART 1: what kind of object are we referencing?
    // these calls will update cur_scope SymbolData appropriately
    let part = parts[0];
    let agent = this.strAgentLiteral(part);
    let feature = this.strFeatureName(part);
    let prop = this.strPropName(part);
    let blueprint = this.strBlueprintName(part);
    // is there only one part in this objref?
    let terminal = parts.length === 1;
    // does the objref terminate in a method-bearing reference?
    if (terminal) {
      if (prop) return new VSDToken(prop, { gsType, unitText: part }); // return agent scope {props}
      if (feature) return new VSDToken(feature, { gsType, unitText: part }); // return feature scope {features,props}
    }
    // did any agent, feature, prop, or blueprint resolve?
    if (!(agent || feature || prop || blueprint)) {
      this.scanError(true);
      return new VSDToken(
        {},
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} invalid objref '${part}'`
        }
      );
    }

    // OBJREF PART 2: are the remaining parts valid?
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      // are there any prop, feature, or blueprint references?
      // these calls drill-down into the scope for each part, starting in the
      // scope set in OBJREF PART 1
      prop = this.strPropName(part);
      feature = this.strFeatureName(part);
      blueprint = this.strBlueprintName(part);
      // is this part of the objref the last part?
      terminal = ii >= parts.length - 1;
      if (terminal) {
        const unitText = parts.join('.');
        if (prop) return new VSDToken(prop, { gsType, unitText }); // return agent scope {props}
        if (feature) return new VSDToken(feature, { gsType, unitText }); // return feature scope {features,props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.scanError(true);
    const orStr = parts.join('.');
    return new VSDToken(this.cur_scope, {
      gsType,
      unitText: orStr,
      err_code: 'invalid',
      err_info: `${fn} '${orStr}' not found or invalid`
    });
  }

  /** given an existing symboldata scope set in this.cur_scope, looks for a method.
   */
  methodName(token: IToken): TSymbolData {
    const fn = 'methodName:';
    const gsType = 'method';
    let [matchType, methodName] = TOKENIZER.UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${methodName}`));

    // was there a previous scope-breaking error?
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // is scope set?
    if (this.cur_scope === null)
      return new VSDToken(
        {},
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} unexpected invalid scope`
        }
      );
    // is there a token?
    if (token === undefined) {
      this.scanError(true);
      const { methods } = this.cur_scope;
      return new VSDToken(
        { methods },
        { gsType, err_code: 'empty', err_info: `${fn} missing token` }
      );
    }
    // is the token an identifier?
    if (matchType !== 'identifier') {
      this.scanError(true);
      const symbols = this.cur_scope;
      return new VSDToken(symbols, {
        gsType,
        unitText: TOKENIZER.TokenToUnitText(token),
        err_code: 'invalid',
        err_info: `${fn} expects identifier, not ${matchType}`
      });
    }
    // is the indentifier defined?
    if (typeof methodName !== 'string') {
      this.scanError(true);
      return new VSDToken(
        {},
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} invalid identifier`
        }
      );
    }
    // is there a methods dictionary in scope
    const { methods } = this.cur_scope;
    if (methods === undefined) {
      this.scanError(true);
      return new VSDToken(
        {},
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} scope has no method dict`
        }
      );
    }
    // does methodName exist in the methods dict?
    const methodSig = methods[methodName]; //
    if (methodSig === undefined) {
      this.scanError(true);
      return new VSDToken(
        {
          methods
        },
        {
          gsType,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} '${methodName}' is not in method dict`
        }
      );
    }
    // all good!
    this.cur_scope = { [methodName]: methodSig }; // advance scope pointer
    return new VSDToken({ methods }, { gsType, unitText: methodName }); // valid scope is parent of cur_scope
  }

  /// METHOD ARGUMENT SYMBOLS /////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** process the argument list that follows a methodName in GEMSCRIPT
   */
  argsList(tokens: IToken[]): TSymbolData[] {
    const fn = 'argsList:';
    const vtoks = [];

    // is the current scope single-entry dictionary containing a method array?
    const methodNames = [...Object.keys(this.cur_scope)];
    if (methodNames.length !== 1) {
      for (let i = 0; i < tokens.length; i++)
        vtoks.push(
          new VSDToken(
            {},
            {
              gsType: 'method',
              unitText: TOKENIZER.TokenToUnitText(tokens[i]),
              err_code: 'invalid',
              err_info: `${fn} invalid methodArgs dict`
            }
          )
        );
      return vtoks;
    }
    // SCOPE ARGS 1: retrieve the method's argument symbol data
    const methodName = methodNames[0];
    const methodSignature: TGSMethodSig = this.cur_scope[methodName];
    // TODO: some keywords (e.g. 'when') may have multiple arrays
    const { args } = methodSignature;
    methodSignature.name = methodName; // add optional methodName to TSymbolData

    // SCOPE ARGS 2: general validation tokens for each argument
    // this loop structure is weird because we have to handle overflow
    // and underflow conditionss
    let tokenIndex = 0;
    for (tokenIndex; tokenIndex < tokens.length; tokenIndex++) {
      // is the tokenIndex greater than the number of argument definitions?
      if (tokenIndex >= args.length) {
        vtoks.push(
          new VSDToken(
            {},
            {
              gsType: '{?}',
              unitText: TOKENIZER.TokenToUnitText(tokens[tokenIndex]),
              err_code: 'extra',
              err_info: `${fn} method ignores extra arg`
            }
          )
        );
        continue;
      }
      // SCOPE ARGS 3: validate current token against matching argument definition
      const tok = tokens[tokenIndex];
      const arg = args[tokenIndex];
      const vtok = this.argSymbol(arg, tok);
      vtok.methodSig = methodSignature;
      vtoks.push(vtok);
    } // end for
    // check for underflow
    if (tokenIndex < args.length)
      for (let ii = tokenIndex; ii < args.length; ii++) {
        const [argName, gsType] = CHECK.UnpackArg(args[ii]);
        vtoks.push(
          new VSDToken(
            {},
            {
              gsType,
              unitText: TOKENIZER.TokenToUnitText(tokens[tokenIndex]),
              err_code: 'empty',
              err_info: `${fn} method arg${ii} requires ${argName}:${gsType}`
            }
          )
        );
      }
    return vtoks;
  }

  /** Return the symbols for an methodSig argType entry. Does NOT change scope
   *  because the scope is always the same methodSig symbol data
   */
  argSymbol(methodArg, scriptToken): TSymbolData {
    const fn = 'argSymbol:';

    const [argName, gsType] = CHECK.UnpackArg(methodArg);
    const [tokType, tokVal] = TOKENIZER.UnpackToken(scriptToken);

    // data structures
    let symData;
    const arg = methodArg;
    const tok = scriptToken;

    // is this a literal boolean value from token.value
    if (gsType === 'boolean') {
      let value = TOKENIZER.TokenValue(tok, 'value');
      if (typeof value === 'boolean')
        symData = new VSDToken({ arg }, { gsType, unitText: value.toString() });
      else
        symData = new VSDToken(
          {},
          {
            gsType,
            unitText: TOKENIZER.TokenToUnitText(tok),
            err_code: 'invalid',
            err_info: `${tokType}:${tokVal} not a boolean`
          }
        );
    }
    // is this a literal number value from token.value
    if (gsType === 'number') {
      let value = TOKENIZER.TokenValue(tok, 'value');
      if (typeof value === 'number')
        symData = new VSDToken({ arg }, { gsType, unitText: value.toString() });
      else
        symData = new VSDToken(
          {},
          {
            gsType,
            unitText: TOKENIZER.TokenToUnitText(tok),
            err_code: 'invalid',
            err_info: `${tokType}:${tokVal} not a number`
          }
        );
    }

    // is this a literal string from token.string
    if (gsType === 'string' && TOKENIZER.TokenValue(tok, 'string')) {
      symData = new VSDToken({ arg }, tokVal);
    }

    // is this an enumeration list match token???
    // NOT IMPLEMENTED
    if (gsType === 'enum') {
      symData = new VSDToken(
        {},
        { gsType, err_code: 'debug', err_info: `${fn} enum is unimplemented` }
      );
    }

    // all symbols available in current bundle match token.objref
    if (gsType === 'objref' && TOKENIZER.TokenValue(tok, 'objref')) {
      symData = new VSDToken(this.bdl_scope, { gsType, unitText: argName });
    }

    // all props, feature props in bundle match token.identifier
    if (gsType === 'prop' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.bdl_scope, { gsType, unitText: argName });
    }

    // is this a method name? current scope is pointing to
    // the method dict, we hope...
    // all methods in bundle match token.identifier
    if (gsType === 'method' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.cur_scope, { gsType, unitText: argName });
    }

    // is this any gvar type?
    // all gvars available in system match token.identifier
    if (gsType === 'gvar' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const map = ENGINE.GetPropTypesDict();
      const ctors = {};
      const list = [...map.keys()];
      list.forEach(ctorName => {
        ctors[ctorName] = map.get(ctorName).Symbols;
      });
      symData = new VSDToken({ ctors }, { gsType, unitText: argName });
    }

    // is this a feature module name?
    // all feature symbols in system match token.identifier
    // e.g. addFeature
    if (gsType === 'feature' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const map = ENGINE.GetAllFeatures();
      const features = {}; // { [strFeatureName: string]: TSymbolData };
      const list = [...map.keys()];
      list.forEach(featName => {
        features[featName] = ENGINE.GetFeature(featName).symbolize();
      });
      symData = new VSDToken({ features }, { gsType, unitText: argName });
    }

    // is this a blueprint name? We allow any blueprint name in the dictionary
    // all blueprint symbols in project match token.identifier
    // e.g. when agent test, when agentA test agentB
    if (gsType === 'blueprint' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const list = ENGINE.GetAllBlueprintBundles();
      const blueprints = {};
      list.forEach(bundle => {
        blueprints[bundle.name] = bundle.symbols;
      });
      symData = new VSDToken({ blueprints }, { gsType, unitText: argName });
    }

    // if (gsType === 'test') {
    // }
    // if (gsType === 'program') {
    // }
    // if (gsType === 'event') {
    // }

    // if (gsType === 'expr') {
    // }
    // if (gsType === 'block') {
    // }
    // if (gsType === '{value}') {
    // }

    if (symData === undefined) {
      return new VSDToken(
        {
          arg
        },
        {
          gsType,
          err_code: 'debug',
          err_info: `${fn} ${gsType} has no token mapper`
        }
      );
    }
    // return valid symdata/validation
    return symData;
  }
} // end of SymbolHelper class

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: convert symbol data into lists suitable for gui rendering. this is
 *  the entire list of ALLOWED CHOICES; if you want to just know what unitText
 *  is, then use UnpackSymbol
 */
function DecodeSymbolViewData(symbolData: TSymbolData): TSymbolViewData {
  let sv_data: any = {};

  // check to see what
  const { error, unitText, keywords, features, props, methods, arg } = symbolData;
  if (unitText) sv_data.unitText = unitText;
  if (error)
    sv_data.error = {
      info: `${error.code} - ${error.info}`
    };
  if (keywords)
    sv_data.keywords = {
      info: keywords.join(', '),
      items: keywords
    };
  if (features) {
    const items = [...Object.keys(features)];
    sv_data.features = {
      info: items.join(', '),
      items
    };
  }
  if (props) {
    const items = [...Object.keys(props)];
    sv_data.props = {
      info: items.join(', '),
      items
    };
  }
  if (methods) {
    const items = [...Object.keys(methods)];
    sv_data.methods = {
      info: items.join(', '),
      items
    };
  }
  if (arg) {
    const [name, type] = CHECK.UnpackArg(arg);
    sv_data.arg = { info: arg, items: [name, type] };
  }
  return sv_data;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: returns an array all symbolTypes associatd with unitText:
 *  [ unitText, [ symbolType, items ], [ symbolType, items ], ... ]
 */
function UnpackViewData(svm_data: TSymbolViewData): any[] {
  const list = [];
  Object.keys(svm_data).forEach(key => {
    let value = svm_data[key];
    if (key === 'unitText') {
      list.unshift(value);
      return;
    }
    if (key === 'error') {
      list.push([key, value.text]);
      return;
    }
    if (key === 'arg') {
      //
    }
    const { items } = value;
    if (items) list.push([key, items]);
  });
  return list;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: Given a symbolData structure for unitText, return the SPECIFIC matching type
 *  instead of all allowed types
 */
function UnpackSymbolType(symbolData: TSymbolData): any[] {
  return [];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SymbolHelper, // symbol decoder
  VSDToken,
  DecodeSymbolViewData,
  UnpackViewData,
  UnpackSymbolType
};
export function BindModule() {
  // HACK to force import of this module in Transpiler, otherwise webpack treeshaking
  // seems to cause it not to load
}
