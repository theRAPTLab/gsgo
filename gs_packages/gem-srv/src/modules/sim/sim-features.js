/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Features can (1) modify the agent (2) use agent properties to update
  its own properties stored in the agent (3) queue an event for a later
  stage in the agent's event queue.

  Features are instantiated once.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// ACTIVATE FEATURES (SELF-INSTALLING ON IMPORT)
import './features/feat-movement';
import './features/feat-timer';
import './features/feat-costume';
import './features/feat-physics';
