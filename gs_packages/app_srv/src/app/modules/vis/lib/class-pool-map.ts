/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PoolMapper

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Looks for differences between two dictionaries 'source' and 'mapped'
 *  containing objects that have a number id property. Runs a function for
 *  each case.
 *  Returns { added, updated, removed } arrays.
 */
function DiffMaps(source, mapped, opt?) {
  // keys in mapped and not in source are deleted if opt.removeTest() passes
  // keys in source and not in mapped are added
  // keys in mapped and source are updated
  const skeys = [...source.keys()];
  const mkeys = [...mapped.keys()];
  //
  const arr_update = skeys.filter(key => mkeys.includes(key));
  const arr_add = skeys.filter(key => !mkeys.includes(key));
  const arr_remove = mkeys.filter(
    // remove if source doesn't have key AND if removeTest
    // agrees that it should be removed
    key => !skeys.includes(key) && opt.removeTest(mapped.get(key))
  );
  //
  arr_add.forEach(key => opt.addFunc(key, source, mapped));
  arr_remove.forEach(key => opt.removeFunc(key, mapped));
  arr_update.forEach(key => opt.updateFunc(key, source, mapped));
  //
  return { added: arr_add, updated: arr_update, removed: arr_remove };
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { DiffMaps };
