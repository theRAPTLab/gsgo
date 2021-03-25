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

function DialogConfirm(props) {
  const {
    open,
    message,
    yesMessage,
    noMessage = 'Cancel',
    onClose,
    classes
  } = props;
  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>{message}</DialogTitle>
      <DialogActions>
        <Button type="button" onClick={() => onClose(false)}>
          {noMessage}
        </Button>
        <Button type="button" onClick={() => onClose(true)}>
          {yesMessage}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withStyles(useStylesHOC)(DialogConfirm);
