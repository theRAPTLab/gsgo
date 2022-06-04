/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  datacore constants
  can be freely imported anywhere

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// SCRIPT TO LINES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** whether to draw all blank lines or not in GUI (closing brackets become
 *  blank lines, so NOT drawing them looks better. Note that BLANK LINES
 *  in scriptText are handled separately */
export const SHOW_EMPTY_STATEMENTS = true;
/** whether to index the first entry as 0 or 1 in the GUI */
export const SCRIPT_PAGE_INDEX_OFFSET = 1; // set to 1 for no 0 indexes

/// GUI WIZARD TEST BLUEPRINT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** when set to true, GUI WIZARD will load the test script defined in
 *  x-symbol-tests instead of the DEV_PRJID and BPID */
export const ENABLE_SYMBOL_TEST_BLUEPRINT = true;
