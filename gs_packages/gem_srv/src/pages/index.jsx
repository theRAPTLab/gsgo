/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
// left-side tabbed views
import Home from '../page-tabs/Home';
import ModelEdit from '../page-tabs/ModelEdit';
import ModelRun from '../page-tabs/ModelRun';
// import FakeTrack from '../page-tabs/FakeTrack';

// ursys components
import URSiteNav from '../page-blocks/URSiteNav';
import URTabbedView from '../page-blocks/URTabbedView';
import { URView, Row, CellFixed, TextView } from '../page-blocks/URLayout';

const FakeTrack = dynamic(() => import('../page-tabs/FakeTrack'), { ssr: false });

/// GLOBAL NOTES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GLOBAL = `
* smallest chromebook 1366x768
* smallest iPad 1024x768
* size of panes are adjustable in edit mode
* sizes should support planned activities
`;

/// TERMINOLOGY NOTES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERMS = `
* Visual Model
* Tracked vs Untracked Agents
`;

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: this is rendered both on the server once and on the client
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <URView scrollable>
      <URSiteNav title="GEMSTEP Laptop Controller" />
      <Row>
        {/* LEFT SIDE */}
        <CellFixed
          style={{
            maxWidth: '1024px',
            minWidth: '1024px'
          }}
        >
          <URTabbedView>
            <Home label="Home" />
            <ModelEdit label="Edit" />
            <ModelRun label="Run Model" />
            <FakeTrack label="FakeTrack" />
          </URTabbedView>
        </CellFixed>
        {/* RIGHT SIDE */}
        <CellFixed
          style={{
            maxWidth: '240px',
            minWidth: '240px',
            backgroundColor: '#f7f0c0'
          }}
        >
          <URTabbedView>
            <TextView p={1} label="global">
              {GLOBAL}
            </TextView>
            <TextView p={1} label="terms">
              {TERMS}
            </TextView>
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default dynamic(() => Promise.resolve(Page), { ssr: false });
