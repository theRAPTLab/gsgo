/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

TabMenu

Generic tab menu

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';

export default function TabMenu({ children }) {
  return (
    <div>
      <menu>{children}</menu>
    </div>
  );
}
