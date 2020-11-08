/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import blue from '@material-ui/core/colors/blue';

/// CUSTOM STYLES FOR COMPONENT ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const styles = theme => ({
  /* a generic area */
  wbBase: {
    padding: `${theme.spacing(1)}px`
  },
  wbArea: {
    extend: 'wbBase',
    backgroundColor: blue[50]
  },
  /* a main viewport */
  wbViewport: {
    extend: 'wbBase',
    backgroundColor: blue[200]
  },
  /* a text area */
  wbText: {
    extend: 'wbBase',
    border: `2px solid ${blue[100]}`
  },
  /* a control */
  wbControl: {
    extend: 'wbBase',
    backgroundColor: blue[100]
  },
  /* an image element */
  wbImage: {
    extend: 'wbBase',
    backgroundColor: blue[200]
  }
});

export default styles;
