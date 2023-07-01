/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Horizontal Dragger Component

      Use this component to implement a dragger bar that users can drag
      to resize panels.

  To Use

      <Dragger
        color="#FF00FF"
        onDragUpdate={this.onDraggerUpdate}
        onDragEnd={this.onDraggerEnd}
      />

  Properties
      color -- the color of the dragger, can be hex or string (e.g. "blue")
               OK to use alpha, e.g. "#FFFFFF33"
      onDragUpdate -- continously fires during drag
      onDragEnd -- fires on mouse up

  Returns
      Both `onDragUpdate` and `onDragEnd` returns a ratio between 0 and 1 of
      where the dragger is relative to the screen
      e.g. if the dragger is in the middle of the screen, the value is 0.5

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns ratio of dragger position relative to screen width
 * @param {Object} event UI event
 * @returns
 */
function calculateRatio(event) {
  const screenWidth = event.view.outerWidth;
  const offset = event.pageX;
  return offset / screenWidth;
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Dragger extends React.Component {
  constructor() {
    super();
    this.onMouseDown = this.onMouseDown.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.endDrag = this.endDrag.bind(this);
  }

  onMouseDown(event) {
    event.stopPropagation();
    document.onmouseup = this.endDrag;
    document.onmousemove = this.handleDrag;
  }
  handleDrag(event) {
    event.stopPropagation();
    const { onDragUpdate } = this.props;
    const ratio = calculateRatio(event);
    if (onDragUpdate) onDragUpdate(ratio);
  }
  endDrag(event) {
    event.stopPropagation();
    const { onDragUpdate, onDragEnd } = this.props;
    const ratio = calculateRatio(event);
    if (onDragUpdate) onDragUpdate(ratio);
    if (onDragEnd) onDragEnd(ratio);
    document.onmouseup = null;
    document.onmousemove = null;
  }

  render() {
    const { color = 'green', onDragUpdate, onDragEnd } = this.props;
    return (
      <div
        id="dragger"
        style={{
          float: 'left',
          height: '100%', // horizontal dragger, so full height
          width: '10px',
          cursor: 'col-resize',
          backgroundColor: color
        }}
        onMouseDown={this.onMouseDown}
      >
        &nbsp;
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default Dragger;
