/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Map Editor

  * Define instances to be generated
  * Set init properties for the instances
  * Update init script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelRounds from './components/PanelRounds';
import PanelBlueprints from './components/PanelBlueprints';
import PanelMapInstances from './components/PanelMapInstances';

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MAPEDITOR');
const DBG = false;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class MapEditor extends React.Component {
  constructor() {
    super();
    this.OnPanelClick = this.OnPanelClick.bind(this);
  }

  componentDidMount() {}

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {}

  OnPanelClick(id) {
    // Do something?
    if (DBG) console.log(...PR('OnPanelClick', id));
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { projId, bpidList, classes } = this.props;
    if (DBG) console.log(...PR('render', classes));
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto auto',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <PanelRounds id="rounds" modelId={projId} />
        <PanelBlueprints
          id="blueprints"
          projId={projId}
          bpidList={bpidList}
          enableAdd
        />
        <PanelMapInstances id="instances" />
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MapEditor);
