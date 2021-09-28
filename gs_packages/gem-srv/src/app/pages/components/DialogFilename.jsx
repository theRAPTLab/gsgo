import React from 'react';
import UR from '@gemstep/ursys/client';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

function DialogFilename(props) {
  const {
    open,
    title,
    value,
    hasValidFilename,
    onChange,
    yesMessage,
    noMessage = 'Cancel',
    onClose,
    classes
  } = props;

  const message = ['Enter a unique filename', '(No spaces or punctuation)'];
  const invalidFilename = hasValidFilename ? (
    ''
  ) : (
    <p style={{ color: 'red' }}>File already exists!</p>
  );

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {Array.isArray(message)
          ? message.map(m => <div key={m}>{m}</div>)
          : message}
        <br />
        <input value={value} onChange={onChange} />
        {invalidFilename}
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={() => onClose(false)}>
          {noMessage}
        </Button>
        <Button
          disabled={!hasValidFilename}
          type="button"
          onClick={() => onClose(true)}
        >
          {yesMessage}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withStyles(useStylesHOC)(DialogFilename);
