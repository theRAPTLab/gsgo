/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import merge from 'deepmerge';

// material ui
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
// material ui lists
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
// material ui slider
import Slider from '@material-ui/core/Slider';

// utility components
import wireframeStyles from '../modules/style/wireframing';
import { Row, Cell, TextView } from './URLayout';
import { MD } from '../components/MD';

/// SHARED CUSTOM STYLES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => {
  const space = `${theme.spacing(1)}px`;
  const bgBorder = theme.palette.grey[400];
  const bgColor = theme.palette.grey[400];
  const summaryColor = theme.palette.grey[500];
  const labelColor = theme.palette.grey[900];
  //
  const innerBgColor = theme.palette.grey[100];
  const infoBorder = theme.palette.grey[100];
  //
  return merge.all([
    {
      root: {
        backgroundColor: 'white',
        marginBottom: space
      },
      formRoot: {
        backgroundColor: 'white',
        padding: theme.spacing(2),
        marginBottom: space
      },
      formLabel: {
        margin: 0,
        padding: 0
      },
      sliderRoot: {},
      titlebox: {
        padding: `0 0 0 ${space}`
      },
      summary: {
        marginTop: '-0.5em',
        paddingBottom: '0.5em',
        padding: `0 ${space}`,
        color: summaryColor
      },
      label: {
        paddingBottom: '0.25em',
        color: labelColor
      },
      description: {
        backgroundColor: innerBgColor,
        borderLeft: `1px dotted ${bgBorder}`,
        borderRight: `1px dotted ${bgBorder}`,
        borderBottom: `1px dotted ${bgBorder}`,
        fontSize: '1em',
        padding: space
      },
      info: {
        backgroundColor: bgColor,
        borderTop: `1px dotted ${infoBorder}`
      },
      compname: {
        fontFamily: 'monospace',
        fontSize: '1.4rem'
      },
      expand: {
        padding: space,
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
          duration: theme.transitions.duration.shortest
        })
      },
      expandOpen: {
        transform: 'rotate(180deg)'
      }
    },
    wireframeStyles(theme)
  ]);
});

/// UR WIREFRAME COMPONENTS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** basic wireframe component
 *  example:
 *  <WF name='name', summary='short text', expanded=false>
 *    child content will be put in collapsable section
 * </WF>
 */
function WF(props) {
  const classes = useStyles();
  const { name = 'Component', summary = '', children, expanded = false } = props;
  const isWF = name.includes('WF:');
  const [isExpanded, setExpanded] = React.useState(expanded);
  const handleExpandClick = () => {
    setExpanded(!isExpanded);
  };
  const ExpandMore = () =>
    children ? (
      <IconButton
        className={clsx(classes.expand, { [classes.expandOpen]: isExpanded })}
        onClick={handleExpandClick}
      >
        <ExpandMoreIcon />
      </IconButton>
    ) : (
      <IconButton className={clsx(classes.expand)}>
        <div style={{ height: '24px', width: '24px' }} />
      </IconButton>
    );
  const Summary = () =>
    summary ? <Box className={clsx(classes.summary)}>{summary}</Box> : '';

  // if you need read-only theme parameters directly in the component
  // NOTE: { [classes.WFroot]: isWF } equiv to { 'classname': true|false }
  return (
    <Box className={clsx(classes.root, { [classes.WFroot]: isWF })}>
      <Box display="flex" alignItems="center">
        <Box flexGrow={1} className={classes.titlebox}>
          <Typography className={classes.compname}>&lt;{name}&gt;</Typography>
        </Box>
        <Box>
          <ExpandMore />
        </Box>
      </Box>
      <Summary />
      <Collapse in={isExpanded} className={classes.info}>
        <div className={classes.description}>{children}</div>
      </Collapse>
    </Box>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** cell-wrapped <WF> for use with <Row>
 *  example:
 *  <Row>
 *    <WFCell name='name', summary='short text', expanded=false>
 *      child content will be put in collapsable section
 *    </WFCell>
 *  </Row>
 */
function CellWF(props) {
  return (
    <Cell>
      <WF {...props} />
    </Cell>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WF-wrapped <Row>
 *  Makes a <WF> containing a <Row> of all children
 */
function WFChildRow(props) {
  const { children, expanded = true, ...extra } = props;
  return (
    <WF {...extra} expanded={expanded}>
      <Row>{children}</Row>
    </WF>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** WF-wrapped rows of children
 *  Makes a <WF> containing a stack of <Row> for ach child
 */
function WFChildStack(props) {
  const { children, expanded, ...extra } = props;
  const rows = React.Children.map(children, child => <Row>{child}</Row>);
  return (
    <WF {...extra} expanded={expanded}>
      {rows}
    </WF>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function WFLabel(props) {
  const classes = useStyles();
  const { text = '' } = props;
  return text ? <Box className={clsx(classes.label)}>{text}</Box> : '';
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function WFCheckItem(props) {
  const classes = useStyles();
  const { text = '' } = props;
  return text ? (
    <FormControlLabel
      className={classes.checkItem}
      style={{ 'marginLeft': 0 }}
      control={<Checkbox style={{ 'padding': 0 }} name={text} />}
      label={text}
    />
  ) : (
    ''
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function WFList(props) {
  const classes = useStyles();
  const { children, name = 'WFList', expanded, ...extra } = props;
  const list = React.Children.map(children, child => (
    <FormControlLabel control={child} name={name} />
  ));
  return (
    <div className={classes.formRoot}>
      <FormLabel
        style={{ 'marginLeft': '-11px', 'paddingBottom': '0.5rem' }}
        className={classes.formLabel}
        component="legend"
      >
        {name}
      </FormLabel>
      <FormGroup>{list}</FormGroup>
    </div>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function WFSlider(props) {
  const classes = useStyles();
  function valuetext(value) {
    return `${value}°C`;
  }
  return (
    <Box p={1} className={classes.root}>
      <Slider defaultValue={0} getAriaValueText={valuetext} />
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { WF, MD };
/// use these with <Row> and <Cell> from URLayout
export { WFChildRow, CellWF, WFChildStack };
/// specialty checklist
export { WFList, WFCheckItem, WFLabel };
/// specialty slider
export { WFSlider };
