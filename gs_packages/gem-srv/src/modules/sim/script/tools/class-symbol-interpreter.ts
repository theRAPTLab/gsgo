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
import * as HELP from 'app/help/codex';
import VSDToken from 'script/tools/class-validation-token';
import ERROR from 'modules/error-mgr';

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
  sm_parent: string; // host type found when digging for sm objects

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
    this.sm_parent = undefined;
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
    if (DBG && bundle._clone && bundle._clone > 0)
      console.log(`${fn}: FYI this is a temp clone bundle`);
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
  getBundleName(): string {
    return this.refs.bundle.name;
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
  getBundlePropSymbols(): TSymbolData {
    const props = this.bdl_scope.props || {};
    return props;
  }
  getBundleFeatureSymbols(): TSymbolData {
    const features = this.bdl_scope.features || {};
    return features;
  }
  setCurrentScope(symbols: TSymbolData) {
    const fn = 'setCurrentScope:';
    if (typeof symbols !== 'object') throw Error(`${fn} expect symbol object`);
    this.cur_scope = symbols;
  }
  setGlobal(ctx: object) {
    this.refs.globals = ctx;
  }
  extendGlobal(ctxChild: object) {
    // TODO: use prototype chains
    const fn = 'extendGlobal:';
    console.log(`TODO: ${fn} should chain`, ctxChild);
  }

  /// BOILERPLATE HELPERS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return true if a scan error had occured */
  detectScanError(flag?: boolean) {
    const fn = 'detectScanError:';
    if (flag !== undefined) this.scan_error = Boolean(flag);
    return this.scan_error;
  }
  /** return true if token is wrong type */
  detectTypeError(gsArg, token) {
    let [matchType] = TOKENIZER.UnpackToken(token);
    let [argName, argType] = CHECK.UnpackArg(gsArg);
    return matchType !== argType;
  }
  /** return unitText, tokType, tokValue from a token */
  extractTokenMeta(token) {
    const [tokType, tokValue] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    return [unitText, tokType, tokValue];
  }
  /** use if (this.detectScanError()) */
  vagueError(token: IToken): TSymbolData {
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = ':{?}';
    return new VSDToken(
      {},
      {
        gsArg,
        unitText,
        err_code: 'vague',
        err_info: `error in previous token(s)`
      }
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return a bad token */
  badToken(
    token: IToken,
    symbols: TSymbolData,
    { gsArg, err_info }: TSymbolMeta
  ) {
    const fn = 'badToken:';
    const unitText = TOKENIZER.TokenToString(token);
    // inspect in case of lazy use
    let err_code: TValidationErrorCodes;
    if (err_info === undefined) {
      err_code = 'debug';
      err_info = `debug: missing err_info in SymbolInterpreter call`;
    } else {
      err_code = 'invalid';
    }
    gsArg = gsArg || '??:{?}';
    symbols = symbols || {};
    // return
    this.scan_error = true;
    return new VSDToken(symbols, {
      gsArg,
      unitText,
      sm_parent: this.sm_parent,
      err_code,
      err_info
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return a 'valid' token, which has no error info */
  goodToken(
    token: IToken,
    symbols: TSymbolData,
    { gsArg, symbolScope }: TSymbolMeta
  ): VSDToken {
    const unitText = TOKENIZER.TokenToString(token);
    gsArg = gsArg || '??:{?}';
    symbols = symbols || {};
    // return
    return new VSDToken(symbols, {
      gsArg,
      symbolScope,
      unitText,
      sm_parent: this.sm_parent
    });
  }

  /// SCOPE-INDEPENDENT LITERAL VALIDATORS ////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** use to validate a token that can be any number */
  anyNumber(token: IToken): TSymbolData {
    const fn = 'anyNumber:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, value] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = HELP.ForGSArg('anyNumber') || ':number';
    const vtype = typeof value;
    if (type === 'value' && vtype === 'number')
      return new VSDToken({}, { gsArg, unitText });
    // if it's not value and type number, it's an error
    return new VSDToken(
      {},
      {
        gsArg,
        err_code: 'invalid',
        err_info: `${fn} should be number, not a '${vtype}'`
      }
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** use to validate a token that can be any string value */
  anyString(token: IToken): TSymbolData {
    const fn = 'anyString:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, string] = TOKENIZER.UnpackToken(token);
    // const unitText = TOKENIZER.TokenToString(token);
    const unitText = TOKENIZER.TokenToPlainString(token); // no quotes
    const gsArg = HELP.ForGSArg('anyString') || ':string';
    const stype = typeof string;
    if (type === 'string' && stype === 'string')
      return new VSDToken({}, { gsArg, unitText });
    // if it's not value and type number, it's an error
    return new VSDToken(
      {},
      {
        gsArg,
        err_code: 'invalid',
        err_info: `${fn} should be string, not a '${stype}'`
      }
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** use to validate a token that can be any boolean value */
  anyBoolean(token: IToken): TSymbolData {
    const fn = 'anyBoolean:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, boolean] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = HELP.ForGSArg('anyBoolean') || ':boolean';
    const btype = typeof boolean;
    if (type === 'boolean' && btype === 'boolean')
      return new VSDToken({}, { gsArg, unitText });
    // if it's not value and type number, it's an error
    return new VSDToken(
      {},
      {
        gsArg,
        err_code: 'invalid',
        err_info: `${fn} should be boolean, not a '${btype}'`
      }
    );
  }

  /// SCOPE-INDEPENDENT GLOBAL ACCESSORS //////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// These methods don't rely on prior scope being set by prior passes,
  /// and are used for the very first units parsed in a line
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns keyword validation */
  anyKeyword(token: IToken): TSymbolData {
    const fn = 'anyKeyword:';
    const [type, kwName] = TOKENIZER.UnpackToken(token); //
    const unitText = TOKENIZER.TokenToString(token);
    const keywords = SIMDATA.GetKeywordSymbols();
    const symbols = { keywords };

    // the first token in a statement is not always a keyword
    // that is an identifier token

    // encoded as { comment:'text' }
    if (type === 'comment')
      return this.goodToken(token, symbols, {
        gsArg: HELP.ForGSArg('comment')
      });

    // encoded as { line:'' }
    if (type === 'line')
      return this.goodToken(token, symbols, {
        gsArg: HELP.ForGSArg('line')
      });

    // encoded as { directive: '#' }
    if (type === 'directive')
      return this.goodToken(token, symbols, {
        gsArg: HELP.ForGSArg('directive')
      });

    // default gsarg type
    const gsArg = HELP.ForGSArg('anyKeyword') || 'command:keyword';

    // this will actually never run because for this method to be called
    // the keyword processor must have already been found
    if (!keywords.includes(kwName)) {
      return this.badToken(token, symbols, {
        gsArg,
        err_code: 'invalid',
        err_info: `no such command ${kwName}`
      });
    }
    if (type !== 'identifier' && type !== 'directive') {
      this.scan_error = true;
      return this.badToken(token, symbols, {
        gsArg,
        err_code: 'invalid',
        err_info: 'no keyword token'
      });
    }
    return this.goodToken(token, symbols, { gsArg });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** allow any valid blueprint in the system */
  anyBlueprintName(token: IToken): TSymbolData {
    const fn = 'anyBlueprintName:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, bpName] = TOKENIZER.UnpackToken(token);
    const gsArg = HELP.ForGSArg('anyBlueprintName') || ':blueprint';
    const bpSymbols = SIMDATA.GetBlueprintSymbols();
    const symbols: TSymbolData = { blueprints: bpSymbols as any };
    if (type !== 'identifier') {
      return this.badToken(token, symbols, {
        gsArg,
        err_info: 'CharacterType must be an identifier'
      });
    }
    // if the blueprint name is found
    if (bpSymbols[bpName])
      return this.goodToken(
        token,
        symbols, // valid choices are any blueprint symbol
        { gsArg }
      );
    // otherwise an error
    return this.badToken(
      token,
      symbols, // valid choices are any blueprint symbol
      { gsArg, err_info: `no blueprint named ${bpName}` }
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** allo9 any feature in the system  */
  anyFeatureName(token: IToken): TSymbolData {
    const fn = 'anyFeatureName:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, fName] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const features = SIMDATA.GetFeatureSymbols();
    const gsArg = HELP.ForGSArg('anyFeatureName') || ':feature';
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(features, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: 'featureName must be an identifier'
      });
    }
    if (!SIMDATA.GetFeature(fName)) {
      this.scan_error = true;
      return new VSDToken(features, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: `${fName} is not a recognized feature`
      });
    }
    return new VSDToken(features, { gsArg, unitText });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return list of events */
  anySystemEvent(token: IToken): TSymbolData {
    const fn = 'anySystemEvent:';
    if (this.detectScanError()) return this.vagueError(token);
    let [type, eventName] = TOKENIZER.UnpackToken(token);
    eventName = eventName.toUpperCase();
    const unitText = TOKENIZER.TokenToString(token);
    const eventNames = SIMDATA.GetAllScriptEventNames();
    const gsArg = HELP.ForGSArg('anySystemEvent') || ':event';
    const symbols = { events: eventNames };
    // wrong token type
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(symbols, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: 'systemEvent must be an identifier'
      });
    }
    // not a recognized event name (e.g. Tick)
    if (!eventNames.includes(eventName))
      return new VSDToken(symbols, {
        unitText,
        gsArg,
        err_code: 'invalid',
        err_info: `${fn} unknown system event '${eventName}'`
      });
    // valid we hope!
    return new VSDToken(
      { events: eventNames },
      {
        unitText,
        gsArg
      }
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns the name of when tests that are available in the system
   *  NOTE: currently when tests do NOT have symbol information for arguments, but
   *  in GEMSTEP 1.0 there are tests with arguments so we're skipping that */
  anyWhenTest(token: IToken): TSymbolData {
    if (this.detectScanError()) return this.vagueError(token);
    let [type, testName] = TOKENIZER.UnpackToken(token);
    const gsArg = HELP.ForGSArg('anyWhenTest') || ':test'; // note: the generic name for anything that returns T/F
    const whenTestSymbols = SIMDATA.GetWhenTestSymbols();
    const symbols = { methods: whenTestSymbols };
    // console.log('whenTestSymbols', whenTestSymbols);
    if (type !== 'identifier')
      return this.badToken(token, symbols, {
        gsArg,
        err_info: `wrong or missing token: ${type}:${testName}`
      });
    if (SIMDATA.GetWhenTest(testName))
      return this.goodToken(token, symbols, { gsArg });
    return this.badToken(token, symbols, {
      gsArg,
      err_info: `${testName} is not a valid whenTest`
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** returns a crude check of the expression to make sure it's valid, but
   *  does not yet check globals */
  anyExpr(token: IToken): TSymbolData {
    const fn = 'anyExpr:';
    if (this.detectScanError()) return this.vagueError(token);
    const [type, unitText] = TOKENIZER.UnpackToken(token);
    const exprString = TOKENIZER.TokenToPlainString(token);
    const gsArg = HELP.ForGSArg('anyExpr') || ':expr';
    if (type !== 'expr')
      return this.badToken(
        token,
        {},
        {
          gsArg,
          err_info: `token ${type} is not an expression string`
        }
      );
    //
    // REVIEW: This is only seeing if the expression itself can be
    // turned itnto so mething but it doesn't check against
    // valid symbols.  We need to run evaluate on this to make
    // sure everythihng is legal.
    // This needs the global context for a line.
    //
    // the global context with accessible objects...
    // const globals = {
    // agent: { prop: [], getProp: () => {} },
    // BlueprintA: {},
    // BlueprintB: {}
    // };
    const symbols = {};
    // try to parse and evaluate the expression
    // and catch any thrown errors
    let gotError: string;
    let ast;
    // try {
    ast = TOKENIZER.ParseExpression(exprString);
    // } catch (caught) {
    //   gotError = caught.toString();
    // }
    // if any errors got thrown, expression didn't validate
    if (gotError)
      return this.badToken(token, symbols, {
        gsArg,
        err_info: `parse: ${gotError}`
      });
    // REVIEW: placeholders
    //
    // // if the AST could be generated, then try evaluating it
    // gotError = '';
    // try {
    //   COMPILER.ValidateExpression(ast, globals);
    // } catch (err) {
    //   gotError = err.toString();
    // }
    // // if the expression could not be evaluated, return the error
    // if (gotError)
    //   return new VSDToken(symbols, {
    //     gsArg,
    //     err_info: `evaluate: ${gotError}`
    //   });
    // got this far, it's good!
    return this.goodToken(token, symbols, { gsArg });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** hardcoded every keyword test options. See every.tsx to see how compile()
   *  handle it */
  everyOption(token: IToken): TSymbolData {
    const fn = 'everyOption:';
    const [type, optFlag] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = HELP.ForGSArg('everyOption') || ':option';
    const symbols = { options: ['runAtStart', 'runAfter'] }; // hardcoded symbols
    if (type === undefined) {
      return new VSDToken(symbols, { gsArg, unitText: '' });
    }
    if (type === 'identifier') {
      if (symbols.options.includes(optFlag))
        return new VSDToken(symbols, { gsArg, unitText });
      // no match
      return new VSDToken(symbols, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: `${fn} '${optFlag}' is not a valid option for 'every' command`
      });
    }
    // not an identifier
    return new VSDToken(symbols, {
      gsArg,
      unitText,
      err_code: 'invalid',
      err_info: `${fn} token '${type}' is not a valid option for 'every' command`
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** valid pragma (encoded as { identifier: 'name' }) and comes after
   *  everyKeyword keyword #, where name is program, tag, or blueprint
   */
  pragma(token: IToken) {
    if (this.detectScanError()) return this.vagueError(token);
    let [unitText, tokType, prName] = this.extractTokenMeta(token);
    // convert old identifier into a objref array
    const gsArg = HELP.ForGSArg(`pragma_${prName.toLowerCase()}`) || '?:{?}';
    const pragmas = SIMDATA.GetPragmaMethodSymbols();
    const symbols = { pragmas };
    if (tokType !== 'identifier')
      return this.badToken(token, symbols as TSymbolData, {
        gsArg,
        err_info: `pragma expect identifier, not ${tokType}`
      });
    if (!SIMDATA.GetPragma(prName))
      return this.badToken(token, symbols as TSymbolData, {
        gsArg,
        err_info: `${prName} is not a recognized pragma`
      });

    const pragma = pragmas[prName.toUpperCase()];
    if (!pragma)
      return this.badToken(token, symbols as TSymbolData, {
        gsArg,
        err_info: `${prName} is not a recognized pragma`
      });
    this.setCurrentScope(pragma); // methodArgs
    return this.goodToken(token, symbols as TSymbolData, { gsArg });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** valid pragma arguments, called right after pragma() */
  pragmaArgs(tokens: IToken[]) {
    // expect scope to be set to method args structure: { name, ags }
    // program name
    // tag name value
    // blueprint name base
    const [arg1, arg2] = tokens;
    const { name, args } = this.getCurrentScope() as TGSMethodSig;

    // BLUEPRINT //////////////////////////////////////////////////////////////
    if (name === 'BLUEPRINT') {
      const [bpType, bpName] = CHECK.UnpackToken(arg1);
      const a1symbols = {};
      const [baseType, baseName] = CHECK.UnpackToken(arg2);
      const a2symbols = {};
      const gsArg = HELP.ForGSArg('pragma_blueprint_arg1');
      // at minimum we expect arg1 to be the name of the blueprint being defined
      if (bpType !== 'identifier')
        return [
          this.badToken(arg1, a1symbols, {
            gsArg,
            err_info: `expected blueprint name`
          })
          // HACK: hide base blueprint for GS 1.0
          // this.vagueError(arg2)
        ];
      // if there is an arg2, then check validity
      if (arg2 !== undefined) {
        if (baseType !== 'identifier')
          return [
            this.goodToken(arg1, a1symbols, { gsArg })
            // HACK: hide base blueprint for GS 1.0
            // this.badToken(arg2, a2symbols, {
            //   gsArg: HELP.ForGSArg('pragma_blueprint_arg2'),
            //   err_info: `expected an identifier`
            // })
          ];
        const base = SIMDATA.GetBlueprintSymbolsFor(baseName);
        if (base === undefined)
          return [
            this.goodToken(arg1, a1symbols, { gsArg })
            // HACK: hide base blueprint for GS 1.0
            // this.badToken(arg2, a2symbols, {
            //   gsArg: HELP.ForGSArg('pragma_blueprint_arg2'),
            //   err_info: `${baseName} is not an existing blueprint`
            // })
          ];
      }
      // everything is fine
      return [
        this.goodToken(arg1, a1symbols, { gsArg })
        // HACK: hide base blueprint for GS 1.0
        // this.goodToken(arg2, a2symbols, { gsArg: ':identifier' })
      ];
    }
    // PROGRAM ////////////////////////////////////////////////////////////////
    if (name === 'PROGRAM') {
      const bdlOuts = SIMDATA.GetBundleOutSymbols();
      const [, bundleOut] = CHECK.UnpackToken(arg1);
      const gsArg = HELP.ForGSArg('pragma_program_arg');
      // good bundle program
      if (CHECK.IsValidBundleProgram(bundleOut.toUpperCase())) {
        return [this.goodToken(arg1, { bdlOuts }, { gsArg })];
      }
      // not a valid bundle program
      return [
        this.badToken(
          arg1,
          { bdlOuts },
          {
            gsArg,
            err_info: `${bundleOut} is not a recognizied bundleOut directive`
          }
        )
      ];
    }
    // TAGS ///////////////////////////////////////////////////////////////////
    if (name === 'TAG') {
      const tags = SIMDATA.GetBundleTagSymbols();
      const symbols = { tags } as TSymbolData;
      const [tagType, tagName] = CHECK.UnpackToken(arg1);
      const [valueType, value] = CHECK.UnpackToken(arg2);
      const gsArg = HELP.ForGSArg('pragma_tag_arg1');
      if (tagType !== 'identifier')
        return [
          this.badToken(arg1, symbols, {
            gsArg,
            err_info: `expected an identifier`
          }),
          this.vagueError(arg2)
        ];
      let goodTagName = SIMDATA.IsBundleTagName(tagName);
      if (goodTagName === undefined)
        return [
          this.badToken(arg1, symbols, {
            gsArg,
            err_info: `${tagName} is not a recognized tag`
          }),
          this.vagueError(arg2)
        ];
      // valid tag
      if (valueType !== 'value' || typeof value !== 'boolean')
        return [
          this.goodToken(arg1, symbols, { gsArg }),
          this.badToken(
            arg2,
            {},
            {
              gsArg: HELP.ForGSArg('pragma_tag_arg2'),
              err_info: `tag value must be boolean not ${valueType}`
            }
          )
        ];
      // got this far, it's probably ok!
      return [
        this.goodToken(arg1, symbols, { gsArg }),
        this.goodToken(arg2, {}, { gsArg: HELP.ForGSArg('pragma_tag_arg2') })
      ];
    }
    // UNHANDLED //////////////////////////////////////////////////////////////
    return [
      this.badToken(
        arg1,
        {},
        { gsArg: ':{?}', err_info: `unhandled pragma ${name}` }
      )
    ];
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return propName format validation for addProp keyword, which doesn't need
   *  to look up a prop to see if it exists */
  simplePropName(token: IToken) {
    const [type, value] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = HELP.ForGSArg('simplePropName') || ':prop';
    if (type !== 'identifier') {
      this.scan_error = true;
      return this.badToken(
        token,
        {},
        {
          gsArg,
          err_info: 'propName must be an identifier'
        }
      );
    }
    return this.goodToken(token, {}, { gsArg });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** look up the variable type (e.g. number, string, boolean )
   *  addProp propName propType propInitValu
   *  it will set cur_cope to the found propType symbolDict */
  anyPropType(token: IToken) {
    const fn = 'anyPropType:';
    // check it's a valid propType
    const [type, propType] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = HELP.ForGSArg('anyPropType') || ':propType';

    if (this.detectScanError())
      return new VSDToken(
        {},
        {
          gsArg,
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );

    const symbols = { propTypes: SIMDATA.GetPropTypeSymbols() }; // { propTypes: { []:symbols }}
    // if we got this far, there was a valid token, so let's see if it
    // refers to an actual type
    if (!symbols) {
      this.scan_error = true;
      return new VSDToken(symbols as TSymbolData, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: `${fn} invalid '${propType}' not a valid propType`
      });
    }
    // if token not defined, return the list of valid options
    if (token === undefined) {
      this.scan_error = true;
      return new VSDToken(symbols as TSymbolData, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: `propType is required`
      });
    }
    // if token is not an identifier, also bad
    if (type !== 'identifier') {
      this.scan_error = true;
      return new VSDToken(symbols as TSymbolData, {
        gsArg,
        unitText,
        err_code: 'invalid',
        err_info: `propType must be an identifier, not ${type}`
      });
    }
    // if we got THIS far, everything looks great
    // propType symbols look like { propTypes: { number: SM_Number.Symbols, string, ... }}
    const propTypeMethods = symbols.propTypes[propType.toLowerCase()]; //  { symbols for selected type }
    this.cur_scope = propTypeMethods;
    return new VSDToken(symbols as TSymbolData, {
      gsArg,
      unitText
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** looks at the cur_scope, assuming it's the symbol dictionary a
   *  propType (e.g. SM_Number.Symbols). The 'setTo' method defines
   *  the kind of value it expects, which we pass then to argSymbol()
   *  for actual processing and returning of validation tokens */
  propTypeInitialValue(token: IToken) {
    // expecting scriptToken type boolean, string, or number
    const fn = 'propTypeInitialValue:';
    const [type, propType] = TOKENIZER.UnpackToken(token);
    const unitText = TOKENIZER.TokenToString(token);
    const gsArg = ':{?}'; // filled in once we know more

    if (this.detectScanError())
      return new VSDToken(
        {},
        {
          gsArg,
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );

    const { methods } = this.cur_scope;
    // no methods dict...keyword validation programming bug?
    if (!methods) {
      this.scan_error = true;
      return new VSDToken(
        {},
        {
          gsArg,
          unitText,
          err_code: 'debug',
          err_info: `${fn} no methods dict in scope`
        }
      );
    }
    // good methods dict, expect a setTo method for any propType
    const { setTo } = methods;
    if (!setTo) {
      this.scan_error = true;
      return new VSDToken(
        {},
        {
          gsArg,
          unitText,
          err_code: 'debug',
          err_info: `${fn} not a settable property`
        }
      );
    }
    const { args } = setTo;
    if (!Array.isArray(args)) {
      this.scan_error = true;
      return new VSDToken(
        {},
        {
          gsArg,
          unitText,
          err_code: 'debug',
          err_info: `${fn} bad setTo definition in prop`
        }
      );
    }
    // ok, everything should be good...
    // so let the argSymbol() helper take it from here
    const methodArg = args[0];
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
  /** check the current scope or bundle for strIsPropName matches or
   *  undefined. Use this in the cases where you DO NOT WANT an objectref
   *  instead, as you would for the addProp keyword */
  strIsPropName(strIsPropName: string) {
    const ctx = this.cur_scope || {};
    // is there a props dictionary in scope?
    const propDict = this.cur_scope.props;
    if (!propDict) return undefined; // no props found
    // does the strIsPropName exist?
    const prop = propDict[strIsPropName];
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
    const gsArg = HELP.ForGSArg('agentFeature') || ':objref';
    this.resetScope(); // points to the bundle.symbols to start
    let [matchType, featureName] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(featureName)
      ? featureName.join('.')
      : featureName;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${featureName}`));
    // was there a previous scope-breaking error? bail!
    if (this.detectScanError())
      return new VSDToken(
        {},
        {
          gsArg,
          symbolScope: ['features'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType !== 'identifier') {
      this.detectScanError(true);
      return new VSDToken(
        { features: this.getBundleScope().features },
        {
          gsArg,
          symbolScope: ['features'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    const feature = this.strIsFeatureName(featureName);
    if (!feature) {
      this.detectScanError(true);
      return new VSDToken(this.cur_scope, {
        gsArg,
        symbolScope: ['features'], // this is what's 'displayable' by GUI
        unitText,
        err_code: 'invalid',
        err_info: `${fn} '${unitText}' not found or invalid`
      });
    }
    return new VSDToken(
      { features: feature }, // this is the full symbol dict { features, props }
      {
        gsArg,
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
    const gsArg = HELP.ForGSArg('agentFeatureList') || ':feature';
    this.resetScope(); // points to the bundle.symbols to start

    // No need to do this check.  We want the full list of features,
    // not just the features that have been defined in the bundle.
    //
    // if (this.getBundleScope().features === undefined) {
    //   console.error('no features?', GetFeatureSymbols(), this.getBundleScope());
    //   return this.goodToken(token, { features: {} }, { gsArg });
    // }

    const allFeatureSymbols = SIMDATA.GetFeatureSymbols();
    const featuresList = [...Object.keys(allFeatureSymbols)];
    let [matchType, featureName] = TOKENIZER.UnpackToken(token);
    const unitText = Array.isArray(featureName)
      ? featureName.join('.')
      : featureName;
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${featureName}`));
    // was there a previous scope-breaking error? bail!
    if (this.detectScanError())
      return new VSDToken(
        { featuresList },
        {
          gsArg,
          symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType !== 'identifier') {
      this.detectScanError(true);
      return new VSDToken(
        { featuresList },
        {
          gsArg,
          unitText,
          err_code: 'invalid',
          err_info: `${fn} not an objref`
        }
      );
    }
    // DEPRECATED: this makes no sense because cur_scope was reset,
    // so no features have been defined at all.
    // const features = this.cur_scope.features;
    //
    // INSTEAD we want to point it to ALL features
    const features = allFeatureSymbols;
    const feature = features[featureName];
    if (!feature) {
      this.detectScanError(true);
      // return new VSDToken(this.cur_scope, {
      return new VSDToken(
        { featuresList },
        {
          gsArg,
          symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
          unitText,
          err_code: 'invalid',
          err_info: `${fn} '${unitText}' not found or invalid`
        }
      );
    }
    this.cur_scope = feature;
    return new VSDToken(
      { featuresList }, // this is the full symbol dict { features, props }
      {
        gsArg,
        symbolScope: ['featuresList'], // this is what's 'displayable' by GUI
        unitText: featureName
      }
    ); // return agent scope {props}
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle object refs for prop keyword. in GS1.0, the syntax requires
   *  agent|blueprint.propName, so agent is ALWAYS required */
  agentObjRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'agentObjRef:';
    if (this.detectScanError()) return this.vagueError(token);
    const [unitText, tokType, propRef] = this.extractTokenMeta(token);
    const gsArg = HELP.ForGSArg('agentObjRef') || ':objref';
    // construct expected symbols
    let blueprints = SIMDATA.GetBlueprintSymbols();
    const agentName = this.getBundleName();
    const agent = { agent: SIMDATA.GetBlueprintBundle(agentName).symbols };
    blueprints = { ...blueprints, ...agent };
    let props = this.getBundlePropSymbols();
    const symbols: TSymbolData = {
      blueprints,
      props // default to agent
    } as TSymbolData;
    if (this.detectTypeError(gsArg, token)) {
      return this.badToken(token, symbols, {
        gsArg,
        err_info: `token is not ${gsArg} (got ${tokType})`
      });
    }
    // we want to use our custom symbol dict for processing
    this.setCurrentScope(symbols);
    // check validity
    let [bpName, propName] = propRef;
    // PART 1 should be agent or Blueprint
    const goodBlueprint =
      bpName === 'agent' || SIMDATA.HasBlueprintBundle(bpName);
    // Part 2 should be valid propName
    const prop = props[propName];
    const goodProp = props[propName] !== undefined;
    if (goodBlueprint && goodProp) {
      // Found a goodProp, so add the prop methods to the cur_scope
      // so that the next slot (methodName) knows which methods are
      // valid
      const methods = prop ? prop.methods : {};
      symbols.methods = methods;
      this.sm_parent = `${bpName}.${propName}`;
      this.setCurrentScope(symbols);
      return this.goodToken(token, symbols, {
        gsArg
      });
    }
    // otherwise a bad token
    if (!goodBlueprint)
      return this.badToken(token, symbols, {
        gsArg,
        err_info: `${bpName} is not a valid blueprint name`
      });
    if (!goodProp)
      return this.badToken(token, symbols, {
        gsArg,
        err_info: `${propName} is not a valid prop in ${bpName}`
      });
    return this.badToken(token, symbols, {
      gsArg,
      err_info: `unexpected error`
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle feature object refs for the featProp keyword agent.featPropName,
   *  featPropName, Blueprint.featPropName  */
  featObjRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'featObjRef:';
    if (this.detectScanError()) return this.vagueError(token);
    let [unitText, tokType, propRef] = this.extractTokenMeta(token);
    // convert old identifier into a objref array
    const gsArg = HELP.ForGSArg('featObjRef') || ':objref';
    // figure out what we got
    if (tokType === 'identifier') {
      tokType = 'objref';
      propRef = [propRef];
    }
    let [bpName, featureName, propName] = propRef;
    let blueprints = SIMDATA.GetBlueprintSymbols();
    const agentName = this.getBundleName();
    const agent = { agent: SIMDATA.GetBlueprintBundle(agentName).symbols };
    blueprints = { ...blueprints, ...agent };
    // Object.assign(blueprints, { agent }); // insert the blueprint for agent
    // PART 1 should be agent or Blueprint
    if (bpName === undefined)
      return this.badToken(token, { blueprints } as TSymbolData, {
        gsArg,
        err_info: `objref[1] must be 'agent' or a blueprint name`
      });
    const blueprint = blueprints[bpName];
    if (blueprint === undefined) {
      return this.badToken(token, { blueprints } as TSymbolData, {
        gsArg,
        err_info: `objref[1] must be 'agent' or a blueprint name, not ${bpName}`
      });
    }
    // PART 2 should be a featureName in the blueprint symbol dict
    const features = blueprint.features;
    if (featureName === undefined)
      return this.badToken(token, { blueprints, features } as TSymbolData, {
        gsArg,
        err_info: `objref[2] must be a feature defined in blueprint ${bpName}`
      });
    const feature = features[featureName];
    if (feature === undefined) {
      return this.badToken(token, { blueprints, features } as TSymbolData, {
        gsArg,
        err_info: `${featureName} is not defined in ${bpName}`
      });
    }
    // PART 3 should be a propname in the features symbol dict
    const props = feature.props;
    if (propName === undefined)
      return this.badToken(
        token,
        { blueprints, features, props } as TSymbolData,
        {
          gsArg,
          err_info: `objref[3] must be a propName defined in ${bpName}.${featureName}`
        }
      );
    const prop = props[propName];
    if (prop === undefined)
      return this.badToken(
        token,
        { blueprints, features, props } as TSymbolData,
        {
          gsArg,
          err_info: `${propName} is not defined in ${featureName} for ${bpName}`
        }
      );
    // if we got this far, it's good!
    this.setCurrentScope(prop);
    this.sm_parent = `${featureName}.${propName}`;
    return this.goodToken(token, { blueprints, features, props } as TSymbolData, {
      gsArg
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle feature method object refs for the featCall keyword,
   *  feature, Blueprint.feature
   *  e.g. featCall Bee.Costume setCostume 'bee.json' */
  featRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'featRef:';
    if (this.detectScanError()) return this.vagueError(token);
    let [unitText, tokType, propRef] = this.extractTokenMeta(token);
    // convert old identifier into a objref array
    const gsArg = HELP.ForGSArg('featRef') || ':objref';
    // figure out what we got
    let [bpName, featureName, methodName] = propRef;
    let blueprints = SIMDATA.GetBlueprintSymbols();
    const agentName = this.getBundleName();
    const agent = { agent: SIMDATA.GetBlueprintBundle(agentName).symbols };
    blueprints = { ...blueprints, ...agent };
    if (tokType === 'identifier')
      return this.badToken(token, { blueprints } as TSymbolData, {
        gsArg,
        err_info: `not an objref; got ${tokType} instead ${propRef}`
      });
    // Object.assign(blueprints, { agent }); // insert the blueprint for agent
    // PART 1 should be agent or Blueprint
    if (bpName === undefined)
      return this.badToken(token, { blueprints } as TSymbolData, {
        gsArg,
        err_info: `objref[1] must be 'agent' or a blueprint name`
      });
    const blueprint = blueprints[bpName];
    if (blueprint === undefined) {
      return this.badToken(token, { blueprints } as TSymbolData, {
        gsArg,
        err_info: `objref[1] must be 'agent' or a blueprint name, not ${bpName}`
      });
    }
    // PART 2 should be a featureName in the blueprint symbol dict
    const features = blueprint.features;
    if (featureName === undefined)
      return this.badToken(token, { blueprints, features } as TSymbolData, {
        gsArg,
        err_info: `objref[2] must be a feature defined in blueprint ${bpName}`
      });
    const feature = features[featureName];
    if (feature === undefined) {
      return this.badToken(token, { blueprints, features } as TSymbolData, {
        gsArg,
        err_info: `${featureName} is not defined in ${bpName}`
      });
    }
    // No PART 3 but set methods for the cur_scope
    const methods = feature.methods;
    this.setCurrentScope({ methods });
    this.sm_parent = `${featureName}`;
    // if we got this far, it's good!
    return this.goodToken(
      token,
      { blueprints, features, methods } as TSymbolData,
      {
        gsArg
      }
    );
  }
  /// SCOPE-BASED INTERPRETER METHODS /////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** scans the current scope for a terminal property or feature, after
   *  which a methodName would be expected in the next tokens */
  objRef(token: IToken): TSymbolData {
    // error checking & type overrides
    const fn = 'objRef:';
    const gsArg = HELP.ForGSArg('objref') || ':objref';
    this.resetScope();
    let [matchType, parts] = TOKENIZER.UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${parts}`));
    // was there a previous scope-breaking error? bail!
    if (this.detectScanError())
      return new VSDToken(
        {},
        {
          gsArg,
          unitText: parts,
          err_code: 'vague',
          err_info: `${fn} error in previous token(s)`
        }
      );
    // convert identifier to single-part objref
    // and return error if it's not objref or identifier
    if (matchType === 'identifier') parts = [parts];
    else if (matchType !== 'objref') {
      this.detectScanError(true);
      return new VSDToken(this.getBundleScope(), {
        gsArg,
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
    let prop = this.strIsPropName(part);
    let blueprint = this.strIsBlueprintName(part);
    // is there only one part in this objref?
    let terminal = parts.length === 1;
    // does the objref terminate in a method-bearing reference?
    if (terminal) {
      if (prop) return new VSDToken(prop, { gsArg, unitText: part }); // return agent scope {props}
      if (feature) return new VSDToken(feature, { gsArg, unitText: part }); // return feature scope {features,props}
    }

    // did any agent, feature, prop, or blueprint resolve?
    if (!(agent || feature || prop || blueprint)) {
      this.detectScanError(true);
      return new VSDToken(this.getBundleScope(), {
        gsArg,
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
      prop = this.strIsPropName(part);
      feature = this.strIsFeatureName(part);
      blueprint = this.strIsBlueprintName(part);
      // is this part of the objref the last part?
      terminal = ii >= parts.length - 1;
      if (terminal) {
        const unitText = parts.join('.');
        if (prop) return new VSDToken(prop, { gsArg, unitText }); // return agent scope {props}
        if (feature) return new VSDToken(feature, { gsArg, unitText }); // return feature scope {features,props}
      }
    } /** END OF LOOP **/

    // OBJREF ERROR: if we exhaust all parts without terminating, that's an error
    // so return error+symbolData for the entire bundle
    // example: 'prop agent'
    this.detectScanError(true);
    const orStr = parts.join('.');
    return new VSDToken(this.cur_scope, {
      gsArg,
      unitText: orStr,
      err_code: 'invalid',
      err_info: `${fn} '${orStr}' not found or invalid`
    });
  }

  /** given an existing symboldata scope set in this.cur_scope, looks for a method. */
  methodName(token: IToken): TSymbolData {
    const fn = 'methodName:';
    const gsArg = HELP.ForGSArg('methodName') || ':method';
    let [matchType, methodName] = TOKENIZER.UnpackToken(token);
    if (DBG) console.log(...PR(`${fn}: ${matchType}:${methodName}`));

    // was there a previous scope-breaking error?
    if (this.detectScanError())
      return new VSDToken(
        {},
        {
          gsArg,
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
          gsArg,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} unexpected invalid scope`
        }
      );
    // is there a token?
    if (token === undefined) {
      this.detectScanError(true);
      const { methods } = this.cur_scope;
      return new VSDToken(
        { methods },
        { gsArg, err_code: 'empty', err_info: `${fn} missing token` }
      );
    }
    // is the token an identifier?
    if (matchType !== 'identifier') {
      this.detectScanError(true);
      const symbols = this.cur_scope;
      return new VSDToken(symbols, {
        gsArg,
        unitText: TOKENIZER.TokenToUnitText(token),
        err_code: 'invalid',
        err_info: `${fn} expects identifier, not ${matchType}`
      });
    }
    // is the indentifier defined?
    if (typeof methodName !== 'string') {
      this.detectScanError(true);
      return new VSDToken(
        {},
        {
          gsArg,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} invalid identifier`
        }
      );
    }
    // is there a methods dictionary in scope
    const { methods } = this.cur_scope;
    if (methods === undefined) {
      this.detectScanError(true);
      return new VSDToken(
        {},
        {
          gsArg,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} scope has no method dict`
        }
      );
    }
    // does methodName exist in the methods dict?
    const methodSig = methods[methodName]; //
    if (methodSig === undefined) {
      this.detectScanError(true);
      return new VSDToken(
        {
          methods
        },
        {
          gsArg,
          unitText: TOKENIZER.TokenToUnitText(token),
          err_code: 'invalid',
          err_info: `${fn} '${methodName}' is not in method dict`
        }
      );
    }
    // all good!
    // works for prop, featProp, featCall
    this.setCurrentScope({ [methodName]: methodSig });

    return new VSDToken({ methods }, { gsArg, unitText: methodName }); // valid scope is parent of cur_scope
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
              gsArg: ':{?}',
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

    // SCOPE ARGS 2: general validation tokens for each argument
    // this loop structure is weird because we have to handle overflow
    // and underflow conditions
    let tokenIndex = 0;
    for (tokenIndex; tokenIndex < tokens.length; tokenIndex++) {
      // overflow
      // is the tokenIndex greater than the number of argument definitions?
      if (args && tokenIndex >= args.length) {
        vtoks.push(
          new VSDToken(
            {},
            {
              gsArg: ':{?}',
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
      const arg = args ? args[tokenIndex] : '';

      /* THE MONEY CALL */
      const vtok = this.argSymbol(arg, tok);
      /* THE MONEY CALL */

      vtok.methodSig = methodSignature;
      vtoks.push(vtok);
    } // end for
    // check for underflow
    // REVIEW: 'args' might be undefined when still spec'ing the script
    // line.  Add check to avoid reading property of 'undefined' error
    if (args && tokenIndex < args.length)
      for (let ii = tokenIndex; ii < args.length; ii++) {
        const gsArg = args[ii];
        const [argName, gsType] = CHECK.UnpackArg(gsArg);
        if (gsType === 'block') {
          // not really an error
          vtoks.push(
            new VSDToken(
              {},
              { unitText: '[[ ]]', gsArg, ui_action: ['ensureBlock'] }
            )
          );
        } else
          vtoks.push(
            new VSDToken(
              {},
              {
                gsArg,
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

    const gsArg = methodArg;
    const [argName, gsType] = CHECK.UnpackArg(methodArg);
    const [tokType, tokVal] = TOKENIZER.UnpackToken(scriptToken);

    // data structures
    let symData;
    const arg = methodArg;
    const tok = scriptToken;
    // default unit text
    const unitText = TOKENIZER.TokenToUnitText(tok);

    // is this an identifier?
    if (gsType === 'identifier') {
      let ident = TOKENIZER.TokenValue(tok, 'identifier');
      if (typeof ident === 'string')
        symData = new VSDToken({ arg }, { gsArg, unitText });
      else
        symData = new VSDToken(
          {},
          {
            gsArg,
            unitText: TOKENIZER.TokenToUnitText(tok),
            err_code: 'invalid',
            err_info: `${tokType}:${tokVal} is a malformed identifier`
          }
        );
    }

    // is this a literal boolean value from token.value
    if (gsType === 'boolean') {
      let value = TOKENIZER.TokenValue(tok, 'value');
      if (typeof value === 'boolean')
        symData = new VSDToken({ arg }, { gsArg, unitText });
      else
        symData = new VSDToken(
          {},
          {
            gsArg,
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
        symData = new VSDToken({ arg }, { gsArg, unitText });
      else
        symData = new VSDToken(
          {},
          {
            gsArg,
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
        symData = new VSDToken({ arg }, { gsArg, unitText });
      else
        symData = new VSDToken(
          {},
          {
            gsArg,
            unitText: TOKENIZER.TokenToUnitText(tok),
            err_code: 'invalid',
            err_info: `${tokType}:${tokVal} not a string`
          }
        );
    }

    // all symbols available in current bundle match token.objref
    if (gsType === 'objref' && TOKENIZER.TokenValue(tok, 'objref')) {
      symData = new VSDToken(this.bdl_scope, {
        gsArg,
        unitText,
        symbolScope: ['props'] // this is what's 'displayable' by GUI
      });
    }

    // all props, feature props in bundle match token.identifier
    if (gsType === 'prop' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.bdl_scope, {
        gsArg,
        unitText,
        symbolScope: ['props'] // this is what's 'displayable' by GUI
      });
    }

    // is this a method name? current scope is pointing to
    // the method dict, we hope...
    // all methods in bundle match token.identifier
    if (gsType === 'method' && TOKENIZER.TokenValue(tok, 'identifier')) {
      symData = new VSDToken(this.cur_scope, {
        gsArg,
        unitText,
        symbolScope: ['methods'] // this is what's 'displayable' by GUI
      });
    }

    // is this any propType?
    // all propTypes available in system match token.identifier
    if (gsType === 'propType' && TOKENIZER.TokenValue(tok, 'identifier')) {
      const map = SIMDATA.GetPropTypeCtorDict();
      const propTypes = {};
      const list = [...map.keys()];
      list.forEach(ctorName => {
        propTypes[ctorName] = SIMDATA.GetPropTypeSymbolsFor(ctorName);
      });
      symData = new VSDToken({ propTypes }, { gsArg, unitText });
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
          gsArg,
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
          gsArg,
          unitText
          // no need for symbolScope because we want to show all props and features???
        }
      );
    }

    // blocks aka consequent, alternate
    if (gsType === 'block') {
      symData = new VSDToken(
        {},
        {
          gsArg,
          ui_action: ['ensureBlock']
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
          gsArg,
          unitText
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
          gsArg,
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
          gsArg,
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
          gsArg,
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
          { err_code: 'debug', err_info: '{value} expr todo', gsArg, unitText }
        );
      }
      // determine if objref is valid
      if (tokType === 'objref') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} objref todo', gsArg, unitText }
        );
      }
      if (tokType === 'string') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} string todo', gsArg, unitText }
        );
      }
      if (tokType === 'value') {
        symData = new VSDToken(
          {},
          { err_code: 'debug', err_info: '{value} value todo', gsArg, unitText }
        );
      }
      if (symData === undefined) {
        symData = new VSDToken(
          {},
          {
            err_code: 'invalid',
            err_info: '{value} unrecognized type',
            gsArg,
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
          gsArg,
          err_code: 'debug',
          err_info: `${fn} ${gsType} has no token mapper`
        }
      );
    }
    // return valid symdata/validation
    return symData;
  }

  /** Process overflow args for keywords
   *  This is needed so the overflow words will display.
   *  Otherwise, overflow words are truncated.
   */
  extraArgsList(tokens: IToken[]): TSymbolData[] {
    const fn = 'extraArgsList:';
    const vtoks = [];
    let tokenIndex = 0;
    for (tokenIndex; tokenIndex < tokens.length; tokenIndex++) {
      vtoks.push(
        new VSDToken(
          {},
          {
            gsArg: ':{?}',
            unitText: TOKENIZER.TokenToUnitText(tokens[tokenIndex]),
            err_code: 'extra',
            err_info: `${fn} method ignores extra arg`
          }
        )
      );
    }
    return vtoks;
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
    let p = this.strIsPropName(part);
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
      p = this.strIsPropName(part);
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SymbolInterpreter;
