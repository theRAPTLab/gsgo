/*

    FilesListItem
    
    This is intended to be a re-usable standalone class with `FilesList.jsx`.
    
    State updates are handled locally.  The resulting list item is
    passed back to `FilesList` via the this.props.OnChange handler.
    
    It does not rely on anything other than React.
    
    item is an object: {id, label, path}
    
    Style by referencing '.files-list-item'
    
*/

import React from "react";
import PropTypes from "prop-types";

class FilesListItem extends React.Component {
  constructor() {
    super();
    this.state = {
      isBeingEdited: false,
      changeFile: true,
      updatedLabel: undefined,
      updatedPath: undefined,
    };
    this.SetEdit = this.SetEdit.bind(this);
    this.SetEditStop = this.SetEditStop.bind(this);
    this.SetChangeFile = this.SetChangeFile.bind(this);
    this.OnKeyChange = this.OnKeyChange.bind(this);
    this.OnFileSelect = this.OnFileSelect.bind(this);
    this.DoDelete = this.DoDelete.bind(this);
    this.DoSendUpdate = this.DoSendUpdate.bind(this);
  }

  SetEdit() {
    this.setState({ isBeingEdited: true });
  }

  SetEditStop() {
    this.setState({ isBeingEdited: false });
  }

  SetChangeFile() {
    this.setState({ changeFile: true });
  }

  OnKeyChange(e) {
    this.setState({
      updatedLabel: e.target.value,
    });
  }

  OnFileSelect(e) {
    const filename = e.target.value;
    if (filename) {
      this.setState({
        updatedPath: filename,
        changeFile: false,
      });
    }
  }

  DoDelete() {
    this.setState(
      {
        updatedPath: "DELETEME",
      },
      this.DoSendUpdate
    );
  }

  DoSendUpdate() {
    const { updatedLabel, updatedPath } = this.state;
    const updatedItem = {
      id: this.props.item.id,
      label: updatedLabel,
      path: updatedPath,
    };
    this.props.OnChange(updatedItem);
    this.SetEditStop();
  }

  componentDidMount() {
    const { label, path } = this.props.item;
    this.setState({
      updatedLabel: label,
      updatedPath: path,
      isBeingEdited: path === undefined,
      changeFile: path === undefined,
    });
  }

  render() {
    const { isBeingEdited, changeFile, updatedLabel, updatedPath } = this.state;
    return (
      <div
        className={`files-list-item ${isBeingEdited ? "selected" : ""}`}
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {isBeingEdited ? (
          <>
            <button onClick={this.DoSendUpdate}>Save</button>
            <button onClick={this.SetEditStop}>Cancel</button>
            <input
              id="key"
              type="text"
              value={updatedLabel}
              onChange={this.OnKeyChange}
            />
            <div>{updatedPath}</div>
            {changeFile ? (
              <input id="filename" type="file" onChange={this.OnFileSelect} />
            ) : (
              <button onClick={this.SetChangeFile}>Reselect file</button>
            )}
          </>
        ) : (
          <>
            <button className="files-list-item-edit-btn" onClick={this.SetEdit}>Edit</button>
            <div>{updatedLabel}</div>
            <div className="files-list-item-filename">{updatedPath}</div>
            <a href="#" onClick={this.DoDelete}>
              delete
            </a>
          </>
        )}
      </div>
    );
  }
}

FilesListItem.propTypes = {
  item: PropTypes.object,
  OnChange: PropTypes.func,
};

export default FilesListItem;
