/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SymbolValidator
  A collection of symbol utilities

  The intent of  is to lookup symbol data from a rawTok.
  Your provide a bundle and context
  It knows how to lookup features, programs, and blueprints.
  It knows how to dig into props.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as ENGINE from 'modules/datacore/dc-sim-data';
import * as BUNDLER from 'modules/datacore/dc-sim-bundler';
import * as TOKENIZER from 'script/tools/class-gscript-tokenizer-v2';

import { SymbolToken, ValidToken, InvalidToken } from './x-symbol-tokens';

// uses types defined in t-script.d

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMVALD', 'TagTest');

/** This class helps maintain a "current context" of symbols depending on
 *  a series of rawToks that affect what is "current". The use case is for
 *  a scriptUnit of keyword rawToks that establishes an initial context
 *  like a property that is 'drilled into' to retrieve props, methods,
 *  and method arguments.
 *
 *  It is used by the Keyword.validate() base method and its subclassers.
 *  First, set the parent contexts { bundle, globals }
 *
 *  USAGE:
 *    const shelper = new SymbolHelper('label')
 *    shelper.setRefs({ bundle, globals })
 *    // rawToks is a single scriptUnit for a statement
 *    const symbols = shelper.getKeywords(rawToks[0]);
 */
class SymbolValidator {
  refs: TSymbolRefs; // replaces rawTok, bundle, xtx_obj, symscope
  cur_scope: TSymbolData; // current scope as drilling down into objref
  bdl_scope: TSymbolData; // pointer to the top scope (blueprint bundle)
  keyword: string; // store the name of the keyword that created this instance
  scan_error: boolean; // set if a bad rawTok was encountered during scoping
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
  allKeywords(rawTok: IToken): SymbolToken {
    const [type, value] = TOKENIZER.UnpackToken(rawTok);
    const keywords = ENGINE.GetAllKeywords();
    if (type !== 'identifier' && type !== 'directive') {
      this.scan_error = true;
      return InvalidToken('errParse', 'no keyword rawTok', {
        keywords
      });
    }
    return ValidToken({ keywords }, value);
  }

  /// OBJECT-REFERENCE SORTERS ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search the current scope for a matching featureName */
  featureName(part: string) {
    const features = this.cur_scope.features;
    if (features === undefined) return undefined; // no match
    const feature = features[part];
    if (!feature) return undefined;
    this.cur_scope = feature; // advance scope
    return features; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

  /// PARSER: OBJECT REFERENCE ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next rawToks
   */
  objRef(rawTok: IToken): SymbolToken {
    // error checking & type overrides
    const fn = 'objRef:';
    this.resetScope();
    let [matchType, parts] = TOKENIZER.UnpackToken(rawTok);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error?
    if (this.scanError())
      return InvalidToken('errScope', `${fn} error in previous rawTok(s)`);
    // is the rawTok a valid identifier or objref rawTok?
    if (matchType === 'identifier') parts = [parts];
    else if (matchType !== 'objref') {
      this.scanError(true);
      return InvalidToken(
        'errParse',
        `${fn} improper or missing rawTok`,
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
      if (prop) return ValidToken(prop, part); // return agent scope {props}
      if (feature) return ValidToken(feature, part); // return feature scope {features,props}
    }
    // did any agent, feature, prop, or blueprint resolve?
    if (!(agent || feature || prop || blueprint)) {
      this.scanError(true);
      return InvalidToken('errScope', `${fn} invalid objref '${part}`);
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
        if (prop) return ValidToken(prop, unitText); // return agent scope {props}
        if (feature) return ValidToken(feature, unitText); // return feature scope {features,props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.scanError(true);
    const orStr = parts.join('.');
    return InvalidToken(
      'errParse',
      `${fn} '${orStr}' not found or invalid`,
      this.cur_scope
    );
  }

  /// PARSER: METHOD NAME /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** search current scope for a method dict with the method names */
  methodName(rawTok: IToken): SymbolToken {
    const fn = 'methodName:';
    let [matchType, methodName] = TOKENIZER.UnpackToken(rawTok);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${methodName}`));

    // was there a previous scope-breaking error?
    if (this.scanError())
      return InvalidToken('errScope', `${fn} error in previous rawTok(s)`);
    // is scope set?
    if (this.cur_scope === null)
      return InvalidToken('errScope', `${fn} unexpected invalid scope`);
    // is there a rawTok?
    if (rawTok === undefined) {
      this.scanError(true);
      const { methods } = this.cur_scope;
      return InvalidToken('errParse', `${fn} missing rawTok`, { methods });
    }
    // is the rawTok an identifier?
    if (matchType !== 'identifier') {
      this.scanError(true);
      const symbols = this.cur_scope;
      return InvalidToken(
        'errParse',
        `${fn} expects identifier, not ${matchType}`,
        symbols
      );
    }
    // is the indentifier defined?
    if (typeof methodName !== 'string') {
      this.scanError(true);
      return InvalidToken('errParse', `${fn} bad identifier`);
    }
    // is there a methods dictionary in scope
    const { methods } = this.cur_scope;
    if (methods === undefined) {
      this.scanError(true);
      return InvalidToken('errExist', `${fn} scope has no method dict`);
    }
    // does methodName exist in the methods dict?
    const methodSig = methods[methodName]; //
    if (methodSig === undefined) {
      this.scanError(true);
      return InvalidToken(
        'errExist',
        `${fn} '${methodName}' is not in method dict`,
        { methods }
      );
    }
    // all good!
    this.cur_scope = { [methodName]: methodSig }; // advance scope pointer
    return ValidToken({ methods }, methodName); // valid scope is parent of cur_scope
  }

  /// PARSER: METHOD ARGUMENTS ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** process the argument list that follows a methodName in GEMSCRIPT
   */
  argsList(rawToks: IToken[]): SymbolToken[] {
    const fn = 'argsList:';
    const vtoks = [];

    // is the current scope single-entry dictionary containing a method array?
    const methodNames = [...Object.keys(this.cur_scope)];
    if (methodNames.length !== 1) {
      for (let i = 0; i < rawToks.length; i++)
        vtoks.push(InvalidToken('errScope', `${fn} invalid methodArgs dict`));
      return vtoks;
    }
    // SCOPE ARGS 1: retrieve the method's argument symbol data
    const methodName = methodNames[0];
    const methodSignature: TSymMethodSig = this.cur_scope[methodName];
    // TODO: some keywords (e.g. 'when') may have multiple arrays
    const { args: mArgs } = methodSignature;
    methodSignature.name = methodName; // add optional methodName to TSymbolData

    // SCOPE ARGS 2: general validation rawToks for each argument
    // this loop structure is weird because we have to handle overflow
    // and underflow conditionss
    let tokenIndex = 0;
    for (tokenIndex; tokenIndex < rawToks.length; tokenIndex++) {
      // is the tokenIndex greater than the number of argument definitions?
      if (tokenIndex >= mArgs.length) {
        vtoks.push(InvalidToken('errOver', `${fn} method ignores extra arg`));
        continue;
      }
      // SCOPE ARGS 3: validate current rawTok against matching argument definition
      const rawTok = rawToks[tokenIndex];
      const kwArg = mArgs[tokenIndex];
      const vtok = this.argSymbol(kwArg, rawTok);
      vtok.setMethodSig(methodSignature);
      vtoks.push(vtok);
    }
    // check for underflow
    if (tokenIndex < mArgs.length)
      for (let ii = tokenIndex; ii < mArgs.length; ii++) {
        vtoks.push(
          InvalidToken('errUnder', `${fn} method requires ${mArgs.length} arg(s)`)
        );
      }
    return vtoks;
  }

  /// PARSER: METHOD ARGUMENT ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Return the symbols for an methodSig argType entry. Does NOT change scope
   *  because the scope is always the same methodSig symbol data
   */
  argSymbol(mArg: TSymArg, rawTok: IToken): SymbolToken {
    const fn = 'argSymbol:';
    const [argName, argType] = CHECK.UnpackArg(mArg);
    const [tokType, tokVal] = TOKENIZER.UnpackToken(rawTok);
    let symToken: SymbolToken;

    // a literal boolean value from rawTok.value
    if (argType === 'boolean') {
      let value = TOKENIZER.TokenValue(rawTok, 'value');
      if (typeof value === 'boolean')
        symToken = ValidToken({ arg: mArg }, value.toString());
      else
        symToken = InvalidToken('errType', `${tokType}:${tokVal} not a boolean`);
    }
    // a literal number value from rawTok.value
    if (argType === 'number') {
      let value = TOKENIZER.TokenValue(rawTok, 'value');
      if (typeof value === 'number')
        symToken = ValidToken({ arg: mArg }, value.toString());
      else
        symToken = InvalidToken('errType', `${tokType}:${tokVal} not a number`);
    }

    // a literal string from rawTok.string
    if (argType === 'string' && TOKENIZER.TokenValue(rawTok, 'string')) {
      symToken = ValidToken({ arg: mArg }, tokVal);
    }

    // an enumeration list match rawTok???
    // NOT IMPLEMENTED
    if (argType === 'enum') {
      symToken = InvalidToken('errParse', `${fn} enum is unimplemented`);
    }

    // all symbols available in current bundle match rawTok.objref
    if (argType === 'objref' && TOKENIZER.TokenValue(rawTok, 'objref')) {
      symToken = ValidToken(this.bdl_scope, argName);
    }

    // all props, feature props in bundle match rawTok.identifier
    if (argType === 'prop' && TOKENIZER.TokenValue(rawTok, 'identifier')) {
      symToken = ValidToken(this.bdl_scope, argName);
    }

    // all methods in bundle match rawTok.identifier
    if (argType === 'method' && TOKENIZER.TokenValue(rawTok, 'identifier')) {
      symToken = ValidToken(this.cur_scope, argName);
    }

    // all gvars available in system match rawTok.identifier
    if (argType === 'gvar' && TOKENIZER.TokenValue(rawTok, 'identifier')) {
      const map = ENGINE.GetPropTypesDict();
      const ctors = {};
      const list = [...map.keys()];
      list.forEach(ctorName => {
        ctors[ctorName] = map.get(ctorName).Symbols;
      });
      symToken = ValidToken({ ctors }, argName);
    }

    // all feature symbols in system match rawTok.identifier
    // e.g. addFeature
    if (argType === 'feature' && TOKENIZER.TokenValue(rawTok, 'identifier')) {
      const map = ENGINE.GetAllFeatures();
      const features = {}; // { [featureName: string]: TSymbolData };
      const list = [...map.keys()];
      list.forEach(featName => {
        features[featName] = ENGINE.GetFeature(featName).symbolize();
      });
      symToken = ValidToken({ features }, argName);
    }

    // all blueprint symbols in project match rawTok.identifier
    // e.g. when agent test, when agentA test agentB
    if (argType === 'blueprint' && TOKENIZER.TokenValue(rawTok, 'identifier')) {
      const list = ENGINE.GetAllBlueprintBundles();
      const blueprints = {};
      list.forEach(bundle => {
        blueprints[bundle.name] = bundle.symbols;
      });
      symToken = ValidToken({ blueprints }, argName);
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

    if (symToken === undefined) {
      console.group(...PR('UNHANDLED ARGTYPE'));
      console.groupEnd();
      return InvalidToken('errOops', `${fn} ${argType} has no token mapper`, {
        arg: mArg
      });
    }
    // hack in the gsType
    symToken.setType(argType);
    return symToken;
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
  SymbolValidator, // symbol decoder
  DecodeSymbolViewData,
  UnpackViewData,
  UnpackSymbolType
};
export function BindModule() {
  // HACK to force import of this module in Transpiler, otherwise webpack treeshaking
  // seems to cause it not to load
}
