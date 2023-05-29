import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelLogs extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Summary of Events'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, logEntries } = this.props;

    if (!logEntries) return <></>;

    return (
      // Placeholder for now
      <PanelChrome id={id} title={title} isActive={isActive}>
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'wrap'
              }}
            >
              <ol className="events">
                {logEntries.map((anEntry, index) => (
                  <li
                    key={`entry-${index}`}
                    className={
                      anEntry.entry.includes('Starting')
                        ? 'start'
                        : anEntry.entry.includes('Ending')
                        ? 'end'
                        : 'internal'
                    }
                  >
                    {anEntry.entry}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelLogs);
