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
 *  is, then use UnpackSymbol
 */
function DecodeSymbolViewData(symbolData: TSymbolData): TSymbolViewData {
  let sv_data: any = {};

  // check to see what
  const {
    error,
    unitText,
    keywords,
    featuresList,
    features,
    props,
    methods,
    arg
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
