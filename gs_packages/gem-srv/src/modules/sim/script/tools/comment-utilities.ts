/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Comment Utilities

    Utilities for styling and bookmarking comments in gemscript wizard code.

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

    Next Steps:
    * Figure out how introduce AddStyles to add to project settings

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are defined in gem-ui.css
const COMMENTTYPEMAP = new Map<string, any>();
COMMENTTYPEMAP.set('COMMENT KEY', {
  style: 'commentKeyHeader',
  isBookmark: false
});
COMMENTTYPEMAP.set('🔎 WHAT', {
  style: 'explanationCommentHeader',
  help: 'Explanation of how this code works',
  isBookmark: false
});
COMMENTTYPEMAP.set('🔎 DEFINITION', {
  style: 'explanationCommentHeader',
  help: 'Explanation of code defintion',
  isBookmark: false
});
COMMENTTYPEMAP.set('🔎 QUESTION', {
  style: 'explanationCommentHeader',
  help: 'Questions to consider',
  isBookmark: false
});
COMMENTTYPEMAP.set('✏️ LETS', {
  style: 'changeCommentHeader',
  help: 'Code that should be changed by a student',
  isBookmark: true
});
COMMENTTYPEMAP.set('✏️ CHANGE', {
  style: 'changeCommentHeader',
  help: 'Code that should be changed by a student',
  isBookmark: true
});
COMMENTTYPEMAP.set('✏️ HYPOTHESIS', {
  style: 'changeCommentHeader',
  help: 'Code that should be changed by a student',
  isBookmark: false
});
COMMENTTYPEMAP.set('🔎', {
  style: 'explanationCommentBody',
  help: '',
  isBookmark: false
});
COMMENTTYPEMAP.set('✏️', {
  style: 'changeCommentBody',
  help: '',
  isBookmark: false
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * @return {Array} [ ...{cssClass, label}]
 */
function GetCommentStyles() {
  const styles = [];
  COMMENTTYPEMAP.forEach((val, key) => {
    styles.push({ key, cssStyle: val.style });
  });
  return styles;
}

/// STYLE INTERFACE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** AddStyle
 *  @param {string} matchString
 *  @param {string} cssStyle
 *  @param {boolean} isBookmark
 */
function AddStyle(matchString: string, cssStyle: string, isBookmark: boolean) {
  // Check for existence before styleMap
  if (COMMENTTYPEMAP.has(matchString))
    console.warn(`Style ${matchString} already defined ${cssStyle}`);
  COMMENTTYPEMAP.set(matchString, { style: cssStyle, isBookmark });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DeleteStyle() {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GetClasses -- used in SharedElements.GToken()
 *  @param {string} type
 *  @param {string} label
 *  @return {string}
 */
function GetClasses(type: string, label: string): string {
  let classes: string;
  if (type === '{noncode}') {
    classes = ' styleComment';
    COMMENTTYPEMAP.forEach((value, key) => {
      if (label.includes(key)) classes += ` ${value.style}`;
    });
  }
  return classes;
}

/// BOOKMARK INTERFACE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// During compile/render, we'll iterate through the lines and construct the
/// list of bookmarks
const BOOKMARKS = [];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetBookmarkFromScriptLine(line: any) {
  const { vmTokens, lineNum } = line;
  const { scriptToken } = vmTokens[0] || {};
  const { comment } = scriptToken || {};
  const matchedStyles = [...COMMENTTYPEMAP.keys()];
  let styleName = '';
  let isBookmark = false;
  const u_scanstyles = text => {
    const match = matchedStyles.find(
      matchedStyle => text !== undefined && text.includes(matchedStyle)
    );
    if (match) {
      styleName = COMMENTTYPEMAP.get(match).style;
      isBookmark = COMMENTTYPEMAP.get(match).isBookmark;
    }
  };
  u_scanstyles(comment);
  if (comment && isBookmark) {
    BOOKMARKS.push({ lineNum: lineNum, comment, styleName });
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeBookmarkViewData(script_page): any {
  BOOKMARKS.splice(0, BOOKMARKS.length); // clear BOOKMARKS
  script_page.forEach(line => m_GetBookmarkFromScriptLine(line));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBookmarkViewData(): any {
  return BOOKMARKS;
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  COMMENTTYPEMAP,
  // STYLES INTERFACE
  GetCommentStyles,
  AddStyle,
  DeleteStyle,
  GetClasses,
  // BOOKMARKS INTERFACE
  MakeBookmarkViewData,
  GetBookmarkViewData
};
