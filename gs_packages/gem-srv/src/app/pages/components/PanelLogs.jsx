import React, { Component } from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import PanelChrome from './PanelChrome';

class PanelLogs extends Component {
  constructor() {
    super();
    this.state = {
      title: 'Summary of Events',
      filterText: '', // Text for filtering log entries
      fontSize: 14 // Initial font size
    };
  }

  handleFilterChange = event => {
    this.setState({ filterText: event.target.value });
  };

  increaseFontSize = () => {
    this.setState(prevState => ({
      fontSize: prevState.fontSize + 1
    }));
  };

  decreaseFontSize = () => {
    this.setState(prevState => ({
      fontSize: prevState.fontSize - 1
    }));
  };

  render() {
    const { title, filterText, fontSize } = this.state;
    const { id, isActive, logEntries } = this.props;

    if (!logEntries) return <></>;

    const filteredLogEntries = logEntries.filter(anEntry =>
      anEntry.entry.includes(filterText)
    );

    const maxContainerWidth = 400; // Set a minimum container width
    const leftPadding = 50;

    return (
      <PanelChrome id={id} title={title} isActive={isActive}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <button
              style={{
                background: 'black',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
              onClick={this.decreaseFontSize}
            >
              -
            </button>
            <span style={{ margin: '0 10px' }}>Font Size: {fontSize}px</span>
            <button
              style={{
                background: 'black',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
              onClick={this.increaseFontSize}
            >
              +
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Filter log entries"
              value={filterText}
              onChange={this.handleFilterChange}
            />
          </div>
          <ol
            className="events"
            style={{
              fontSize: `${fontSize}px`,
              maxWidth: `${maxContainerWidth}px`,
              paddingLeft: `${leftPadding}px`,
              textAlign: 'left'
            }}
          >
            {filteredLogEntries.map((anEntry, index) => (
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
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelLogs);
