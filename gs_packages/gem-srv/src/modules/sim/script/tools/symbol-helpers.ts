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

import {
  GetAllKeywords,
  GetFeature,
  GetAllFeatures,
  GetAllBlueprints,
  UnpackArg,
  UnpackToken,
  TokenValue,
  IsValidBundle,
  GetAllVarCtors
} from 'modules/datacore';
import {
  IToken,
  TSymbolData,
  TSymbolRefs,
  TSymbolErrorCodes,
  TSymMethodSig,
  TSymbolViewData
} from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMUTIL', 'TagTest');

/// TSYMBOLDATA UTILITY CLASSES ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class VSymToken implements TSymbolData {
  // implement a subset of TSymbolData fields
  /** @constructor
   *  @param {TSymbolData} symbols optional set of symbols that were available
   *  @param {string} info optional tag, useful for adding context for errors
   */
  constructor(symbols?: TSymbolData, unitText?: string) {
    // if we want to remember the original scriptText word
    if (unitText !== undefined) (this as any).unitText = unitText;
    // add symbol data
    if (symbols) {
      const symbolKeys = [...Object.keys(symbols)];
      symbolKeys.forEach(key => {
        this[key] = symbols[key];
      });
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class VSymError extends VSymToken {
  // add error-related TSymbolData fields
  error: { code: TSymbolErrorCodes; info: string };
  /** @constructor
   *  @param {TSymbolData} err_code specific code type
   *  @param {string} err_info description of what causes the error
   */
  constructor(
    err_code: TSymbolErrorCodes = 'errOops',
    err_info: string = '<none provided>',
    symbols?: TSymbolData,
    unitText?: string
  ) {
    super(symbols, unitText);
    // always deliver error
    this.error = {
      code: err_code,
      info: err_info
    };
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
  scan_error: boolean; // set if a bad token was encountered during scoping
  arg_index: number; // reset to 0 when a methodSig is set
  //
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** reference are the default lookup dictionaries. This is more than
   *  just the globals context, including the entire
   */
  setReferences(refs: any) {
    const fn = 'setReferences:';
    const { bundle, globals } = refs || {};
    if (bundle) {
      if (IsValidBundle(bundle)) this.refs.bundle = bundle;
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
    const [type, value] = UnpackToken(token);
    const keywords = GetAllKeywords();
    if (type !== 'identifier' && type !== 'directive') {
      this.scan_error = true;
      return new VSymError('errParse', 'no keyword token', {
        keywords
      });
    }
    return new VSymToken({ keywords }, value);
  }
  /** If part is 'agent', return the bundle symbols or undefined. This is only
   *  used for objref check of first part
   */
  agentLiteral(part: string, scope?: TSymbolData) {
    const fn = 'agentLiteral:';
    if (scope)
      throw Error(`${fn} works only on bdl_scope, so don't try to override`);
    if (part !== 'agent') return undefined;
    this.cur_scope = this.bdl_scope;
    return this.bdl_scope; // valid scope is parent of cur_scope
  }

  /// CONTEXT-DEPENDENT ACCESSORS /////////////////////////////////////////////
  /// These accessors use the refs.globals object which contains foreign
  /// blueprints to the current bundle. The when keyword for example has to add
  /// the blueprint name
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search the refs.globals context object to see if there is a defined
   *  blueprint module in it; use the blueprint symbols to set the current scope
   *  and return symbols
   */
  blueprintName(part: string, scope?: TSymbolData) {
    const fn = 'blueprintName:';
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

  /// SCOPE-DEPENDENT ACCESSOR/MODIFIERS //////////////////////////////////////
  /// search the current scope (or scope override
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search the current scope for a matching featureName
   */
  featureName(part: string) {
    const features = this.cur_scope.features;
    if (features === undefined) return undefined; // no match
    const feature = features[part];
    if (!feature) return undefined;
    this.cur_scope = feature; // advance scope
    return features; // valid scope is parent of cur_scope
  }
  /** check the current scope or bundle for propName matches or undefined. Use
   *  this in the cases where you DO NOT WANT an objectref instead, as you would
   *  for the addProp keyword */
  propName(propName: string) {
    const ctx = this.cur_scope || {};
    // is there a props dictionary in scope?
    const propDict = this.cur_scope.props;
    if (!propDict) return undefined; // no props found
    // does the propName exist?
    const prop = propDict[propName];
    if (!prop) return undefined; // no matching prop
    this.cur_scope = prop; // advance scope pointer
    return ctx; // valid scope is parent of cur_scope
  }
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next tokens
   */
  objRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'objRef:';
    this.resetScope();
    let [matchType, parts] = UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error?
    if (this.scanError())
      return new VSymError('errScope', `${fn} error in previous token(s)`);
    // is the token a valid identifier or objref token?
    if (matchType === 'identifier') parts = [parts];
    else if (matchType !== 'objref') {
      this.scanError(true);
      return new VSymError(
        'errParse',
        `${fn} improper or missing token`,
        this.getBundleScope()
      );
    }
    // OBJREF PART 1: what kind of object are we referencing?
    // these calls will update cur_scope SymbolData appropriately
    let part = parts[0];
    let agent = this.agentLiteral(part);
    let feature = this.featureName(part);
    let prop = this.propName(part);
    let blueprint = this.blueprintName(part);
    // is there only one part in this objref?
    let terminal = parts.length === 1;
    // does the objref terminate in a method-bearing reference?
    if (terminal) {
      if (prop) return new VSymToken(prop, part); // return agent scope {props}
      if (feature) return new VSymToken(feature, part); // return feature scope {features,props}
    }
    // did any agent, feature, prop, or blueprint resolve?
    if (!(agent || feature || prop || blueprint)) {
      this.scanError(true);
      return new VSymError('errScope', `${fn} invalid objref '${part}`);
    }

    // OBJREF PART 2: are the remaining parts valid?
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      // are there any prop, feature, or blueprint references?
      // these calls drill-down into the scope for each part, starting in the
      // scope set in OBJREF PART 1
      prop = this.propName(part);
      feature = this.featureName(part);
      blueprint = this.blueprintName(part);
      // is this part of the objref the last part?
      terminal = ii >= parts.length - 1;
      if (terminal) {
        const unitText = parts.join('.');
        if (prop) return new VSymToken(prop, unitText); // return agent scope {props}
        if (feature) return new VSymToken(feature, unitText); // return feature scope {features,props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.scanError(true);
    const orStr = parts.join('.');
    return new VSymError(
      'errParse',
      `${fn} '${orStr}' not found or invalid`,
      this.cur_scope
    );
  }
  /** given an existing symboldata scope set in this.cur_scope, looks for a method.
   */
  methodName(token: IToken): TSymbolData {
    const fn = 'methodName:';
    let [matchType, methodName] = UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${methodName}`));

    // was there a previous scope-breaking error?
    if (this.scanError())
      return new VSymError('errScope', `${fn} error in previous token(s)`);
    // is scope set?
    if (this.cur_scope === null)
      return new VSymError('errScope', `${fn} unexpected invalid scope`);
    // is there a token?
    if (token === undefined) {
      this.scanError(true);
      const { methods } = this.cur_scope;
      return new VSymError('errParse', `${fn} missing token`, { methods });
    }
    // is the token an identifier?
    if (matchType !== 'identifier') {
      this.scanError(true);
      const symbols = this.cur_scope;
      return new VSymError(
        'errParse',
        `${fn} expects identifier, not ${matchType}`,
        symbols
      );
    }
    // is the indentifier defined?
    if (typeof methodName !== 'string') {
      this.scanError(true);
      return new VSymError('errParse', `${fn} bad identifier`);
    }
    // is there a methods dictionary in scope
    const { methods } = this.cur_scope;
    if (methods === undefined) {
      this.scanError(true);
      return new VSymError('errExist', `${fn} scope has no method dict`);
    }
    // does methodName exist in the methods dict?
    const methodSig = methods[methodName]; //
    if (methodSig === undefined) {
      this.scanError(true);
      return new VSymError(
        'errExist',
        `${fn} '${methodName}' is not in method dict`,
        { methods }
      );
    }
    // all good!
    this.cur_scope = { [methodName]: methodSig }; // advance scope pointer
    return new VSymToken({ methods }, methodName); // valid scope is parent of cur_scope
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
        vtoks.push(new VSymError('errScope', `${fn} invalid methodArgs dict`));
      return vtoks;
    }
    // SCOPE ARGS 1: retrieve the method's argument symbol data
    const methodName = methodNames[0];
    const methodSignature: TSymMethodSig = this.cur_scope[methodName];
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
        vtoks.push(new VSymError('errOver', `${fn} method ignores extra arg`));
        continue;
      }
      // SCOPE ARGS 3: validate current token against matching argument definition
      const tok = tokens[tokenIndex];
      const arg = args[tokenIndex];
      const vtok = this.argSymbol(arg, tok);
      vtok.methodSig = methodSignature;
      vtoks.push(vtok);
    }
    // check for underflow
    if (tokenIndex < args.length)
      for (let ii = tokenIndex; ii < args.length; ii++) {
        vtoks.push(
          new VSymError('errUnder', `${fn} method requires ${args.length} arg(s)`)
        );
      }

    return vtoks;
  }
  /** Return the symbols for an methodSig argType entry. Does NOT change scope
   *  because the scope is always the same methodSig symbol data
   */
  argSymbol(arg, tok): TSymbolData {
    const fn = 'argSymbol:';
    const [argName, argType] = UnpackArg(arg);
    const [tokType, tokVal] = UnpackToken(tok);
    let symData;

    // a literal boolean value from token.value
    if (argType === 'boolean') {
      let value = TokenValue(tok, 'value');
      if (typeof value === 'boolean')
        symData = new VSymToken({ arg }, value.toString());
      else
        symData = new VSymError('errType', `${tokType}:${tokVal} not a boolean`);
    }
    // a literal number value from token.value
    if (argType === 'number') {
      let value = TokenValue(tok, 'value');
      if (typeof value === 'number')
        symData = new VSymToken({ arg }, value.toString());
      else
        symData = new VSymError('errType', `${tokType}:${tokVal} not a number`);
    }

    // a literal string from token.string
    if (argType === 'string' && TokenValue(tok, 'string')) {
      symData = new VSymToken({ arg }, tokVal);
    }

    // an enumeration list match token???
    // NOT IMPLEMENTED
    if (argType === 'enum') {
      symData = new VSymError('errParse', `${fn} enum is unimplemented`);
    }

    // all symbols available in current bundle match token.objref
    if (argType === 'objref' && TokenValue(tok, 'objref')) {
      symData = new VSymToken(this.bdl_scope, argName);
    }

    // all props, feature props in bundle match token.identifier
    if (argType === 'prop' && TokenValue(tok, 'identifier')) {
      symData = new VSymToken(this.bdl_scope, argName);
    }

    // all methods in bundle match token.identifier
    if (argType === 'method' && TokenValue(tok, 'identifier')) {
      symData = new VSymToken(this.cur_scope, argName);
    }

    // all gvars available in system match token.identifier
    if (argType === 'gvar' && TokenValue(tok, 'identifier')) {
      const map = GetAllVarCtors();
      const ctors = {};
      const list = [...map.keys()];
      list.forEach(ctorName => {
        ctors[ctorName] = map.get(ctorName).Symbols;
      });
      symData = new VSymToken({ ctors }, argName);
    }

    // all feature symbols in system match token.identifier
    // e.g. addFeature
    if (argType === 'feature' && TokenValue(tok, 'identifier')) {
      const map = GetAllFeatures();
      const features = {}; // { [featureName: string]: TSymbolData };
      const list = [...map.keys()];
      list.forEach(featName => {
        features[featName] = GetFeature(featName).symbolize();
      });
      symData = new VSymToken({ features }, argName);
    }

    // all blueprint symbols in project match token.identifier
    // e.g. when agent test, when agentA test agentB
    if (argType === 'blueprint' && TokenValue(tok, 'identifier')) {
      const list = GetAllBlueprints();
      const blueprints = {};
      list.forEach(bundle => {
        blueprints[bundle.name] = bundle.symbols;
      });
      symData = new VSymToken({ blueprints }, argName);
    }

    // if (argType === 'test') {
    // }
    // if (argType === 'program') {
    // }
    // if (argType === 'event') {
    // }

    // if (argType === 'expr') {
    // }
    // if (argType === 'block') {
    // }
    // if (argType === '{value}') {
    // }

    if (symData === undefined) {
      console.group(...PR('UNHANDLED ARGTYPE'));
      console.groupEnd();
      return new VSymError('errOops', `${fn} ${argType} has no token mapper`, {
        arg
      });
    }
    // hack in the gsType
    symData.gsType = argType;
    return symData;
  }
} // end of SymbolHelper class

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convert symbol data into lists suitable for gui rendering. this is the
 *  entire list of ALLOWED CHOICES; if you want to just know what unitText
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
    const [name, type] = UnpackArg(arg);
    sv_data.arg = { info: arg, items: [name, type] };
  }
  return sv_data;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns an array all symbolTypes associatd with unitText:
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
/** Given a symbolData structure for unitText, return the SPECIFIC matching type
 *  instead of all allowed types
 */
function UnpackSymbolType(symbolData: TSymbolData): any[] {
  return [];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SymbolHelper, // symbol decoder
  VSymError, // create a TSymbolData error object
  DecodeSymbolViewData,
  UnpackViewData,
  UnpackSymbolType
};
export function BindModule() {
  // HACK to force import of this module in Transpiler, otherwise webpack treeshaking
  // seems to cause it not to load
}
