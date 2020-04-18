/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example page with PageNav and full page layout

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// material ui
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { FullScreen, View, Row, Cell, CellFixed } from '../blocks/URLayout';
import MD from '../components/ReactMarkdown';

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` },
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    flexGrow: 1,
    '& > *': {
      margin: theme.spacing(1)
    }
  }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  const classes = useStyles();

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FullScreen>
      <URSiteNav />
      <URTabbedView>
        <View label="Agents" className={classes.inset}>
          <Row>
            <CellFixed width={200}>
              <MD>{`
fixed width 200
## Agents
* Bee
* Flower
* * properties
* * costume
* Add Agent
* Edit
* Delete
          `}</MD>
            </CellFixed>
            <Cell>
              <MD>{`
flex width
## Description
this cell stretches to the remaining width
              `}</MD>
            </Cell>
            <Cell>
              <MD>{`
flex width
## Form Elements
            `}</MD>
              <ButtonGroup color="primary">
                <Button color="primary" variant="contained">
                  A primary
                </Button>
                <Button color="primary" variant="disabled">
                  B disabled
                </Button>
                <Button color="secondary" variant="contained">
                  C secondary
                </Button>
              </ButtonGroup>
              <TextField
                id="outlined-full-width"
                label="Label"
                placeholder="Placeholder"
                helperText="Full width!"
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true
                }}
                variant="outlined"
              />
              <FormControl component="fieldset">
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup name="gender1" value={1}>
                  <FormControlLabel
                    value="female"
                    control={<Radio />}
                    label="Female"
                  />
                  <FormControlLabel
                    value="male"
                    control={<Radio />}
                    label="Male"
                  />
                  <FormControlLabel
                    value="other"
                    control={<Radio />}
                    label="Other"
                  />
                  <FormControlLabel
                    value="disabled"
                    disabled
                    control={<Radio />}
                    label="(Disabled option)"
                  />
                </RadioGroup>
              </FormControl>
            </Cell>
          </Row>
        </View>

        <View label="Interactions" className={classes.inset}>
          <MD>{`
## Interactions
          `}</MD>
        </View>

        <View label="Move" className={classes.inset}>
          <MD>{`
## Move
          `}</MD>
        </View>
        <View label="Playback" className={classes.inset}>
          <MD>{`
## Playback
          `}</MD>
        </View>
      </URTabbedView>
    </FullScreen>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
