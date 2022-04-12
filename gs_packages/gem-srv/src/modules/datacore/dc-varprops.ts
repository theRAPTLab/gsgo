/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  VARIABLE PROPERTIES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IScopeableCtor } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('DCVAR');

/// DATA STORAGE MAPS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const VAR_DICT: Map<string, IScopeableCtor> = new Map();

/// VALUE TYPE UTILITIES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a SMObject, store in VARTYPES */
export function RegisterVarCTor(name: string, ctor: IScopeableCtor) {
  if (VAR_DICT.has(name)) throw Error(`RegisterVarCTor: ${name} exists`);
  VAR_DICT.set(name, ctor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** get the registered SMObject constructor by name */
export function GetVarCtor(name: string): IScopeableCtor {
  if (!VAR_DICT.has(name)) throw Error(`GetVarCtor: ${name} `);
  return VAR_DICT.get(name);
}

/// SYMBOL UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return symbol data for a given gvar */
export function SymbolDefFor(name: string) {
  const def = VAR_DICT.get(name);
  if (def) return def.Symbols;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return all var constructors */
export function GetAllVarCtors() {
  return VAR_DICT;
}
