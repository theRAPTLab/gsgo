/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

TabMenu

Generic tab menu

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import './TabMenu.css';

export default function TabMenu({ children, style }) {
  return (
    <div style={style}>
      <menu>{children}</menu>
    </div>
  );
}
