/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SymbolInterpreter class knows how to reference symbol tables and
  "dig into them" as it interprets a ScriptUnit token-by-token, returning
  a VSDToken. Every time a successful interpretation occurs (meaning that
  the script token referenced a symbol table that exists) the symbol data
  "scope" is updated; subsequent calls thus "drill down" deeper into the
  symbol table data structure.

  Setup requires providing the symbol tables through setSymbolTables(),
  then calling one of the interpreter methods with a scriptToken.
  The interpreter methods will always return a VSDToken; check for the
  presence of an `error` property to know whether there was a problem or not.

  If you need to scan from the top of the symbol tables, use reset().

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as TOKENIZER from 'script/tools/script-tokenizer';
import VSDToken from 'script/tools/class-validation-token';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMPRET', 'TagTest');

/// SYMBOL INTERPRETER CLASS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Interprets script tokens in the context of symbol data, returning a
 *  validation token detailing if it is correct. Requires symboltables
 *  to be passed as the data used to intepret a token. */
class SymbolInterpreter {
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
   *  just the globals context, including the entire */
  setSymbolTables(refs: any) {
    const fn = 'setSymbolTables:';
    if (refs === undefined) {
      console.warn(`${fn} no refs passed in`);
      throw Error(`${fn} refs are undefined`);
    }
    const { bundle, globals } = refs;
    if (DBG) console.log(`${fn} setting from`, refs);
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
    const fn = 'reset:';
    if (this.bdl_scope === undefined)
      throw Error(`${fn} bdl_scope is undefined, so nothing to reset to`);
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// These methods don't rely on prior scope being set by prior passes,
  /// and are used for the very first units parsed in a line
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns keyword validation */
  anyKeyword(token: IToken): TSymbolData {
    const [type, value] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const keywords = SIMDATA.GetKeywordSymbols();
    const gsType = 'keyword';
    if (type === 'comment' || type === 'line') {
      return new VSDToken(keywords, { gsType, unitText });
    }
    if (type !== 'identifier' && type !== 'directive') {
      this.scan_error = true;
      return new VSDToken(keywords, {
        gsType,
        err_code: 'invalid',
        err_info: 'no keyword token'
      });
    }
    return new VSDToken(keywords, { gsType, unitText });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return feature validation */
  anyFeature(token: IToken): TSymbolData {
    const [type, fName] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const features = SIMDATA.GetFeatureSymbols();
    const gsType = 'feature';
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(features, {
        gsType,
        unitText,
        err_code: 'invalid',
        err_info: 'featureName must be an identifier'
      });
    }
    if (!SIMDATA.GetFeature(fName)) {
      this.scan_error = true;
      return new VSDToken(features, {
        gsType,
        unitText,
        err_code: 'invalid',
        err_info: `${fName} is not a recognized feature`
      });
    }
    return new VSDToken(features, { gsType, unitText });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** valid pragma aka directive */
  pragma(token: IToken) {
    const [type, prName] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const pragmas = SIMDATA.GetPragmaSymbols();
    const gsType = 'pragma';
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(pragmas, {
        gsType,
        unitText,
        err_code: 'invalid',
        err_info: 'pragma must be an identifier'
      });
    }
    if (!SIMDATA.GetPragma(prName)) {
      this.scan_error = true;
      return new VSDToken(pragmas, {
        gsType,
        unitText,
        err_code: 'invalid',
        err_info: `${prName} is not a recognized pragma`
      });
    }
    this.cur_scope = pragmas.pragmas; // advance scope pointer
    return new VSDToken(pragmas, { gsType, unitText });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return propName format validation for addProp keyword, which doesn't need
   *  to look up a prop to see if it exists */
  simplePropName(token: IToken) {
    const [type, value] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsType = 'prop';
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(
        {}, // should this be symn
        {
          gsType,
          unitText,
          err_code: 'invalid',
          err_info: 'propName must be an identifier'
        }
      );
    }
    return new VSDToken({}, { gsType, unitText });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** look up the variable type (e.g. number, string, boolean )
   *  it will set cur_cope to the found propType symbolDict */
  propCtor(token: IToken) {
    const fn = 'propCtor:';
    const [type, propType] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsType = 'propType';
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(
        {}, // should this be symn
        {
          gsType,
          unitText,
          err_code: 'invalid',
          err_info: `propType must be an identifier`
        }
      );
    }
    // check it's a valid propType
    const propTypeSymbols = SIMDATA.GetPropTypeSymbols(); // { propTypes: { []:symbols }}
    const symbols = propTypeSymbols.propTypes[propType.toLowerCase()];
    if (!symbols) {
      this.scanError(true);
      return new VSDToken(this.cur_scope, {
        gsType,
        unitText,
        err_code: 'invalid',
        err_info: `${fn} '${propType}' not a valid propType`
      });
    }
    // it's good
    // prop
    this.cur_scope = propTypeSymbols.propTypes[propType.toLowerCase()]; //  { symbols for selected type }
    return new VSDToken(propTypeSymbols, {
      gsType,
      unitText,
      symbolScope: ['propTypes']
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** looks at the cur_scope, assuming it's the symbol dictionary a
   *  propType (e.g. SM_Number.Symbols). The 'setTo' method defines
   *  the kind of value it expects, which we pass then to argSymbol()
   *  for actual processing and returning of validation tokens */
  propCtorInitialValue(token: IToken) {
    // expecting scriptToken type boolean, string, or number
    const methodArg = this.cur_scope.methods.setTo.args[0];
    return this.argSymbol(methodArg, token);
  }

  /// STRING-BASED DICT SEARCHES ////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Used by the objref symbol checker. These accessors use the refs.globals
  /// object which contains foreign blueprints to the current bundle. The when
  /// keyword for example has to add the blueprint name
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** If part is 'agent', return the bundle symbols or undefined. This is only
   *  used for objref check of first part */
  strIsAgentLiteral(part: string, scope?: TSymbolData) {
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
   *  and return symbols */
  strIsBlueprintName(part: string, scope?: TSymbolData) {
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
  /** search the current scope for a matching strIsFeatureName */
  strIsFeatureName(part: string) {
    const features = this.cur_scope.features;
    if (features === undefined) return undefined; // no match
    const feature = features[part];
    if (!feature) return undefined;
    this.cur_scope = feature; // advance scope
    return features; // valid scope is parent of cur_scope
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** check the current scope or bundle for strIsPropIdentifier matches or
   *  undefined. Use this in the cases where you DO NOT WANT an objectref
   *  instead, as you would for the addProp keyword */
  strIsPropIdentifier(strIsPropIdentifier: string) {
    const ctx = this.cur_scope || {};
    // is there a props dictionary in scope?
    const propDict = this.cur_scope.props;
    if (!propDict) return undefined; // no props found
    // does the strIsPropIdentifier exist?
    const prop = propDict[strIsPropIdentifier];
    if (!prop) return undefined; // no matching prop
    this.cur_scope = prop; // advance scope pointer
    return ctx; // valid scope is parent of cur_scope
  }

  /// V1.0 SYMBOL SUPPORT METHODS /////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle complete list of feature props and methods.
   *  Currently not used
   *  agent.propname, propName, Blueprint.propName  */
  agentFeature(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'agentFeature:';
    const gsType = 'objref';
    this.resetScope(); // points to the bundle.symbols to start
    let [matchType, featureName] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(featureName)
      ? featureName.join('.')
      : featureName;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${featureName}`));
    // was there a previous scope-breaking error? bail!
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          symbolScope: ['features'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType !== 'identifier') {
      this.scanError(true);
      return new VSDToken(
        { features: this.getBundleScope().features },
        {
          gsType,
          symbolScope: ['features'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    const feature = this.strIsFeatureName(featureName);
    if (!feature) {
      this.scanError(true);
      return new VSDToken(this.cur_scope, {
        gsType,
        symbolScope: ['features'], // this is what's 'displayable' by GUI
        unitText,
        err_code: 'invalid',
        err_info: `${fn} '${unitText}' not found or invalid`
      });
    }
    return new VSDToken(
      { features: feature }, // this is the full symbol dict { features, props }
      {
        gsType,
        symbolScope: ['features'], // this is what's 'displayable' by GUI
        unitText: featureName
      }
    ); // return agent scope {props}
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle list of available features for featProp keyword */
  agentFeatureList(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'agentFeatureList:';
    const gsType = 'objref';
    this.resetScope(); // points to the bundle.symbols to start
    const featuresList = [...Object.keys(this.getBundleScope().features)];
    let [matchType, featureName] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(featureName)
      ? featureName.join('.')
      : featureName;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${featureName}`));
    // was there a previous scope-breaking error? bail!
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType !== 'identifier') {
      this.scanError(true);
      return new VSDToken(
        { features: this.getBundleScope().features },
        {
          gsType,
          symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    const features = this.cur_scope.features;
    const feature = features[featureName];
    if (!feature) {
      this.scanError(true);
      return new VSDToken(this.cur_scope, {
        gsType,
        symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
        unitText,
        err_code: 'invalid',
        err_info: `${fn} '${unitText}' not found or invalid`
      });
    }
    this.cur_scope = feature;
    return new VSDToken(
      { featuresList }, // this is the full symbol dict { features, props }
      {
        gsType,
        symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
        unitText: featureName
      }
    ); // return agent scope {props}
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle object refs for prop keyword
   *  agent.propname, propName, Blueprint.propName  */
  agentObjRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'agentObjRef:';
    const gsType = 'objref';
    this.resetScope(); // points to the bundle.symbols to start
    let [matchType, featureName] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(featureName)
      ? featureName.join('.')
      : featureName;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${featureName}`));
    // was there a previous scope-breaking error? bail!
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType === 'identifier') featureName = [featureName];
    else if (matchType !== 'objref') {
      this.scanError(true);
      return new VSDToken(
        { props: this.getBundleScope().props },
        {
          gsType,
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    // OBJREF PART 1: what kind of object are we referencing?
    // these calls will update cur_scope SymbolData appropriately
    let part = featureName[0];
    let agent = this.strIsAgentLiteral(part);
    let prop = this.strIsPropIdentifier(part);
    let blueprint = this.strIsBlueprintName(part);
    // is there only one part in this objref?
    let terminal = featureName.length === 1;
    // does the objref terminate in a method-bearing reference?
    if (terminal) {
      if (prop)
        return new VSDToken(
          prop, // this is the full symbol dict { features, props }
          {
            gsType,
            symbolScope: ['props'], // this is what's 'displayable' by GUI
            unitText: part
          }
        ); // return agent scope {props}
    }

    // did any agent, feature, prop, or blueprint resolve?
    if (!(agent || prop || blueprint)) {
      this.scanError(true);
      return new VSDToken(this.getBundleScope(), {
        gsType,
        symbolScope: ['props'], // this is what's 'displayable' by GUI
        unitText,
        err_code: 'invalid',
        err_info: `${fn} invalid objref '${part}'`
      });
    }

    // OBJREF PART 2: are the remaining parts valid?
    for (let ii = 1; ii < featureName.length; ii++) {
      part = featureName[ii];
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      // are there any prop, feature, or blueprint references?
      // these calls drill-down into the scope for each part, starting in the
      // scope set in OBJREF PART 1
      prop = this.strIsPropIdentifier(part);
      blueprint = this.strIsBlueprintName(part);
      // is this part of the objref the last part?
      terminal = ii >= featureName.length - 1;
      if (terminal) {
        if (prop)
          return new VSDToken(
            prop, // this is the full symbol dict
            {
              gsType,
              symbolScope: ['props'], // this is what's 'displayable' by GUI
              unitText
            }
          ); // return agent scope {props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.scanError(true);
    return new VSDToken(this.cur_scope, {
      gsType,
      symbolScope: ['props'], // this is what's 'displayable' by GUI
      unitText,
      err_code: 'invalid',
      err_info: `${fn} '${unitText}' not found or invalid`
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle feature object refs for the featProp keyword agent.featPropName,
   *  featPropName, Blueprint.featPropName  */
  featObjRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'featObjRef:';
    const gsType = 'objref';
    // this.resetScope(); // points to the bundle.symbols to start
    let [matchType, parts] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(parts) ? parts.join('.') : parts;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error? bail!
    if (this.scanError())
      return new VSDToken(
        {},
        {
          gsType,
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType === 'identifier') parts = [parts];
    else if (matchType !== 'objref') {
      this.scanError(true);
      return new VSDToken(
        { props: this.getBundleScope().props },
        {
          gsType,
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    // OBJREF PART 1: what kind of object are we referencing?
    // these calls will update cur_scope SymbolData appropriately
    let part = parts[0];
    let prop = this.strIsPropIdentifier(part);
    let terminal = parts.length === 1;
    // does the objref terminate in a method-bearing reference?
    if (terminal) {
      if (prop)
        return new VSDToken(
          prop, // this is the full symbol dict { features, props }
          {
            gsType,
            symbolScope: ['props'], // this is what's 'displayable' by GUI
            unitText: part
          }
        ); // return agent scope {props}
    }

    // did any agent, feature, prop, or blueprint resolve?
    if (!prop) {
      this.scanError(true);
      return new VSDToken(this.cur_scope, {
        gsType,
        unitText,
        symbolScope: ['props'],
        err_code: 'invalid',
        err_info: `${fn} invalid objref '${part}'`
      });
    }

    // OBJREF PART 2: are the remaining parts valid?
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      // are there any prop, feature, or blueprint references?
      // these calls drill-down into the scope for each part, starting in the
      // scope set in OBJREF PART 1
      prop = this.strIsPropIdentifier(part);
      // is this part of the objref the last part?
      terminal = ii >= parts.length - 1;
      if (terminal) {
        if (prop)
          return new VSDToken(
            prop, // this is the full symbol dict
            {
              gsType,
              symbolScope: ['props'], // this is what's 'displayable' by GUI
              unitText
            }
          ); // return agent scope {props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.scanError(true);
    return new VSDToken(this.cur_scope, {
      gsType,
      unitText,
      err_code: 'invalid',
      err_info: `${fn} '${unitText}' not found or invalid`
    });
  }
  /// SCOPE-BASED INTERPRETER METHODS /////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next tokens */
  objRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'objRef:';
    const gsType = 'objref';
    this.resetScope();
    let [matchType, parts] = TOKENIZER.UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error? bail!
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
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
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
    let agent = this.strIsAgentLiteral(part);
    let feature = this.strIsFeatureName(part);
    let prop = this.strIsPropIdentifier(part);
    let blueprint = this.strIsBlueprintName(part);
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
      return new VSDToken(this.getBundleScope(), {
        gsType,
        unitText: TOKENIZER.TokenToUnitText(token),
        err_code: 'invalid',
        err_info: `${fn} invalid objref '${part}'`
      });
    }

    // OBJREF PART 2: are the remaining parts valid?
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      //
      if (DBG) console.log('scanning', ii, 'for', part, 'in', this.cur_scope);
      // are there any prop, feature, or blueprint references?
      // these calls drill-down into the scope for each part, starting in the
      // scope set in OBJREF PART 1
      prop = this.strIsPropIdentifier(part);
      feature = this.strIsFeatureName(part);
      blueprint = this.strIsBlueprintName(part);
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

  /** given an existing symboldata scope set in this.cur_scope, looks for a method. */
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

  /// METHOD ARGUMENT INTERPRETER METHODS /////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** process the argument list that follows a methodName in GEMSCRIPT */
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
    // if (args === undefined) debugger;
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
        // eslint-disable-next-line no-continue
        continue;
      }
      // SCOPE ARGS 3: validate current token against matching argument definition
      const tok = tokens[tokenIndex];
      const arg = args[tokenIndex];

      /* THE MONEY CALL */
      const vtok = this.argSymbol(arg, tok);
      /* THE MONEY CALL */

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
   *  because the scope is always the same methodSig symbol data */
  argSymbol(methodArg, scriptToken): TSymbolData {
    const fn = 'argSymbol:';

    const [argName, gsType] = CHECK.UnpackArg(methodArg);
    const [tokType, tokVal] = TOKENIZER.UnpackToken(scriptToken);

    // data structures
    let symData;
    const arg = methodArg;
    const tok = scriptToken;
    // default unit text
    const unitText = TOKENIZER.TokenToUnitText(tok);
    // is this a literal boolean value from token.value
    if (gsType === 'boolean') {
      let value = TOKENIZER.TokenValue(tok, 'value');
      if (typeof value === 'boolean')
        symData = new VSDToken({ arg }, { gsType, unitText });
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
        symData = new VSDToken({ arg }, { gsType, unitText });
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
    if (gsType === 'string') {
      let value = TOKENIZER.TokenValue(tok, 'string');
      if (typeof value === 'string')
        // symData = new VSDToken({ arg }, tokVal);
        symData = new VSDToken({ arg }, { gsType, unitText });
      else
        symData = new VSDToken(
          {},
          {
            gsType,
            unitText: TOKENIZER.TokenToUnitText(tok),
            err_code: 'invalid',
            err_info: `${tokType}:${tokVal} not a string`
          }
        );
    }

    // all symbols available in current bundle match token.objref
    if (gsType === 'objref' && TOKENIZER.TokenValue(tok, 'objref')) {
      symData = new VSDToken(this.bdl_scope, {
        gsType,
        unitText,
        symbolScope: ['props'] // this is what's 'displayable' by GUI
      });
    }

    // all props, feature props in bundle match token.identifier
    if (gsType === 'prop' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.bdl_scope, {
        gsType,
        unitText,
        symbolScope: ['props'] // this is what's 'displayable' by GUI
      });
    }

    // is this a method name? current scope is pointing to
    // the method dict, we hope...
    // all methods in bundle match token.identifier
    if (gsType === 'method' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.cur_scope, {
        gsType,
        unitText,
        symbolScope: ['methods'] // this is what's 'displayable' by GUI
      });
    }

    // is this any propType?
    // all propTypes available in system match token.identifier
    if (gsType === 'propType' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const map = SIMDATA.GetPropTypesDict();
      const ctors = {};
      const list = [...map.keys()];
      list.forEach(ctorName => {
        ctors[ctorName] = SIMDATA.GetPropTypeSymbolsFor(ctorName);
      });
      symData = new VSDToken({ ctors }, { gsType, unitText });
    }

    // is this a feature module name?
    // all feature symbols in system match token.identifier
    // e.g. addFeature
    if (gsType === 'feature' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const map = SIMDATA.GetAllFeatures();
      const features = {}; // { [strIsFeatureName: string]: TSymbolData };
      const list = [...map.keys()];
      list.forEach(featName => {
        features[featName] = SIMDATA.GetFeature(featName).symbolize();
      });
      symData = new VSDToken(
        { features },
        {
          gsType,
          unitText,
          symbolScope: ['features'] // this is what's 'displayable' by GUI
        }
      );
    }

    // is this a blueprint name? We allow any blueprint name in the dictionary
    // all blueprint symbols in project match token.identifier
    // e.g. when agent test, when agentA test agentB
    if (gsType === 'blueprint' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const list = SIMDATA.GetAllBlueprintBundles();
      const blueprints = {};
      list.forEach(bundle => {
        blueprints[bundle.name] = bundle.symbols;
      });
      symData = new VSDToken(
        { blueprints },
        {
          gsType,
          unitText
          // no need for symbolScope because we want to show all props and features???
        }
      );
    }

    // Named tests are TSMCPrograms which must return true/false
    // This is a future GEMSCRIPT 2.0 feature, and are not implemented
    if (gsType === 'test') {
      symData = new VSDToken(
        {},
        {
          err_code: 'debug',
          err_info: 'named programs are a gemscript 2.0 feature',
          gsType,
          unitText
        }
      );
    }

    // Named programs are TSMCPrograms which can accept/return args on the stack
    // This is a future GEMSCRIPT 2.0 feature, and are not implemented
    if (gsType === 'program') {
      symData = new VSDToken(
        {},
        {
          err_code: 'debug',
          err_info: 'named programs are a gemscript 2.0 feature',
          gsType,
          unitText
        }
      );
    }

    // Events are TSMCPrograms that are declared with the `onEvent` keyword
    if (gsType === 'event') {
      const list = SIMDATA.GetAllScriptEventNames();
      const events = list.map(entry => {
        const [eventName] = entry;
        return eventName;
      });
      symData = new VSDToken(
        { events },
        {
          gsType,
          unitText
        }
      );
    }

    // expressions
    if (gsType === 'expr') {
      symData = new VSDToken(
        {},
        {
          err_code: 'debug',
          err_info: 'expr types todo',
          gsType,
          unitText
        }
      );
    }

    // blocks aka consequent, alternate
    if (gsType === 'block') {
      symData = new VSDToken(
        {},
        {
          err_code: 'debug',
          err_info: 'block types todo',
          gsType,
          unitText
        }
      );
    }

    // values can be one of anything
    if (gsType === '{value}') {
      if (tokType === 'expr') {
        // determine if expr is valid
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} expr todo', gsType, unitText }
        );
      }
      // determine if objref is valid
      if (tokType === 'objref') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} objref todo', gsType, unitText }
        );
      }
      if (tokType === 'string') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} string todo', gsType, unitText }
        );
      }
      if (tokType === 'value') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} value todo', gsType, unitText }
        );
      }
      if (symData === undefined) {
        symData = new VSDToken(
          {},
          {
            err_code: 'invalid',
            err_info: '{value} unrecognized type',
            gsType,
            unitText
          }
        );
      }
    }

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

  /// SYMBOL DICT ACCESS //////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  allKeywordSymbols(): TSymbolData {
    return;
  }

  /// DEREF FUNCTIONS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** similar to objRef algorith, which we'll just rip off right now */
  derefProp(token: IToken, refs: TSymbolRefs): TSM_PropFunction {
    const fn = 'derefProp:';
    this.setSymbolTables(refs);
    let [matchType, parts] = TOKENIZER.UnpackToken(token);
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier

    if (matchType === 'identifier') parts = [parts];
    else if (matchType === 'jsString') parts = [parts];
    else if (matchType !== 'objref') {
      console.warn('matchtype', matchType, parts, 'invalid...returning void');
      return undefined;
    }

    //
    const unitText = parts.join('.');
    let part = parts[0];
    // look for a matching scope dictionary
    let f = this.strIsFeatureName(part);
    let b = this.strIsBlueprintName(part) || SIMDATA.GetBlueprintSymbolsFor(part);
    let a = this.strIsAgentLiteral(part);
    let p = this.strIsPropIdentifier(part);
    // check for single part property
    let terminal = parts.length === 1;
    //
    if (f) console.log('** 0 ** feature', f);
    if (b) console.log('** 0 ** blueprint', b);
    if (a) console.log('** 0 ** agent', a);
    if (p) console.log('** 0 ** prop', p);
    //
    if (terminal) {
      // single identifier objref (e.g. energyLevel)
      if (p) {
        const deref = (agent: IAgent, state: IState) => {
          const prop = agent.getProp(part);
          return prop;
        };
        return deref;
      }
      throw Error(`${fn} ${unitText} isn't a prop`);
    }
    // loop through subsequent scopes to make "dereference stack"
    const dStack = [];
    // first save the first scope that didn't terminate...
    if (f) dStack.push({ ctx: 'feature', key: part });
    else if (b) dStack.push({ ctx: 'blueprint', key: part });
    else if (a) dStack.push({ ctx: 'agent', key: part });
    else throw Error(`${fn} non-evaluable ${unitText}`);
    //
    // now loop through subsequent scopes to make "dereference stack"
    //
    for (let ii = 1; ii < parts.length; ii++) {
      part = parts[ii];
      f = this.strIsFeatureName(part);
      b = this.strIsBlueprintName(part) || SIMDATA.GetBlueprintSymbolsFor(part);
      p = this.strIsPropIdentifier(part);
      terminal = ii >= parts.length - 1;
      //
      if (f) console.log('**', ii, '** feature', f);
      if (b) console.log('**', ii, '** blueprint', b);
      if (p) console.log('**', ii, '** prop', p);
      //
      if (b) dStack.push({ ctx: 'blueprint', key: part });
      else if (f) dStack.push({ ctx: 'feature', key: part });
      else if (p) dStack.push({ ctx: 'prop', key: part });
      else throw Error(`${fn} non-evaluable ${unitText}`);
    }
    console.log('dstack', dStack);
    /*/
    THIS IS WHERE THE CODE GOES EEEP
    /*/
    dStack.forEach(pass => {
      const { ctx, key } = pass;
      if (ctx === 'feature') {
        // agent.getFeature(key)
        // TERMINAL
      }
      if (ctx === 'blueprint') {
        // const alien = globals[key];
        // ?prop
        // ?feature
        // ?feature/prop
      }
      if (ctx === 'agent') {
        // skip, can expect
        // ?prop
        // ?feature
        // ?feature/prop
      }
      if (ctx === 'prop') {
        // agent.getProp(key)
        // TERMINAL
      }
    });

    // 2 multi-part objref (e.g. Costume.costumeName)
    return (agent, ...args) => {
      console.log(agent.name);
    };
  }
} // end of SymbolInterpreter class

/// DEBUG TOOLS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** inspection tool to see simdata defined at runtime */
UR.AddConsoleTool('simdata', () => {
  console.log('All Functions', SIMDATA.GetAllFunctions());
  console.log('All Tests', SIMDATA.GetAllTests());
  console.log('All Programs', SIMDATA.GetAllPrograms());
  console.log('All Features', SIMDATA.GetAllFeatures());
  console.log('All EventNames', SIMDATA.GetAllScriptEventNames());
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SymbolInterpreter;
