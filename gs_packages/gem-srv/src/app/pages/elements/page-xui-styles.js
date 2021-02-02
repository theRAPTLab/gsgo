/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Revamped styles for the experimental UI interface.

  This is based on page-styles.js

  usage:
    // import
    import { useStylesHOC } from './common-styles'

    // at bottom of component
    export default withStyles(useStylesHOC)(MyComponentName);

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// COLORS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BG_COLOR = 'transparent';
const BG_TITLE = '#404040';

const CLR_R = 60;
const CLR_G = 256;
const CLR_B = 256;

const CLR_HI_R = 256;
const CLR_HI_G = 30;
const CLR_HI_B = 30;

function RGBA(r, g, b, a) {
  return `rgba(${r},${g},${b},${a})`;
}
// Color Shift: Limit to 0 - 256
function CShift(c, shift) {
  return Math.max(0, Math.min(256, c + shift));
}
function RGBAShift(r, g, b, a, shift) {
  return `rgba(${CShift(r, shift)}, ${CShift(g, shift)}, ${CShift(
    b,
    shift
  )}, ${a})`;
}
function BaseColorShift(shift, alpha) {
  return RGBAShift(CLR_R, CLR_G, CLR_B, alpha, shift);
}

const CLR_LABEL = BaseColorShift(-150, 1); // '#006600';
const CLR_DATA = BaseColorShift(-100, 1); // '#009900';
const CLR_DATA_INACTIVE = BaseColorShift(-200, 1); // '#003300';
const CLR_ACTIVE = BaseColorShift(50, 1); // '#33FF33';
const CLR_PANEL_BG = BaseColorShift(0, 0.1); // 'rgba(0,256,0,0.1)'; // gradient start
const CLR_PANEL_BG_END = BaseColorShift(0, 0.05); // 'rgba(0,256,0,0.05)'; // gradient end
const CLR_OBJECT = BaseColorShift(0, 0.04); // 'rgba(0,256,0,0.04)'; // a filled object that sits on top of a panel
const CLR_OBJECT_CLICKABLE = BaseColorShift(0, 0.1); // 'rgba(0,256,0,0.1)'; // a more prominent filled object that sits on top of a panel
const CLR_BORDER_BACK = BaseColorShift(128, 0.15); // 'rgba(128,256,128,0.15)'; // backmost panel border
const CLR_BORDER = BaseColorShift(128, 0.3); // 'rgba(128,256,128,0.3)';
const CLR_BORDER_ACTIVE = BaseColorShift(0, 0.6); // 'rgba(0,256,0,0.6)';

const CLR_HI = RGBA(CLR_HI_R, CLR_HI_G, CLR_HI_B, 1);

const FONT_FAMILY = 'Andale Mono, monospace';

/// STYLE DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStylesHOC = theme => ({
  root: {
    display: 'grid',
    width: '100vw',
    height: '100vh',
    gridTemplateColumns: '240px auto 120px',
    gridTemplateRows: '50px auto 100px',
    gridGap: theme.spacing(1),
    fontFamily: 'sans-serif',
    backgroundColor: '#000',
    scrollbarColor: 'red yellow',
    scrollbarWidth: '10px'
  },
  title: {
    fontSize: 'large'
  },
  cell: {
    padding: '5px',
    fontFamily: FONT_FAMILY
  },
  main: {
    gridColumnEnd: 'span 1',
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  top: {
    gridColumnEnd: 'span 3',
    color: 'white',
    backgroundColor: BG_TITLE
  },
  right: {
    gridColumnEnd: 'span 1',
    backgroundColor: BG_COLOR
  },
  left: {
    gridColumnEnd: 'span 1',
    backgroundColor: BG_COLOR,
    display: 'grid',
    overflow: 'hidden'
  },
  bottom: {
    gridColumnEnd: 'span 3',
    backgroundColor: BG_COLOR
  },
  list: {
    marginLeft: 0,
    paddingLeft: 0,
    listStyle: 'none',
    '& a': {
      color: theme.palette.primary.main,
      fontSize: '150%',
      fontWeight: 'bold',
      display: 'block',
      marginBottom: theme.spacing(0.25),
      textDecoration: 'none'
    },
    '& a:visited': { color: theme.palette.primary },
    '& li + li': { marginTop: theme.spacing(2) }
  },
  panel: {
    color: CLR_DATA,
    border: `1px solid ${CLR_BORDER_BACK}`,
    background: `linear-gradient(${CLR_PANEL_BG}, ${CLR_PANEL_BG_END})`,
    padding: '3px'
  },
  panelTitle: {
    color: CLR_ACTIVE,
    backgroundColor: CLR_PANEL_BG
  },
  panelMessage: {
    color: CLR_ACTIVE
  },
  panelMessageError: {
    color: CLR_HI
  },
  infoLabel: {
    display: 'inline-block',
    color: CLR_LABEL,
    width: '80px',
    textAlign: 'right',
    textTransform: 'uppercase',
    paddingRight: '0.5em'
  },
  infoLabelColor: {
    color: CLR_LABEL
  },
  infoLabelMinimized: {
    display: 'none'
  },
  infoData: {
    display: 'inline-block',
    color: CLR_DATA,
    width: '100px'
  },
  infoDataColor: {
    color: CLR_DATA
  },
  infoDataInactiveColor: {
    color: CLR_DATA_INACTIVE
  },
  infoDataMinimized: {
    width: 'auto',
    paddingRight: '0.5em'
  },
  infoActive: {
    color: CLR_ACTIVE
  },
  inspectorLabel: {
    display: 'inline-block',
    color: CLR_DATA,
    // width: '80px',
    textAlign: 'right'
  },
  inspectorData: {
    display: 'inline-block',
    color: CLR_ACTIVE // more visible
    // width: '100px'
  },
  outline: {
    border: `1px solid ${CLR_BORDER}`
  },
  filledOutline: {
    border: `1px solid ${CLR_BORDER}`,
    backgroundColor: CLR_OBJECT
  },
  instructions: {
    color: CLR_LABEL,
    fontStyle: 'italic'
  },
  instanceListItem: {
    padding: '5px',
    margin: '5px',
    borderRadius: '5px',
    color: CLR_DATA,
    backgroundColor: CLR_OBJECT_CLICKABLE,
    cursor: 'default'
  },
  instanceListItemInactive: {
    color: CLR_LABEL,
    backgroundColor: CLR_OBJECT
  },
  button: {
    fontSize: '18px',
    padding: '5px',
    margin: '5px',
    minHeight: '50px',
    minWidth: '50px',
    borderRadius: '5px',
    color: CLR_DATA,
    backgroundColor: CLR_OBJECT_CLICKABLE,
    borderTopColor: BaseColorShift(0, 0.2),
    borderLeftColor: BaseColorShift(0, 0.2),
    borderRightColor: BaseColorShift(-240, 0.2),
    borderBottomColor: BaseColorShift(-240, 0.2),
    cursor: 'pointer'
  },
  buttonDisabled: {
    color: CLR_LABEL,
    backgroundColor: CLR_OBJECT,
    borderTopColor: BaseColorShift(0, 0.1),
    borderLeftColor: BaseColorShift(0, 0.1),
    borderRightColor: BaseColorShift(-240, 0.1),
    borderBottomColor: BaseColorShift(-240, 0.1),
    cursor: 'not-allowed'
  },
  input: {
    fontSize: '18px',
    color: CLR_ACTIVE,
    borderTopColor: BaseColorShift(-240, 0.2),
    borderLeftColor: BaseColorShift(-240, 0.2),
    borderRightColor: BaseColorShift(0, 0.1),
    borderBottomColor: BaseColorShift(0, 0.1),
    backgroundColor: CLR_OBJECT_CLICKABLE
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { useStylesHOC };
