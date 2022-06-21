/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A collection of symbol utilities

  The SymbolInterpreter class accepts a symbol table on construction
  is to lookup symbol data from a token.
  Your provide a bundle and context
  It knows how to lookup features, programs, and blueprints.
  It knows how to dig into props.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import SymbolInterpreter from 'script/tools/class-symbol-interpreter';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMUTIL', 'TagTest');

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: convert symbol data into lists suitable for gui rendering. this is
 *  the entire list of ALLOWED CHOICES; if you want to just know what unitText
 *  is, then use UnpackSymbol */
function DecodeSymbolViewData(symbolData: TSymbolData): TSymbolViewData {
  const fn = `DecodeSymbolViewData:`;
  let sv_data: any = {};

  // check to see what
  const {
    // metadata
    error,
    unitText,
    gsType,
    symbolScope,
    // dicts
    keywords,
    featuresList, // deprecate because features should be used for featProp
    features,
    props,
    methods,
    propTypes,
    options,
    events,
    // method arguments
    methodSig,
    arg,
    // unhandled crap
    ...extra
  } = symbolData;

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
  if (featuresList)
    sv_data.featuresList = {
      info: featuresList.join(', '),
      items: featuresList
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
  if (methodSig) {
    const items = [...Object.keys(methodSig.args)];
    sv_data.methodSig = {
      info: methodSig.args.join(', '),
      items
    };
  }
  if (arg) {
    const [name, type] = CHECK.UnpackArg(arg);
    sv_data.arg = { info: arg, items: [name, type] };
  }
  if (propTypes) {
    const items = [...Object.keys(propTypes)];
    sv_data.propTypes = {
      info: items.join(', '),
      items
    };
  }
  if (options) {
    sv_data.options = {
      items: ['runAtStart', ''],
      info: 'runAtStart or empty string'
    };
  }
  if (events) {
    sv_data.events = {
      info: events.join(', '),
      items: events
    };
  }

  // handle missing handlers gracefully for GUI
  const extraSymbols = Object.keys(extra || {});
  if (extraSymbols.length) {
    console.log(
      `%c${fn} no handler for symbol types:[${extraSymbols.join(',')}]`,
      'color:red;background-color:yellow;padding:1em'
    );
    // eslint-disable-next-line no-alert
    alert(
      `${fn}\nno handler for symbol types:[${extraSymbols.join(
        ','
      )}]\ndouble-check symbol-utilities.ts`
    );
    extraSymbols.forEach(stype => {
      sv_data[stype] = { info: `${fn} no handler ${stype}`, items: [] };
    });
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
 *  instead of all allowed types */
function UnpackSymbolType(symbolData: TSymbolData): any[] {
  return [];
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { DecodeSymbolViewData, UnpackViewData, UnpackSymbolType };
export function BindModule() {
  // HACK to force import of this module in Transpiler, otherwise webpack treeshaking
  // seems to cause it not to load
}
