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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*// _comment_types.toml EXAMPLE //////////////////////////////////////////////

Comment Types are defined here via COMMENTTYPEMAP and then overriden by the
definitions in `_comment_types.toml`.

Example _comment_types.toml file header.  Save a copy in
  `/gs_assets/art-assets/preferences`

    ``` _comment_types.toml
    # PREFERENCES
    #
    #   Preferences are site-wide settings that apply to all projets.
    #
    #   Current Preferences support:
    #     * Comment Types
    #
    # Comment Types
    #   Comment Types are used to define the visual display of comments
    #   in the ScriptEditor views.  You can define:
    #     * `matchString` -- the search string used to set the visual style
    #     * `cssClass` -- use a pre-defined css class (from `gem-ui.css`)
    #     * `color` (optional) -- css color to use to override cssClasses
    #     * `backgroundColor` (optional) -- css backgroundColorsto use to override cssClasses
    #     * `help` -- Short help blurb to display in the comment edit pane
    #     * `isBookmark` -- flag to mark the comment type as a bookmark,
    #                       selectable from the ScriptEditor script lines view
    #
    #   To set the comment colors, use either:
    #     A.`cssClass` to one of the predefined styles, or...
    #        - commentKeyHeader
    #        - explanationCommentHeader
    #        - explanationCommentBody
    #        - changeCommentHeader
    #        - changeCommentBody
    #     B. 'color' and/or 'backgroundColor' to override the color
    #        You can use either 'color', or 'backgroundColor' or both.
    #        Any colors defined will override the cssClass style.
    #        Colors are defined as css values.  You can use:
    #        * hexadecimal "#rgb" "#rrggbb", e.g. "#f00" for red
    #        * rgb alpha "rgba(r,g,b,a)", e.g. "rgba(255,0,0,0.5)" for a transparent red
    #
    #   You can override existing styles by adding them by using the
    #   same `matchString` in the COMMENTTYPEMAP defined in
    #   `gs_packages/gem-srv/src/modules/sim/script/tools/comment-utilities.ts`
    #
    ```

You can also define a base type for COMMENTTYPEMAP in this file.  This base
definition will be overriden by any matching styles set in _comment_styles.toml
e.g. ```
    COMMENTTYPEMAP.set('🔎', {
      cssClass: 'explanationCommentHeader',
      color: 'rgba(0,0,0,1)',
      backgroundColor: 'rgba(0,255,0,0.5)',
      help: 'Explanation of how this code works',
      isBookmark: false
    });
```

/////////////////////////////////////////////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are defined in gem-ui.css
const COMMENTTYPEMAP = new Map<string, any>();
/// Define any default base styles here.  These will be overriden by _comment_styles.toml
// COMMENTTYPEMAP.set('🔎', {
//   cssClass: 'explanationCommentHeader',
//   color: 'rgba(0,0,0,1)',
//   backgroundColor: 'rgba(0,255,0,0.5)',
//   help: 'Explanation of how this code works',
//   isBookmark: false
// });

/// STYLE INTERFACE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** AddType
 *  @param {any} type
 *  @param {string} type.matchString
 *  @param {string} type.cssClass
 *  @param {string} type.color
 *  @param {string} type.backgroundColor
 *  @param {string} type.help
 *  @param {boolean} type.isBookmark
 */
function AddType(type: {
  matchString: string;
  cssClass: string;
  color: string;
  backgroundColor: string;
  help: string;
  isBookmark: boolean;
}) {
  let { matchString, cssClass, color, backgroundColor, help, isBookmark } = type;
  // override any existing styles
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
/** DeleteType
 *  @param {string} matchString
 */
function DeleteType(matchString) {
  COMMENTTYPEMAP.delete(matchString);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GetCommentTypeMatchStrings -- Retrieve a list of all comment type
 *  matchStrings (keys) used to define comment types map.
 *  Used by SlotEditor_CommentBlock to parse a comment line into the
 *  style matchString prefix (e.g. `🔎 WHAT`) and comment text.
 *  NOTE: Sorts the map so that searches always match the longest string
 *  @return {Array} [ keys ]
 */
function GetCommentTypeKeys() {
  const commentTypes = [...COMMENTTYPEMAP.keys()];
  commentTypes.sort((a, b) => {
    if (a.length > b.length) return -1;
    else if (a.length < b.length) return 1;
    else return 0;
  });
  return commentTypes;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns COMMENTYPEMAP with
 *    * the `matchString` (e.g. the COMMENTYTPEMAP keys) inserted
 *    * the types sorted by longest string to faciliate search
 *
 *  Used by project-server to load preferences during:
 *    * Main project load during Main init
 *    * ScriptEditor initialization to construct comment types
 *  Originally sourced from ac-preferences.GetPreferences...
 *  ...via project-server.RequestPreferences...
 *  ...which in turn comes from ScriptEditor.Initialize
 *  @return {Array} [ ...{ matchString, cssClass, help, isBookmark }]
 */
function GetCommentTypesWithMatchString() {
  const keys = GetCommentTypeKeys();
  const types = [];
  keys.forEach(k => {
    types.push({ matchString: k, ...COMMENTTYPEMAP.get(k) });
  });
  return types;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** GetCSSClassNames -- Looks up the css class that is defineded for a comment type.
 *  gem-ui.css has a number of predefined css classes used for styling comments
 *  in the wizard view via the `className` attribute.
 *  This retrieves the class names defined for that type in _comment_types.toml.
 *  Used in SharedElements.GToken() to style the comments in the wizard views.
 *  @param {string} type
 *  @param {string} label
 *  @return {string} e.g. ' styleComment explanationCommentHeader`
 */
function GetCSSClassNames(type: string, label: string): string {
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
/** GetCSSStyle -- Looks up the custom css style attributes defined for a
 *  comment type, e.g. `color` and `backgroundColor`.
 *  Used in conjunction with GetCSSClasses to construct the comment style.
 *  `className` (retreived from GetCSSClasses, above) defines the base class,
 *  and the `style` attribute (retrieved from this GetCSSStyle method) overrides
 *  the base style with additional settings.
 *  Used in SharedElements.GToken() to style the comments in the wizard views.
 *  Currently supports:
 *    * color
 *    * backgroundColor
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
  const matchStrings = GetCommentTypeKeys();

  let cssClass = '';
  let isBookmark = false;
  let help = '';

  const u_scantypes = text => {
    const match = matchStrings.find(
      matchedString => text !== undefined && text.includes(matchedString)
    );
    if (match) {
      cssClass = COMMENTTYPEMAP.get(match).cssClass;
      help = COMMENTTYPEMAP.get(match).help;
      isBookmark = COMMENTTYPEMAP.get(match).isBookmark;
    }
  };

  u_scantypes(comment);
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
  // STYLES INTERFACE
  AddType,
  DeleteType,
  GetCommentTypeKeys,
  GetCommentTypesWithMatchString,
  GetCSSClassNames,
  GetCSSStyle,
  // BOOKMARKS INTERFACE
  MakeBookmarkViewData,
  GetBookmarkViewData
};
