/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Borrowing from game loop concepts:

  Use SystemHooks to initialize at the right times.
  This does things like initialize pieces, etc.
  simulation modules implement the SIMLOOP LIFECYCLE, which is a different
  but similar interface:

  # STATE UPDATE PHASE
    GetInputAll        // update the inputs data for this tick
    PhysicsUpdate      // update autonomous physics
    TimerUpdates       // update ongoing timers
    ConditionsUpdate   // update any simulation conditions

  # THINKING PHASE
    AgentsUpdate       // agent autonomous functions update
    ManagersUpdate     // managers of agents evaluate agents
    ManagersThink      // manager AI, queue decision
    AgentThink         // agent AI, queue decision
    ManagersOverride   // manager micromanage AI as necessary

  # EXECUTION PHASE
    AgentsExecute      // agents execute decision
    ManagersExecute    // managers execute decision

  # EVALUATION PHASE
    SimStateEvaluate   // update values for non-agent UI
    RefereeEvaluate    // check for change in simulation

  Additionally there are stages for PAUSING, RENDERING, and UI UPDATES
  that have to go somewhere.

  The general idea is that our simulation engine runs synchronously in
  distinct phases that set flags to be read by subsequent phases. This
  requires discipline by developers working on AI to not try to set actions
  directly in themselves or other elements in such a way they clobber each
  other. These data modules provide the source of data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';
// runtime data modules
import INPUTS from './inputs';
import CONDITIONS from './conditions';
import AGENTS from './agents';
import MANAGERS from './managers';
import REFEREE from './referee';

/// DEBUG /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.Prompts.makeLogHelper('SIM');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Hook into URSYS system for lifecycle events
 */
function Initialize() {
  UR.SystemHook('APP_STAGE', () => {});
  UR.SystemHook('APP_START', () => {});
  UR.SystemHook('APP_RUN', () => {});
  UR.SystemHook('APP_UPDATE', StepSimulation);
  UR.SystemHook('APP_NEXT', () => {});
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LoadSimulation() {
  // load agents and assets
  // prep recording buffer
}
function StartSimulation() {
  // initialize agents and assets
  // start the clock
  // start recording buffer
}
function PauseSimulation() {
  // set the playback rate from 0 to 10
  // can we support backing up in the buffer?
  // can we offer forward simulation from the playback buffer
}
function EndSimulation() {
  // stop simulation
}
function ExportSimulation() {
  // grab data from the simulation
}
function ResetSimulation() {
  // return simulation to starting state
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StepSimulation(int_ms) {
  /* insert game pause control here */
  console.log(...PR(`DoGameStep ${int_ms}`));
  /* insert game logic here */
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Initialize,
  LoadSimulation,
  StartSimulation,
  PauseSimulation,
  EndSimulation,
  ExportSimulation,
  ResetSimulation
};
