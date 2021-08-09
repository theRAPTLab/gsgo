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

import React from 'react';
import { IKeyword, TOpcode, TScriptUnit, IAgent } from 'lib/t-script';
import GScriptTokenizer from 'lib/class-gscript-tokenizer';
import { Evaluate } from 'lib/expr-evaluator';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const scriptifier = new GScriptTokenizer();
const styleIndex = {
  fontWeight: 'bold' as 'bold', // this dumb typescriptery css workaround
  backgroundColor: 'black',
  color: 'white',
  padding: '2px 4px',
  marginTop: '-1px',
  minWidth: '1.25em',
  float: 'left' as 'left',
  textAlign: 'right' as 'right' // this dumb typescriptery css workaround
};
const styleLine = { borderTop: '1px dotted gray' };
const styleContent = { padding: '0.5em', overflow: 'hidden' };
const DBG = false;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HACK: used to generate ever-increasing ID for rendering. They are all unique
 *  because our rendering loop just rerenders the entire list into a GUI every
 *  time. This is probably not the way to do it efficiently in React.
 */
let ID_GENERATOR = 0;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Key id generator used by the base jsx() wrapper to create unique
 *  keys so React doesn't complain. This is probably bad and inefficient
 *  but it works for now.
 */
function m_GenerateKey() {
  return ID_GENERATOR++;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Keyword implements IKeyword {
  keyword: string;
  args: any[]; // document only. can have array[][] for alt signatures
  //
  constructor(keyword: string) {
    if (typeof keyword !== 'string')
      throw Error('Keyword requires string, not undefined');
    else if (DBG) console.log('Keyword constructing:', keyword);
    this.keyword = keyword;
    this.args = [];
  }
  /** override in subclass */
  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    throw Error(`${this.keyword}.compile() must be overridden by subclassers`);
  }
  /** override to output a serialized array representation for eventual reserialization */
  serialize(state: object): TScriptUnit {
    throw Error(`${this.keyword}.serialize() must be overridden by subclassers`);
  }
  /** override in subclass */
  jsx(index: number, srcLine: TScriptUnit, children?: any): any {
    // note that styleIndex below has to have weird typescript
    // stuff for originally hyphenated CSS properties so it doesn't
    // get marked by the linter as invalid CSS
    return (
      // old method generated a key instead of using index
      // but this disconnects the instance from the script
      // <div key={m_GenerateKey()} style={styleLine}>
      <div key={index} style={styleLine}>
        <div style={styleIndex}>{index}</div>
        <div style={styleContent}>{children}</div>
      </div>
    );
  }
  /// UTILITY METHODS /////////////////////////////////////////////////////////
  /** return the name of this keyword */
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
  getMethodsMap() {
    const map = new Map();
    map.set('boolean', [
      'setTo',
      'true',
      'false',
      'invert',
      'and',
      'or',
      'eq',
      'slightlyTrue',
      'mostlyTrue',
      'slightlyFalse',
      'mostlyFalse'
    ]);
    map.set('number', [
      'setWrap',
      'setMin',
      'setMax',
      'setTo',
      'setToRnd',
      'add',
      'addRnd',
      'sub',
      'subFloat2',
      'subRnd',
      'div',
      'mul',
      'eq',
      'gt',
      'lt',
      'gte',
      'lte',
      'clear'
    ]);
    map.set('string', ['setTo', 'eq', 'clear']);
    map.set('dictionary', ['addItem', 'updateItem', 'getItem', 'has', 'getKeys']);
    return map;
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
function EvalRuntimeArg(arg: any, context): any {
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
  console.error('EvalRuntimeArg: unknown arg type', arg);
  return undefined;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** checks a given argument, and if it's an object we'll assume it's an
 *  UnitToken return a JSX element to stuff into the GUI
 */
function JSXifyArg(arg: any) {
  // Return JSX GUI element for specific types
  if (typeof arg !== 'object') return arg; // placeholder
  // if Array.isArray(arg)
  // if typeof arg==='number'
  // if typeof arg==='string'
  // if typeof arg==='boolean'
  // handle special object cases
  if (arg.program) return ['program block'];

  // ORIG CODE
  // if (arg.objref) return arg.objref.join('.');

  // Ben's NEW CODE: objrefs should not be joined!  We want the raw array!
  if (arg.objref) return arg;

  if (arg.expr) return `{{ ${arg.expr} }}`;
  console.error('JSXifyArg: unknown arg type', arg);
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by keyword compile-time to retreve a prop object dereferencing function
 *  that will be executed at runtime */
function DerefProp(refArg) {
  // ref is an array of strings that are fields in dot addressing
  // like agent.x
  const ref = refArg.objref || [refArg];
  const len = ref.length;
  // create a function that will be used to dereferences the objref
  // into an actual call
  let deref;
  if (len === 1) {
    /** IMPLICIT REF *******************************************************/
    /// e.g. 'x' is assumed to be 'agent.x'
    deref = (agent: IAgent, context: any) => {
      const p = agent.getProp(ref[0]);
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
      const p = c.getProp(ref[1]);
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
function DerefFeatureProp(refArg) {
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
function EvalRuntimeUnitArgs(unit: TScriptUnit, context: {}): any {
  if (!Array.isArray(unit)) throw Error('arg must be TScriptUnit, an array');
  // note that unit is passed at creation time, so it's immutable within
  // the TOpcode. We need to return a copy through map()
  return unit.map(arg => EvalRuntimeArg(arg, context));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by keyword jsx generator to return data that can be used by JSX
 *
 */
function JSXFieldsFromUnit(unit: TScriptUnit): any {
  const jsxArray = unit.map(arg => JSXifyArg(arg));
  return jsxArray;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given an array of untokenized script unit strings, produce a source text
 *  This is used by keyword serializers to convert their data into a line
 *  of script text.
 *    e.g. ['prop', 'x', 'setTo', '5'] => 'prop x setTo 5'
 *  The challenge is dealing with empty args,  So we can't simply use joins.
 *    e.g. with a join, ['prop', 'x', 'setTo', ''] => 'prop x setTo '
 *    but instead we want ['prop', 'x', 'setTo', ''] => 'prop x setTo ""'
 */
function TextifyScriptUnitValues(unit: string[]): string {
  const scriptText: string = unit.reduce((acc: string, curr: string) => {
    if (curr === '') return `${acc} ""`;
    return `${acc} ${curr}`;
  });
  return scriptText.trim();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a text with multiline blocks, emit an array of strings corresponding
 *  to regular strings and [[ ]] demarked lines. The output nodes are processed
 *  back into a single line with m_StitchifyBlocks(). Returns an array of
 *  string arrays.
 */
// REVIEW: This is duplicated in transpiler.
//         It's here so that keywords (like props) can ScriptifyText directly
//         avoiding a dependency cycle with transpiloer.
function ScriptifyText(text: string): TScriptUnit[] {
  if (text === undefined) return [];
  const sourceStrings = text.split('\n');
  const script = scriptifier.tokenize(sourceStrings);
  return script;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Keyword; // default export: import Keyword
export {
  EvalRuntimeUnitArgs, // convert all args in unit to runtime values
  JSXFieldsFromUnit, // convert arg to JSX-renderable item
  DerefProp, // return function to access agent prop at runtime
  DerefFeatureProp, // return function to access agent prop at runtime
  TextifyScriptUnitValues,
  ScriptifyText
};
