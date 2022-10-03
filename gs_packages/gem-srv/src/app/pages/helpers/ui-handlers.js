/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  helper methods for binding events (mouse and touch) to a container element

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** ADD TOUCHSUPPORT
 *  http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
 */
export function m_TouchHandler(event) {
  let touch = event.changedTouches[0];
  let simulatedEvent = document.createEvent('MouseEvent');
  simulatedEvent.initMouseEvent(
    {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup'
    }[event.type],
    true,
    true,
    window,
    1,
    touch.screenX,
    touch.screenY,
    touch.clientX,
    touch.clientY,
    false,
    false,
    false,
    false,
    0,
    null
  );
  touch.target.dispatchEvent(simulatedEvent);
  event.preventDefault();
}
/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function EmptyContainer(id = 'container') {
  // grab pre-defined dom elements:
  // a m_container with a number of m_entities in it
  let container = document.getElementById(id);
  while (container.firstChild) {
    //The list is LIVE so it will re-index each call
    container.removeChild(container.firstChild);
  }
  return container;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function AddTouchEvents(touchContainer) {
  touchContainer.addEventListener('touchstart', m_TouchHandler, true);
  touchContainer.addEventListener('touchmove', m_TouchHandler, true);
  touchContainer.addEventListener('touchend', m_TouchHandler, true);
  touchContainer.addEventListener('touchcancel', m_TouchHandler, true);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function AddMouseEvents(container) {
  // store the beginning of a click-drag
  // used to calculate deltas to apply to object group
  const o_clickHandler = e => {
    const id = e.target.getAttribute('entity-id');
    if (id) console.log(`clicked entity-id ${id}`);
  };

  let ox1;
  let oy1;
  let ox2;
  let oy2;
  let cx;
  let cy;
  let dragActive = false;
  let dragElement;

  const o_dragStart = e => {
    const { target } = e;
    // target is clicked element, currentTarget is owner of listener: container
    // if the target isn't container, meaning an element was clicked...
    if (target !== container) {
      dragElement = target;
      dragActive = true;
      // offset to center of draggable element
      cx = dragElement.offsetWidth / 2;
      cy = dragElement.offsetHeight / 2;
      // bounding box for container
      ox1 = container.offsetLeft - window.scrollX;
      oy1 = container.offsetTop - window.scrollY;
      ox2 = ox1 + container.offsetWidth;
      oy2 = oy1 + container.offsetHeight;
      // offset drag point inside dragElement
      const dragRect = dragElement.getBoundingClientRect();
      cx += e.clientX - dragRect.left - cx;
      cy += e.clientY - dragRect.top - cy;
    }
  };

  const o_drag = e => {
    if (!dragActive) return;
    const mx = e.clientX;
    const my = e.clientY;
    if (mx < ox1 || mx > ox2 || my < oy1 || my > oy2) return;
    e.preventDefault();
    let x = mx - ox1 - cx; // relative to container
    let y = my - oy1 - cy;
    dragElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    /* DISABLED BLOCK - relies on global app state object which doesn't exist *\
    // handle group dragging
    if (m_approot.state.grouped) {
      for (let i = 0; i < m_entities.length; i++) {
        const fdiv = m_entities[i];
        if (fdiv !== dragElement) {
          const divRect = fdiv.getBoundingClientRect();
          // e is the element being dragged
          // x is the starting point in coord relative to container
          // divRect.left is the coordinate of the fdiv
          let dx = divRect.left - e.clientX; // distance between drag and fdiv
          // console.log('fdiv', divRect.x, 'dx', dx);
          // not sure why this isn't working
          //  fdiv.style.transform = `translate3d(${cx}px, ${0}px, 0)`;
        }
      }
    }
      \* END DISABLED BLOCK */
  };

  const o_dragend = () => {
    dragElement = null;
    dragActive = false;
  };

  container.addEventListener('mousedown', o_dragStart);
  container.addEventListener('mousemove', o_drag);
  document.addEventListener('mouseup', o_dragend); // catch mouseup anywhere
  container.addEventListener('click', o_clickHandler);
}
