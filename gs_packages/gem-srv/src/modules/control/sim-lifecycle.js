/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  work in progress - simulation states and transitions

  this documents the review during the april 2022 summit at Sri's house

  --- main app loads into browser

  BOOT_SIM - this is the starting node
  --- enter: clear blueprint dictionaries
      enter: load project
      enter: compile blueprints
  --- enter: load project instance data
      enter: create instances
      enter: run per-instance creation scripts
  --- goto: SETUP_SIM

  SETUP_SIM
  --- enter: enable inputs
  --- enter: enable an "idle" run mode
  --- choice: setup simulation parameters
      --- edit project settings
      --- edit rounds
      --- add instances
      --- place instances
      --- exit: save project settings
  --- choice: setup tracker
      --- setup transforms for ptrack, pozyx
      --- select locale (?)
      --- exit: save project settings?
  --- trigger: click PREP ROUND, goto INIT_ROUND

  INIT_ROUND
  --- enter: load round counter
  --- enter: load "start round" script
  --- goto PRE_ROUND

  PRE_ROUND
  --- enter: show dialog box
  --- trigger: click OK, goto STAGE_ROUND

  STAGE_ROUND
  --- choice: pick character
      --- enter: display cursors
          the idea is that students can pick who they are going to be
      --- trigger: click reset
      --- trigger: goto START_ROUND
      --- exit: hide cursors

  START_ROUND
  --- enter: start simulation clocks and timers
  --- exit: run all init scripts (?)
      exit: app is now running, goto SIM_RUN

  RUN_ROUND
  --- enter: enable inputs
  --- trigger: timer expire, goto POST_ROUND
  --- trigger: click STOP, goto POST_ROUND
  --- exit: kill inputs

  POST_ROUND
  --- enter: show dialog box
  --- trigger: click OK, goto REVIEW_ROUND
  --- exit: run round cleanup script

  REVIEW_ROUND
  --- remain in idle state
  --- trigger: click NEXT ROUND
      increment round counter
      if more rounds, goto INIT_ROUND
      else goto BOOT_SIM

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

function createMachine() {}

const states = {};

states.load_projects = {
  memo: 'startup screen for shows list of project (app/login)',
  enter: {
    sysLoadProjects: 'loads all the available projects'
  },
  choices: {
    userCreateProjectFromTemplate: 'select a template to create a new project',
    userSelectProject:
      'select a specific project from all projects (exit condition)'
  }
};

states.userCreateProjectFromTemplate = {
  memo: 'sequence to create the template (app/login)',
  states: {
    userSelectTemplate: 'click one of the templates on the left',
    userEnterNewProjectName: 'dialog pops up, type in the name',
    sysCreateTemplateCopy: '',
    sysRedirectToProject: 'window.location = project?project=project_name'
  }
};

states.userSelectProject = {
  memo: 'see the choices for main, viewer, character controller (app/project)',
  choices: {
    userSelectMain: 'click the main button (location load app/main)',
    userSelectViewer: 'click the viewer button (location load app/viewer)',
    userSelectController:
      'click the controller button (location load app/charcontrol'
  }
};

// now we're actually running app/main
// we're looking at the 'run modes'
const simEngineOps = {
  loadRenderableResources: '',
  loadSimulationEntitites: '',
  initializeRuntimeCounters: '',
  setRunMode: 'turn features on/off by named runmode state',
  startSim: 'start the engine',
  // during sim run
  changeRunMode: 'change runmode settings on the fly',
  // after the run
  stopSim: 'stops the engine'
};

const subsystems = {
  simEngineMode: 'the simulator engine itself, with different runmodes',
  simEntitySetup: 'all the blueprints, all the instance defs',
  simRoundSetup: 'number of rounds, loop control',
  simEnvSetup: 'bounds, locale (trackers, transforms)',
  simInputBinder: 'connect a tracker entity to an agent instance',
  simRoundRunner: 'handles config of simEngine as rounds'
};

states.boot_sim = {
  memo: 'first time the simulator is showing on the main projector (app/main)',
  enter: {
    sysProjectSetup: 'get the project data that controls the simulation runs',
    sysInitializeSimEngine: 'turn on simEngine in starting loopmode'
  },
  choices: {}
};

states.setup_sim = {};
states.init_round = {};
states.pre_round = {};
states.stage_round = {};
states.start_round = {};
states.run_round = {};
states.post_round = {};
states.review_round = {};

const GEMSTEP = {
  id: 'gemstep-cycle',
  initial: 'boot',
  states
};

const system = {};
const user = {};
const trigger = {
  system,
  user
};

system.appStart = {
  info: ['on open app: load your project']
};

user.appStart = {};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/

what do you call "state" as data versus "state" as a place within the current
state machine?

There are multiple kinds of data and state:
- data: what the current project is
- data: derived project data such as compiled blueprints
- state: what the user interface is showing in terms of components
- state: simulation state (lifecycles) and state variables
- state: derived simulation state (combo of state vars)
- state: simulation instanced objects
- state: derived project round data structures
- state: derived round state (not modeled) and round state variables
- state: derived state (combos of state vars)

There are also triggers and conditions for managing the current mode
- enterNode script
- exitNode script
- trigger condition, subState change
- trigger condition, nextState change

The state machine script code should do only so much to manage the correctness
of its own state. Side effects are ATTACHED to the transitions themselves by
hooking into them

how should we implement hierarchical states? use xstate.js.org?
statecharts

FOR NEXT PEER PROGRAMMING -
we'll go through the XSTATE library docs together and try to piece some ideas together

/*/

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
