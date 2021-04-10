/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Map Editor

  * Define instances to be generated
  * Set init properties for the instances
  * Update init script

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelBlueprints from './components/PanelBlueprints';
import PanelMapInstances from './components/PanelMapInstances';

// this is where classes.* for css are defined
import { useStylesHOC } from './elements/page-xui-styles';
import './scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('MAPEDITOR');
const DBG = true;

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
  }

  /*  Renders 2-col, 3-row grid with TOP and BOTTOM spanning both columns.
   *  The base styles from page-styles are overidden with inline styles to
   *  make this happen.
   */
  render() {
    const { modelId, model, classes } = this.props;
    const mapInstanceSpec = model && model.instances ? model.instances : [];
    const agents =
      model && model.scripts
        ? model.scripts.map(s => ({ id: s.id, label: s.label }))
        : [];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '100px auto',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <PanelBlueprints
          id="blueprints"
          modelId={modelId}
          agents={agents}
          enableAdd
        />
        <PanelMapInstances id="instances" mapInstanceSpec={mapInstanceSpec} />
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(MapEditor);
