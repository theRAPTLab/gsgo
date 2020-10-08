/*

    FilesListItem
    
    Manage a list of file items.  Users can:
    * Add a new list item
    * Select a file for the list item.
    * Change the label for the list item.
    * Reselect a different file for the list item.
    * Delete a liste item.
    * Cancel edits.
    
    This is intended to be a re-usable standalone class with `FilesListItem.jsx`.
        
    It does not rely on anything other than React and UUID.
    
    items is an object and not a map because users need 
    to be able to change the labels.
    
    New item ids are set automatically via UUID.
    
    Style by referencing '.files-list'
    
*/

import React from "react";
import { v4 as UUID } from "uuid";
import PropTypes from "prop-types";
import FilesListItem from "./FilesListItem";

// For testing without data
const TEST = [
  { id: 0, label: "bee walking", path: "images/bee.png" },
  { id: 1, label: "bee flying", path: "images/beefly.png" },
];

class FilesList extends React.Component {
  constructor() {
    super();
    this.state = {
      items: undefined, // Replace with "TEST" to test FilesList
    };
    this.OnFileItemChange = this.OnFileItemChange.bind(this);
    this.DoAddItem = this.DoAddItem.bind(this);
    this.DoUpdateItem = this.DoUpdateItem.bind(this);
    this.DoRemoveItem = this.DoRemoveItem.bind(this);
    this.DoSendUpdate = this.DoSendUpdate.bind(this);
  }

  OnFileItemChange(updatedItem) {
    console.log("updated item", updatedItem);
    if (updatedItem.path === "DELETEME") {
      // Delete requested
      this.DoRemoveItem(updatedItem.id);
    } else {
      // Send Update
      this.DoUpdateItem(updatedItem);
      this.DoSendUpdate();
    }
  }

  DoAddItem() {
    this.setState((state) => {
      const updatedItems = state.items;
      updatedItems.push({
        id: UUID(),
        label: "untitled",
        path: undefined,
      });
      return { items: updatedItems };
    });
  }

  DoUpdateItem(updatedItem) {
    this.setState((state) => {
      return {
        items: state.items.map((i) =>
          i.id === updatedItem.id ? updatedItem : i
        ),
      };
    });
  }

  DoRemoveItem(id) {
    this.setState((state) => {
      return {
        items: state.items.filter((i) => i.id !== id),
      };
    });
  }

  DoSendUpdate() {
    this.props.OnChange(this.state.items);
  }

  componentDidMount() {
    this.setState({ items: this.props.items });
  }

  render() {
    const { items, OnChange } = this.state;
    if (items === undefined) return "";
    return (
      <div
        className="files-list"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "5px",
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        >
          {items.map((item) => (
            <FilesListItem
              item={item}
              OnChange={this.OnFileItemChange}
              key={item.id}
            />
          ))}
        </div>
        <button onClick={this.DoAddItem}>+ Item</button>
      </div>
    );
  }
}

FilesList.propTypes = {
  items: PropTypes.array,
  OnChange: PropTypes.func,
};

export default FilesList;
