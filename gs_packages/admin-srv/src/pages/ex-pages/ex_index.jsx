/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EXAMPLE MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// ursys components
import URSiteNav from '../../page-blocks/URSiteNav';
import URTabbedView from '../../page-blocks/URTabbedView';
import { URView, Row, CellFixed, Cell } from '../../page-blocks/URLayout';

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
            <div label="Welcome" />
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
            <div label="Notes" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
