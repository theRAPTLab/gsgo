/* eslint-disable no-continue */
/*///////////////////////////////// CLASS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Keyword class is the base class for all GEMscript keywords.
  There is one keyword that begins a GEMscript source line, which is processed
  by the appropriate subclass that is defined to handle it.

  Each Keyword implements:
  1. An array of strings that defines the name and type of each argument
     accepted by this keyword. This is used to help label the dropdown options
     for each GUI element and for documenting the keyword itself.
  2. A compiler() method that receives parameters specific to the keyword,
     which uses them to generate the correct smc program array that performs
     the function of this keyword. The smc program array is returned.
  3. A render() method that receives paramters specific to this keyword.
     It generates React elements that are the visual representation of an
     editable instance of this keyword.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  IKeyword,
  IScopeable,
  IAgent,
  TOpcode,
  TOpcodeErr,
  IToken,
  TScriptUnit,
  TSymbolData,
  TSymbolRefs,
  TSymKeywordArg,
  TValidationToken,
  DerefMethod
} from 'lib/t-script';
import { Evaluate } from 'script/tools/class-expr-evaluator-v2';
import { SymbolHelper } from 'script/tools/symbol-utilities';
import {
  UnpackToken,
  IsNonCodeToken
} from 'script/tools/class-gscript-tokenizer-v2';
import { GetKeyword } from 'modules/datacore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Keyword implements IKeyword {
  keyword: string;
  args: TSymKeywordArg[]; // document only. can have array[][] for alt signatures
  shelper: SymbolHelper; // helper for extracting line data
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('Keyword requires string, not undefined');
    else if (DBG) console.log('Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
    this.shelper = new SymbolHelper(keyword);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override in subclass */
  compile(unit: TScriptUnit, idx?: number): (TOpcode | TOpcodeErr)[] {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** override in subclass to provide actual symbol data. Note that not every
   *  keyword contributes symbols. addProp and addFeature may be the only
   *  ones because they name properties and features that are used to lookup
   *  the available props and methods on them.
   */
  symbolize(unit: TScriptUnit): TSymbolData {
    return {}; // change to throw Error when ready to update all keywords
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Override in subclass to validate scriptUnits against symbol
   *  The error state returns code and desc if a parse issue is detected.
   *  If symbol information can be inferred despite an error, it will be
   *  returned. Otherwise it is void/undefined.
   */
  validate(unit: TScriptUnit): TValidationToken[] | void {
    // OPTIONAL: put some basic conforming stuff here if necessary
  }

  /// UTILITY METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** return the name of this keyword */
  getName() {
    return this.keyword;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to return an array with non-functions, signaling to the caller
   *  thate there was an error to process. The linenumber idx is passed in
   *  from the caller invoking compile()
   */
  errLine(err: string, idx?: number) {
    if (idx !== undefined) return [err, idx];
    return [err];
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to check if an index into a script unit is within bounds
   */
  indexInRange(unit: TScriptUnit, index): boolean {
    const check = index === 0 || index > unit.length - 1;
    if (!check) console.warn(`${unit[0]} index ${index} out of range`);
    return check;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** utility to unpack the script unit tokens into a more inspectable form */
  getUnpackedToken(token: IToken): [string, any] {
    return UnpackToken(token);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** initialize parameters for SymbolHelper instance, which must be done
   *  each time before validate() is called to ensure correct refs are set
   */
  setReferences(refs: TSymbolRefs) {
    this.shelper.setReferences(refs);
  }
} // end of Keyword Class

/*/////////////////////////////////// * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  STATIC UTILITY METHODS - for handling runtime arguments that need to be
  evaluated in the context of the runtime agent, which can't be determined
  at compile time.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** checks a given argument, and if it's an object we'll assume it's an
 *  UnitToken and evaluate it. Otherwise, just return the value as-is
 */
function _evalRuntimeArg(arg: any, context): any {
  // return literals and arrays without changing
  // this is most objects
  if (typeof arg !== 'object') return arg;
  // special cases are in unit token format
  if (arg.program) return arg.program;
  if (arg.expr) {
    let result = Evaluate(arg.expr, context);
    if (DBG) console.log('expr', arg.expr, context);
    return result;
  }
  if (arg.objref) {
    // always assume this is a prop value
    let result;
    const { objref } = arg;
    if (objref.length === 1) {
      // implicit agent objref 'x' // shouldn't use this
      const prop = objref[0];
      result = context.agent.getProp(prop).value;
      if (DBG) console.log('objref 1', prop, result);
    } else if (objref.length === 2) {
      // explicit objref 'agent.x' or 'Fish.x'
      const [agent, prop] = objref;
      result = context[agent].getProp(prop).value;
      if (DBG) console.log('objref 2', agent, prop, result);
    } else if (objref.length === 3) {
      // explicit feature prop objref 'agent.Costume.foo'
      const [agent, feature, prop] = objref;
      result = context[agent].getFeatProp(feature, prop).value;
      if (DBG) console.log('objref 3', agent, feature, prop, result);
    } else {
      console.log('unhandled objref length', objref);
    }
    return result;
  }
  console.error('_evaluateArg: unknown arg type', arg);
  return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by keyword compile-time to retreve a prop object dereferencing function
 *  that will be executed at runtime */
function K_DerefProp(refArg): DerefMethod {
  const fn = 'K_DerefProp:';
  // ref is an array of strings that are fields in dot addressing
  // like agent.x
  if (refArg === undefined)
    throw Error(`${fn} objref arg is undefined (bad scriptText?)`);
  const ref = refArg.objref || [refArg];
  const len = ref.length;
  // create a function that will be used to dereferences the objref
  // into an actual call
  let deref;
  if (len === 1) {
    /** IMPLICIT REF *******************************************************/
    /// e.g. 'x' is assumed to be 'agent.x'
    deref = (agent: IAgent, context: any) => {
      const p: IScopeable = agent.getProp(ref[0]);
      if (p === undefined) {
        console.log('agent', agent);
        throw Error(`agent missing prop '${ref[0]}'`);
      }
      return p;
    };
  } else if (len === 2) {
    /** EXPLICIT REF *******************************************************/
    /// e.g. 'agent.x' or 'Bee.x'
    deref = (agent: IAgent, context: any) => {
      const c = ref[0] === 'agent' ? agent : context[ref[0]];
      if (c === undefined) throw Error(`context missing '${ref[0]}' key`);
      const p: IScopeable = c.getProp(ref[1]);
      if (p === undefined) throw Error(`missing prop '${ref[1]}'`);
      return p;
    };
  } else {
    console.warn('error parse ref', ref);
    deref = () => {};
  }
  return deref;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this doesn't work with expressions */
function K_DerefFeatureProp(refArg) {
  // ref is an array of strings that are fields in dot addressing
  // like agent.x
  const ref = refArg.objref || [refArg];
  const len = ref.length;

  // create a function that will be used to dereferences the objref
  // into an actual call
  let deref;

  if (len === 2) {
    /** IMPLICIT FEATURE PROP REF ******************************************/
    /// e.g. 'Costume.pose' running in agent context
    deref = (agent: IAgent, context: any) => {
      const p = agent.getFeatProp(ref[0], ref[1]);
      if (p === undefined)
        throw Error(`agent missing featProp '${ref[0]}.${ref[1]}`);
      return p;
    };
  } else if (len === 3) {
    /** EXPLICIT FEATURE PROP REF ******************************************/
    /// e.g. 'agent.Costume.pose' or 'Bee.Costume.pose'
    deref = (agent: IAgent, context: any) => {
      const c = ref[0] === 'agent' ? agent : context[ref[0]];
      if (c === undefined) throw Error(`context missing key '${ref[0]}'`);
      const p = c.getFeatProp(ref[1], ref[2]);
      if (p === undefined) throw Error(`context missing '${ref[1]}.${ref[2]}'`);
      return p;
    };
  } else {
    console.warn('error parse ref', ref);
    deref = () => {};
  }
  return deref;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by keywords that need to do runtime evaluation of an expression from
 *  within the returned program
 */
function K_EvalRuntimeUnitArgs(unit: TScriptUnit, context: {}): any {
  if (!Array.isArray(unit)) throw Error('arg must be TScriptUnit, an array');
  // note that unit is passed at creation time, so it's immutable within
  // the TOpcode. We need to return a copy through map()
  return unit.map(arg => _evalRuntimeArg(arg, context));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Keyword; // default export: import Keyword
export {
  K_EvalRuntimeUnitArgs, // convert all args in unit to runtime values
  K_DerefProp, // return function to access agent prop at runtime
  K_DerefFeatureProp // return function to access agent prop at runtime
};
