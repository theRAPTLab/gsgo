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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are defined in gem-ui.css
const COMMENTTYPEMAP = new Map<string, any>();

COMMENTTYPEMAP.set('🔎 WHAT', {
  cssClass: 'explanationCommentHeader',
  help: 'Explanation of how this code works',
  isBookmark: false
});

COMMENTTYPEMAP.set('🔎', {
  cssClass: 'explanationCommentBody',
  help: 'Additional explanations of how something works',
  isBookmark: false
});

COMMENTTYPEMAP.set('✏️ CHANGE', {
  cssClass: 'changeCommentHeader',
  help: 'Code that should be changed by a student',
  isBookmark: true
});

COMMENTTYPEMAP.set('✏️', {
  cssClass: 'changeCommentBody',
  help: 'Additional details of what a student might change',
  isBookmark: false
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns ALL of the values in COMMENTYPEMAP, including the matchstring
 *  @return {Array} [ ...{ matchString, cssClass, help, isBookmark }]
 */
function GetCommentTypes() {
  const keys = [...COMMENTTYPEMAP.keys()];
  const types = [];
  keys.forEach(k => {
    types.push({ matchString: k, ...COMMENTTYPEMAP.get(k) });
  });
  return types;
}

/// STYLE INTERFACE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** AddStyle
 *  @param {any} style
 *  @param {string} style.matchString
 *  @param {string} style.cssClass
 *  @param {string} style.help
 *  @param {boolean} style.isBookmark
 */
function AddStyle(style: {
  matchString: string;
  cssClass: string;
  color: string;
  backgroundColor: string;
  help: string;
  isBookmark: boolean;
}) {
  let { matchString, cssClass, color, backgroundColor, help, isBookmark } = style;
  // Check for existence before styleMap
  if (COMMENTTYPEMAP.has(matchString)) {
    const orig = COMMENTTYPEMAP.get(matchString);
    cssClass = cssClass || orig.cssClass;
    color = color || orig.color;
    backgroundColor = backgroundColor || orig.backgroundColor;
    help = help || orig.help;
    isBookmark = isBookmark || orig.isBookmark;
  }
  COMMENTTYPEMAP.set(matchString, {
    cssClass,
    color,
    backgroundColor,
    help,
    isBookmark
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** DeleteStyle
 *  @param {string} matchString
 */
function DeleteStyle(matchString) {
  COMMENTTYPEMAP.delete(matchString);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GetClasses -- Get comment style classes.  Used in SharedElements.GToken()
 *  to style the comments in the wizard views.
 *  @param {string} type
 *  @param {string} label
 *  @return {string}
 */
function GetClasses(type: string, label: string): string {
  let classes: string;
  if (type === '{noncode}') {
    classes = ' styleComment';
    COMMENTTYPEMAP.forEach((value, key) => {
      if (label.includes(key)) classes += ` ${value.cssClass}`;
    });
  }
  return classes;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GetClasses -- Get comment style classes.  Used in SharedElements.GToken()
 *  to style the comments in the wizard views.
 *  @param {string} type
 *  @param {string} label
 *  @return {string}
 */
function GetCSSStyle(type: string, label: string): any {
  let cssStyle: any = {};
  if (type === '{noncode}') {
    COMMENTTYPEMAP.forEach((value, key) => {
      if (label.includes(key)) {
        if (value.color) cssStyle = { ...cssStyle, ...{ color: value.color } };
        if (value.backgroundColor)
          cssStyle = {
            ...cssStyle,
            ...{ backgroundColor: value.backgroundColor }
          };
      }
    });
  }
  return cssStyle;
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
  const matchStrings = [...COMMENTTYPEMAP.keys()];
  let cssClass = '';
  let isBookmark = false;
  let help = '';
  const u_scanstyles = text => {
    const match = matchStrings.find(
      matchedString => text !== undefined && text.includes(matchedString)
    );
    if (match) {
      cssClass = COMMENTTYPEMAP.get(match).cssClass;
      help = COMMENTTYPEMAP.get(match).help;
      isBookmark = COMMENTTYPEMAP.get(match).isBookmark;
    }
  };
  u_scanstyles(comment);
  if (comment && isBookmark) {
    BOOKMARKS.push({ lineNum, comment, cssClass, help });
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
  GetCommentTypes,
  // STYLES INTERFACE
  AddStyle,
  DeleteStyle,
  GetClasses,
  GetCSSStyle,
  // BOOKMARKS INTERFACE
  MakeBookmarkViewData,
  GetBookmarkViewData
};
