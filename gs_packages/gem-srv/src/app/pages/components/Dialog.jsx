/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Dialog

  A generic pico.css confirmation dialog.

  Returns:
    true  if user clicked "yes" message
    fasle if user clicked "no" message


  COMPONENT USAGE

      <Dialog
        id='ConfirmCloseDialog'
        open={dialogIsOpen}
        message={`Are you sure you want to leave without saving the "${bpName}" script?`}
        yesMessage={`Leave ${bpName} without saving`}
        noMessage="Back to Edit"
        onClose={HandleDialogSelect}
      />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

function Dialog(props) {
  const {
    open,
    id,
    title,
    message,
    yesMessage,
    noMessage = 'Cancel',
    onClose,
    classes
  } = props;

  const isOpenClass = 'modal-is-open';
  const openingClass = 'modal-is-opening';
  const closingClass = 'modal-is-closing';

  // On Open
  // Animate and activate pixi background handling
  if (open) {
    document.documentElement.classList.add(isOpenClass, openingClass);
    const dialog = document.getElementById(id);
    dialog.setAttribute('open', true);
  }

  function CloseModal() {
    const dialog = document.getElementById(id);
    dialog.setAttribute('open', false);
    document.documentElement.classList.remove(isOpenClass, openingClass);
  }

  function HandleClick(result, event) {
    event.preventDefault();
    event.stopPropagation();
    CloseModal();
    onClose(result); // call prop method
  }

  return (
    <dialog id={id}>
      <article>
        <h3>{title}</h3>
        <p>
          {Array.isArray(message)
            ? message.map(m => <div key={m}>{m}</div>)
            : message}
        </p>
        <footer>
          <button onClick={e => HandleClick(false, e)} className="secondary">
            {noMessage}
          </button>
          <button onClick={e => HandleClick(true, e)}>{yesMessage}</button>
        </footer>
      </article>
    </dialog>
  );
}

export default withStyles(useStylesHOC)(Dialog);
