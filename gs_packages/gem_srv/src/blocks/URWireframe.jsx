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
/**
 */
function WFComponent(props) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(true);
  const { name = 'Component', summary = 'summary', children = 'text' } = props;
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  // if you need read-only theme parameters directly in the component
  return (
    <Box className={classes.root}>
      <Box display="flex" alignItems="center">
        <Box flexGrow={1} className={classes.titlebox}>
          <Typography className={classes.compname}>&lt;{name}&gt;</Typography>
        </Box>
        <Box>
          <IconButton
            className={clsx(classes.expand, { [classes.expandOpen]: expanded })}
            onClick={handleExpandClick}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>
      <Box className={classes.summary}>{summary}</Box>
      <Collapse in={expanded} className={classes.info}>
        <div className={classes.description}>{children}</div>
      </Collapse>
    </Box>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { WFComponent, MD };
