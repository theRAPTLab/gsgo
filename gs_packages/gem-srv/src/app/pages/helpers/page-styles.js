/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  styles shared across all class components in the pages/ directory.

  usage:
    // import
    import { useStylesHOC } from 'pages/elements/page-styles'

    // at bottom of component
    export default withStyles(useStylesHOC)(MyComponentName);

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// COLORS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BG_COLOR = '#F0F0F0';
const BG_TITLE = '#404040';

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
    fontFamily: 'sans-serif'
  },
  title: {
    fontSize: 'large'
  },
  cell: {
    padding: '5px',
    fontFamily: 'monospace'
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
    backgroundColor: BG_COLOR
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
  devBG: {
    background: 'maroon'
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { useStylesHOC };
