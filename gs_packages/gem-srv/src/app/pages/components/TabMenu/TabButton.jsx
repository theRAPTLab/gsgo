import React from 'react';
import './TabButton.css';

export default function TabButton({ children, onSelect, isSelected }) {
  let styles = 'tabButton';
  styles += isSelected ? ' active' : '';

  return (
    <li>
      <button className={styles} onClick={onSelect}>
        {children}
      </button>
    </li>
  );
}
