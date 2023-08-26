/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SlotEditor_CommentBlock

  Provides a UI for selecting comment styles and inputting comment text.
  This replaces the `choicesjsx` block for comment editing.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as CHELPER from 'script/tools/comment-utilities';
import { HelpLabel } from '../SharedElements';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SLOTEDITOR_CommentBlock', 'TagApp');

/// ROOT APPLICATION COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SlotEditor_CommentBlock extends React.Component {
  constructor(props) {
    super(props);

    const commentStyles = [...CHELPER.COMMENTTYPEMAP.keys()];
    this.state = {
      commentStyles
    };

    this.m_DeconstructCommentText = this.m_DeconstructCommentText.bind(this);
    this.m_ConstructCommentText = this.m_ConstructCommentText.bind(this);
    this.HandleStyleSelect = this.HandleStyleSelect.bind(this);
    this.ProcessCommentInput = this.ProcessCommentInput.bind(this);
    this.HandleCommentKeydown = this.HandleCommentKeydown.bind(this);
    this.OnChange = this.OnChange.bind(this);
  }

  /** Deconstruct stored script comment text into components,
   * splitting out prefix from body, e.g. `🔎 WHAT DOES THIS MODEL DO?` becomes:
   *   prefix: `🔎 WHAT`
   *   body: `DOES THIS MODEL DO?`
   * @param {*} rawcomment
   * @returns {Object} { commentTextPrefix:string, commentTextBody:string }
   */
  m_DeconstructCommentText(rawcomment) {
    const { commentStyles } = this.state;
    let commentTextPrefix = '';
    let commentTextBody = rawcomment;
    // Find the defined style
    const style = commentStyles.find(s => String(rawcomment).startsWith(s));
    if (style) {
      commentTextPrefix = style;
      commentTextBody = String(rawcomment).substring(style.length);
    }
    // Return the deconstructed pieces
    return {
      commentTextPrefix,
      commentTextBody
    };
  }

  /// Concatenate prefx + body - - - - - - - - - - - - - - - - - - - -
  m_ConstructCommentText(commentTextPrefix, commentTextBody) {
    const commentText = `${commentTextPrefix}${commentTextBody}`;
    return commentText;
  }

  /// Comment Style Selection Handlers - - - - - - - - - - - - - - - - - - - -
  HandleStyleSelect(event) {
    event.preventDefault();
    const { defaultText } = this.props;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(defaultText);
    const updatedCommentTextPrefix = event.target.value;
    this.OnChange(updatedCommentTextPrefix, commentTextBody);
  }

  /// Comment Input Handlers - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Special handling for comments -- handle input updates
  /// directly from the comment input component, and stuff
  /// the changed text directly into script line.
  ProcessCommentInput(event) {
    event.preventDefault();
    const { defaultText } = this.props;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(defaultText);
    const updatedCommentTextBody = event.target.value;
    this.OnChange(commentTextPrefix, updatedCommentTextBody);
  }
  HandleCommentKeydown(event) {
    if (event.key === 'Enter') {
      this.ProcessCommentInput(event);
      event.target.select();
    }
  }

  /// Trigger parent Comment onChange Handler - - - - - - - - - - - - - - - - - - - -
  OnChange(commentTextPrefix, commentTextBody) {
    const { onChange } = this.props;
    const commentText = `${commentTextPrefix}${commentTextBody}`;
    onChange(commentText);
  }

  /// render - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    const { defaultText } = this.props;
    const { commentStyles } = this.state;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(defaultText);

    /// Show comment choices
    /// There are two types of comment choices to inject into the chooser:
    /// A. A menu of comment style choices
    const commentStyleChoicesJsx = (
      <div
        style={{
          margin: '0 10px',
          padding: '10px 0'
        }}
      >
        <HelpLabel
          prompt={'A. (OPTIONAL) Select a Comment Style'}
          info={'Use comment styles to auto-format comment text.'}
          open
          pad="5px"
        />
        <select value={commentTextPrefix} onChange={this.HandleStyleSelect}>
          <option key={'cstyle'} value={''}>
            -- Select a Comment Style --
          </option>
          {commentStyles.map((style, i) => {
            const key = `cstyle${i}`;
            return (
              <option key={key} value={style}>
                {style}
              </option>
            );
          })}
        </select>
      </div>
    );
    /// B. An input field for the comment text
    const commentInputJsx = (
      <>
        <div id="SES_str" className="gsled input">
          <HelpLabel
            prompt={'B. Type in a comment'}
            info={'Comments are text strings to describe the intent of the code.'}
            open
            pad="5px"
          />
          <input
            value={commentTextBody}
            type="text"
            onChange={this.ProcessCommentInput}
            onKeyDown={this.HandleCommentKeydown}
          />
        </div>
        <div className="gsled choicesline choiceshelp">
          SELECTED: Comment text is used to add comments to scripts.
        </div>
      </>
    );

    return (
      <>
        {commentStyleChoicesJsx}
        {commentInputJsx}
      </>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SlotEditor_CommentBlock;
