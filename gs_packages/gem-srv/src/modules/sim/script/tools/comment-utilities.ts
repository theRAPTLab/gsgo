/*  Comment Utilities

    What it does:
    * Manages
      * explanation comments
      * change comments

    * Provides data stuctures for style definitions in the project files
      (where to store them)

    * Provides a hard coded css comment detection code to be used by
        SharedElements.GToken
      to set the comment type for fancy formating, e.g. "explanation comments".

    * Provides methods, if needed, to add and remove style definitions
      to the projects file.

    * Generates bookmarks at compile time with line numbers so it's accessible to
      UI elements via the bundle (e.g. symbols).

    * Reference code to look at:
      -- `t-script.d.ts.TBundleSymbols:314`
      -- Also see `class-symbol-interpreter` for how to reference bundle symbol data.
         but this is not where we want to place it.  (How would we provide
         support to UI, the structures for visual rendering)

    Derived data source from the bundle symbol table.
    We would create a new type of symbol table for supporting comment bookmarks.

    Next step: physical connections to the model -- stub API methods


*/

function GetClasses(type: string, label: string): string {
  let classes: string;
  if (type === '{noncode}') {
    classes = ' styleComment';
    if (label.includes('COMMENT KEY')) classes += ' commentKeyHeader';
    if (label.includes('🔎 WHAT')) classes += ' explanationCommentHeader';
    if (label.includes('🔎 DEFINITION')) classes += ' explanationCommentHeader';
    if (label.includes('🔎 QUESTION')) classes += ' explanationCommentHeader';
    if (label.includes('✏️ LETS')) classes += ' changeCommentHeader';
    if (label.includes('✏️ CHANGE')) classes += ' changeCommentHeader';
    if (label.includes('✏️ HYPOTHESIS')) classes += ' changeCommentHeader';
    if (label.includes('🔎')) classes += ' explanationCommentBody';
    if (label.includes('✏️')) classes += ' changeCommentBody';
  }
  return classes;
}

export { GetClasses };
