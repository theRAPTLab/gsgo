/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import merge from 'deepmerge';
// material ui
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';

// utility components
import wireframeStyles from '../modules/style/wireframing';
import { MD } from '../components/ReactMarkdown';

/// SHARED CUSTOM STYLES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// create useStyles() hook with theme object included
/// the useStyles() hook also can receive a parameter for further customization
const useStyles = makeStyles(theme => {
  const space = `${theme.spacing(1)}px`;
  return merge.all([
    {
      root: {
        backgroundColor: 'white',
        marginBottom: space
      },
      WFroot: {
        opacity: 0.7
      },
      titlebox: {
        padding: `0 0 0 ${space}`
      },
      summary: {
        marginTop: '-0.5em',
        marginBottom: '0.5em',
        padding: `0 ${space}`,
        color: theme.palette.grey[500]
      },
      description: {
        fontSize: '1em',
        padding: space
      },
      info: {
        backgroundColor: theme.palette.grey[50],
        borderTop: `1px dotted ${theme.palette.grey[300]}`
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
    summary ? <Box className={classes.summary}>{summary}</Box> : '';

  // if you need read-only theme parameters directly in the component
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { WF, MD };
