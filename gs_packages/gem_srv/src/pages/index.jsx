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
import CommonUI from '../blocks/views/CommonUI';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { FullScreen, Row, CellFixed, Cell } from '../blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FullScreen>
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
        <CellFixed width="20em" style={{ backgroundColor: 'white' }}>
          <URTabbedView>
            <CommonUI label="Common" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </FullScreen>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
