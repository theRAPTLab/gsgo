/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// modeler views
import Agents from '../blocks/views/Agents';
import Interactions from '../blocks/views/Interactions';
import Move from '../blocks/views/Move';
import Playback from '../blocks/views/Playback';
import Artwork from '../blocks/views/Artwork';
import CommonSimObjects from '../blocks/views/CommonSimObjects';
import CommonSimControls from '../blocks/views/CommonSimControls';
import CommonSystem from '../blocks/views/CommonSystem';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { FullScreen, ScrollPage, Row, CellFixed, Cell } from '../blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <ScrollPage>
      <URSiteNav />
      <Row>
        <Cell>
          <URTabbedView>
            <Agents label="Agents" />
            <Interactions label="Interactions" />
            <Move label="Move" />
            <Artwork label="Artwork" />
            <Playback label="Playback" />
          </URTabbedView>
        </Cell>
        <CellFixed width="25%" style={{ backgroundColor: 'white' }}>
          <URTabbedView>
            <CommonSimObjects label="Objects" />
            <CommonSimControls label="Controls" />
            <CommonSystem label="Modules" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </ScrollPage>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
