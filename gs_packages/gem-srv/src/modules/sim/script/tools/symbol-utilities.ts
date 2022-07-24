/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Utilities to convert TSymbolData into friendlier structures

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
/** UTILITY: convert symbol data into an 'items' string[] of
 *  allowed choices. It also provides a debug string called 'info' that
 *  shows all the possible choices.. */
function DecodeSymbolViewData(symbolData: TSymbolData): TSymbolViewData {
  const fn = `DecodeSymbolViewData:`;
  let sv_data: any = {};

  // check to see what
  const {
    // metadata
    error,
    unitText,
    gsType,
    gsName,
    symbolScope,
    // dicts
    keywords,
    blueprints,
    featuresList, // deprecate because features should be used for featProp
    features,
    props,
    methods,
    propTypes,
    options,
    events,
    pragmas,
    tags,
    bdlOuts,
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
  if (blueprints) {
    const items = Object.keys(blueprints);
    sv_data.blueprints = {
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
  if (pragmas) {
    const items = [...Object.keys(pragmas)];
    sv_data.pragmas = {
      info: items.join(', '),
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
      items: ['runAtStart', 'runAfter'],
      info: 'runAtStart or runAfter'
    };
  }
  if (events) {
    sv_data.events = {
      info: events.join(', '),
      items: events
    };
  }
  if (tags) {
    const items = [...Object.keys(tags)];
    sv_data.tags = {
      info: items.join(','),
      items
    };
  }
  if (bdlOuts) {
    sv_data.bdlOuts = {
      info: bdlOuts.join(', '),
      items: bdlOuts
    };
  }

  // handle missing handlers gracefully for GUI
  const extraSymbols = Object.keys(extra || {});
  if (extraSymbols.length) {
    console.warn(
      `%c${fn} no handler for symbol types:${extraSymbols.join(',')}`,
      'color:red;background-color:yellow;padding:1em'
    );
    // eslint-disable-next-line no-alert
    alert(
      `${fn}\nno handler for symbol types:[${extraSymbols.join(
        ','
      )}]\ndouble-check symbol-utilities.ts, or bad symboldata?`
    );
    extraSymbols.forEach(stype => {
      sv_data[stype] = { info: `${fn} no handler ${stype}`, items: [] };
    });
  }
  return sv_data;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: returns an array all symbolTypes associatd with unitText:
 *  [ unitText, [ symbolType, items ], [ symbolType, items ], ... ] */
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
