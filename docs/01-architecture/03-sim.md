# SIM THINKING

Simulation modules implement the SIMLOOP, which is similar to the system loops we've been using since the mid 1990s.

```
STATE UPDATE PHASE
  GetInputAll        // update the inputs data for this tick
  PhysicsUpdate      // update autonomous physics
  TimerUpdates       // update ongoing timers
  ConditionsUpdate   // update any simulation conditions

THINKING PHASE
  AgentsUpdate       // agent autonomous functions update
  ManagersUpdate     // managers of agents evaluate agents
  ManagersThink      // manager AI, queue decision
  AgentThink         // agent AI, queue decision
  ManagersOverride   // manager micromanage AI as necessary

EXECUTION PHASE
  AgentsExecute      // agents execute decision
  ManagersExecute    // managers execute decision

EVALUATION PHASE
  SimStateEvaluate   // update values for non-agent UI
  RefereeEvaluate    // check for change in simulation
```
As with the App Lifecycle, each of these phase operations complete before the next one is run.

## API

The SIM API is provided through the  `_sim_main.js`  module, and it hooks into the URSYS Lifecycle through its `Initialize()` method so it can register the hooks it needs. 



