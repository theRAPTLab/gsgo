/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useRef } from 'react';
// left-side tabbed views
import Welcome from '../page-tabs/example/Welcome';
import SessionMgr from '../page-tabs/example/SessionMgr';
import Simulator from '../page-tabs/example/Simulator';
import Modeler from '../page-tabs/example/Modeler';
import AssetMgr from '../page-tabs/example/AssetMgr';
import Annotation from '../page-tabs/example/Annotation';
// right-side documentation reference
import DocSimObjects from '../components/DocSimObjects';
import DocSimControls from '../components/DocSimControls';
import DocSystem from '../components/DocSystem';
// ursys components
import URSiteNav from '../page-blocks/URSiteNav';
import URTabbedView from '../page-blocks/URTabbedView';
import { URView, Row, CellFixed, Cell } from '../page-blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: this is rendered both on the server once and on the client
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <URView scrollable>
      <URSiteNav />
      <Row>
        <Cell>
          <URTabbedView>
            <Welcome label="Welcome" />
            <SessionMgr label="Load" />
            <Modeler label="Model" />
            <Simulator label="Simulate" />
            <Annotation label="Observe" />
            <AssetMgr label="Images" />
          </URTabbedView>
        </Cell>
        <CellFixed
          style={{
            maxWidth: '320px',
            minWidth: '320px',
            backgroundColor: 'white'
          }}
        >
          <URTabbedView>
            <DocSimObjects label="Objects" />
            <DocSimControls label="Controls" />
            <DocSystem label="Modules" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
