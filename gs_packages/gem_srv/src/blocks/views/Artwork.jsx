/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Artwork View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { View, Row, Cell, CellFixed, MD } from '../URLayout';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ELEMENTS = `
### ARTWORK
* ${MD.cq('BGList')}
* ${MD.cq('BGEditor')}
* ${MD.cq('AddBGBtn')}
* ${MD.cq('ImportBGBtn')}
* ${MD.cq('DelBGBtn')}
* ${MD.cq('EditBGBtn')}
* ${MD.cq('CostumeList')}
* ${MD.cq('CostumeEditor')}
* ${MD.cq('ImportCostumeBtn')}
* ${MD.cq('AddCostumeBtn')}
* ${MD.cq('DelCostumeBtn')}
* ${MD.cq('EditCostumeBtn')}
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
Creating Artwork
* simple paint program
* labels of different skins
* background
* save | delete | erase
* import
`;

/// LOCAL STYLES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const useStyles = makeStyles(theme => ({
  inset: { padding: `${theme.spacing(1)}px` }
}));

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Artwork() {
  const classes = useStyles();

  return (
    <View className={classes.inset}>
      <Row>
        <CellFixed width={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Artwork;
