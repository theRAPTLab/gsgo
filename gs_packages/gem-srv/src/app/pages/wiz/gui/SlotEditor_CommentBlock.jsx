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

    this.state = {
      savedCommentText: '',
      currentCommentText: ''
    };

    this.m_DeconstructCommentText = this.m_DeconstructCommentText.bind(this);
    this.m_ConstructCommentText = this.m_ConstructCommentText.bind(this);
    this.HandleStyleSelect = this.HandleStyleSelect.bind(this);
    this.ProcessCommentInput = this.ProcessCommentInput.bind(this);
    this.HandleCommentKeydown = this.HandleCommentKeydown.bind(this);
    this.OnChange = this.OnChange.bind(this);
  }

  componentDidUpdate() {
    const { defaultText } = this.props;
    const { savedCommentText } = this.state;
    if (defaultText !== savedCommentText) {
      // When the user selects a different comment line, componentDidMount
      // will not fire because the component is still active, use
      // componentDidUpdate to catch selecting a different comment line.
      // But we also don't want componentDidUpdate to fire with text input
      // or style menu selection change, or we'll inadvertently undo
      // all the current text changes.
      // So we use this to only change the current comment if the
      // selected comment line has changed.
      this.setState({
        savedCommentText: defaultText,
        currentCommentText: defaultText
      });
    }
  }

  /** Deconstruct stored script comment text into components,
   * splitting out prefix from body, e.g. `🔎 WHAT DOES THIS MODEL DO?` becomes:
   *   prefix: `🔎 WHAT`
   *   body: `DOES THIS MODEL DO?`
   * @param {*} rawcomment
   * @returns {Object} { commentTextPrefix:string, commentTextBody:string }
   */
  m_DeconstructCommentText(rawcomment) {
    const COMMENTTYPEMAP = CHELPER.COMMENTTYPEMAP;
    const commentStyles = [...COMMENTTYPEMAP.keys()];
    commentStyles.sort((a, b) => {
      if (a.length > b.length) return -1;
      else if (a.length < b.length) return 1;
      else return 0;
    });
    let commentTextPrefix = '';
    let commentTextBody = rawcomment;
    // Find the defined style
    const style = commentStyles.find(s => String(rawcomment).startsWith(s));
    if (style) {
      commentTextPrefix = style;
      commentTextBody = String(rawcomment).substring(style.length).trimStart();
    }
    // Return the deconstructed pieces
    return {
      commentTextPrefix,
      commentTextBody
    };
  }

  /// Concatenate prefx + body - - - - - - - - - - - - - - - - - - - -
  m_ConstructCommentText(commentTextPrefix, commentTextBody) {
    const commentText = commentTextPrefix
      ? `${commentTextPrefix} ${commentTextBody}`
      : commentTextBody;
    return commentText;
  }

  /// Comment Style Selection Handlers - - - - - - - - - - - - - - - - - - - -
  HandleStyleSelect(event) {
    event.preventDefault();
    const { currentCommentText } = this.state;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(currentCommentText);
    const updatedCommentTextPrefix = event.target.value;
    this.OnChange(updatedCommentTextPrefix, commentTextBody);
  }

  /// Comment Input Handlers - - - - - - - - - - - - - - - - - - - - - - - - -
  ProcessCommentInput(event) {
    event.preventDefault();
    const { currentCommentText } = this.state;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(currentCommentText);
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
    const updatedCommentText = this.m_ConstructCommentText(
      commentTextPrefix,
      commentTextBody
    );
    this.setState({ currentCommentText: updatedCommentText });
    onChange(updatedCommentText);
  }

  /// render - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    const { currentCommentText } = this.state;
    const { commentTextPrefix, commentTextBody } =
      this.m_DeconstructCommentText(currentCommentText);
    const COMMENTTYPEMAP = CHELPER.COMMENTTYPEMAP;
    const commentStyleOptions = [];
    COMMENTTYPEMAP.forEach((val, key) => {
      const optionkey = `cstyle${key}`;
      commentStyleOptions.push(
        <option key={optionkey} value={key}>
          {key}: {val.help}
          {val.isBookmark ? '🔖' : ''}
        </option>
      );
    });
    /// Show comment choices
    /// There are two types of comment choices to inject into the chooser:
    /// A. A menu of comment style choices
    const commentStyles = [...COMMENTTYPEMAP.keys()];
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
            -- no style --
          </option>
          {commentStyleOptions}
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
