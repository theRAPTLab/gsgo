*generated and compiled on april 21, 2022*
see gsgo-repo-docs/01-architecture/gemstep-arc-datacore

### dc-sim.ts
this is an unused module
```
typedict MODES
typedict FREE_MODES
typedict RCRD_MODES
typedict PLAY_MODES
```

### dc-named-methods.ts
these are dictionaries of compiled scripts
is only used for DevCompiler
unused GEMSCRIPT CONCEPTS
```
datadict FUNCTIONS
datadict PROGRAMS

// used for conditional tests
function RegisterTest
function GetTest
function DeleteAllTests

// not sure if these are used
function RegisterFunction
function GetFunction

//
function RegisterProgram
function GetProgram
```

### dc-inputs.ts
```
setting SAMPLE_FPS
setting INTERVAL

counter FRAME_TIMER
variable STAGE_WIDTH
variable STAGE_HEIGHT

datadict INPUT_GROUPS
datadict INPUTDEFS
datadict ACTIVE_DEVICES

function transformX
function transformY

function UADDRtoID
function COBJIDtoID
function COBJIDtoID_n
function UDIDtoID
function UpdateActiveDevices

setting PTRACK_TRANSFORM
setting POZYX_TRANSFORM

function m_Transform
function m_GetAccelerationMultiplier
function m_PozyxDampen

dataxform ENTITY_TO_COBJ
dataxform COBJ_TO_INPUTDEF

function GetDefaultPozyxBpid
function GetDefaultPTrackBpid

function GetTrackerMap
function SetInputStageBounds
function InputInit
function InputUpdateCharControl
function InputUpdateEntityTracks
function InputsUpdate
function GetInputGroups
function GetInputDefs
function InputsReset
```

### dc-agents.ts
manages
1. API for creating/managing agent instances in the simulation ENGINE
2. the instance records used by the GEMSTEP CYCLE to create agent instances for a SIMULATIONRUN
```
datadict AGENTS  // blueprintName (in the pragma)-->map of Agent instances
datadict AGENT_DICT // id-->agent instance
datadict INSTANCES // bpId (in the gemproj def) -> array of TInstance

setting INSTANCE_COUNTER_START_VAL // starting value for assigning instanceIds
variable INSTANCE_COUNTER // instanceId assignment counter

function m_CopyProps
function m_CopyFeatProps

// manage instance records
// used for SETTING UP a simulation RUN
// describes how to make and name an Agent instance
// in the SIM
function DefineInstance
function UpdateInstance
function DeleteInstance
function GetAllInstances
function GetInstance
function GetInstancesType
function DeleteAllInstances
function DeleteInstancesByBlueprint

// agent cloning utility?
function CopyAgentProps

// manage blueprint instances

// instances of class Agent
function SaveAgent
function DeleteAgent
function DeleteAgentByBlueprint
function GetCharactersByType
function GetAgentById
function GetAllCharacters
function GetAgentByName
function DeleteAllCharacters
```

### dc-script-engine.ts
```
datadict BLUEPRINTS // blueprintName --> ISMCBundle (class-sm-bundle)
datadict KEYWORDS // keywordName --> Keyword Processor Instance (class-keyword)
datadict SCRIPTS // scriptName --> Tokenized Program (NOT USED ANYWHERE)
datadict SCRIPT_EVENTS // eventName --> Map<blueprintName,codeToRun>

// this is used for value type parsing (e.g. ValidateArgs)
typedict VALID_ARGTYPES

function UtilDerefArg // there might be an existing better replacement elsewhere
function UtilFirstValue // check if a value is an array, then return first element of array

function ValidateArgs
function UnpackArg

// all the keywords the script engine knows about
function RegisterKeyword
function GetKeyword
function GetAllKeywords

// used by onEvent...events are named and assigned
// by a blueprint which means all instances of that
// blueprint need to receive the event
function SubscribeToScriptEvent
function GetScriptEventHandlers
function DeleteAllScriptEvents

// these are not used I think...
function SaveScript
function UpdateScriptIndex
function DeleteScript

// manage script engine blueprint cache
function SaveBlueprint
function GetBlueprint
function GetAllBlueprints
function DeleteBlueprint
function DeleteAllBlueprints
```

### dc-project.ts
```
function m_LoadProjectNames // obsolete

// a project is defined in .gemproj
function m_LoadProject
function m_LoadProjectFromAsset
function m_LoadProjectFromDB

// replaced by ac-project/blueprint/rounds/metadata
function promise_DBWriteProject
function promise_WriteProjectSettings
function promise_WriteMetadata
function promise_WriteRounds
function promise_WriteBlueprints
function promise_WriteInstances

//
function FileWriteProject
function UpdateProjectFile
function CreateFileFromTemplate

// this is the main API, but it uses messages for some reason
// probably because the DB version used to, but it is NOT NECESSARY
// because everything is imported already by project-server directly
// this is GEMSTEP CYCLE
endpoint HandleLoadProject
endpoint HandleWriteProject
endpoint HandleWriteProjectSettings
endpoint HandleWriteMetadata
endpoint HandleWriteRounds
endpoint HandleWriteBlueprints
endpoint HandleWriteInstances

// OBSOLETE
phasehook UR.HookPhase('UR/LOAD_DB') callback
```

### dc-render.ts
```
// the PixiJS root container reference
// there may have been additional overlays in here
// which is why it doesn't just point to PIXI.Container
datadict CONTAINERS

// sync one data obj type to another
// data to types of sprites
dataxform RP_DOBJ_TO_VOBJ
dataxform RP_PTRAK_TO_VOBJ
dataxform RP_ANNOT_TO_VOBJ

// used by api-render, api-input
// to add/remove items to the
function SetModelRP
function GetModelRP
function SetTrackerRP
function GetTrackerRP
function SetAnnotRP
function GetAnnotRP

// unused convenience methods
function RP_AddModelVisual
function RP_AddTrackerVisual
```

### dc-script-bundle.ts
The way this module works is by being aware that an active compile
is in process. Only one is happening at a time for a particular blueprint
being compiled. It's used through script-compiler CompileBlueprint()

GEMSTEP CYCLE - this is the state of the compile process of an individual
blueprint
```
// names of the fields inside of a bundle object
// has a typescript type equivalent used for runtime
// validation
typedict BUNDLE_CONTEXTS

// the current info during an active compile...
variable BUNDLE_NAME
variable BUNDLE_OUT
variable BUNDLE
function CompilerState

function IsValidBundleProgram
function IsValidBundleType
function IsValidBundle

function StartBundler // there is no StopBundler, just call this again

function SetBundleName
function SetBundleOut

function AddSymbol
function BundleTag
function BundleOut
```

### dc-globals.ts
is this still being used for anything?
comments say it's deprecreated..
```
variable FRAME_TIME
variable _frame
phasehook UR.HookPhase('SIM/RESET') callback
phasehook UR.HookPhase('SIM/INPUTS_READ') callback
```

### dc-features.ts
```
datadict FEATURES // featureName -> IFeature code module

function Register
function DeleteAllFeatures

function GetFeature
function GetAllFeatures

function GetAgentBoundingRect // this is a code hack for supporting some visual stuff
function GetFeatureMethod // UNUSED
```

### dc-varprops.ts
Return constructor functions for all of the gvar property types in the sim engine,
so we can instantiate the right thing by name
GetVarCtor('string') returns class GString (a constructor function)
```
// all the types of var constructors
// string, number, boolean
datadict VAR_DICT

function RegisterVarCTor
function GetVarCtor
function SymbolDefFor // symbols for a CTor

function GetAllVarCtors

```

### dc-interactions.ts
implements the tests for "when" clauses
part of the sim engine condition test phase
```
// blueprint-that-invokes-test-hash --> results of running that test
variable INTERACTION_CACHE

function m_MakeInteractionKey

function RegisterSingleInteraction
function RegisterPairInteraction

function GetAllInteractions
function DeleteAllInteractions

function GetInteractionResults
function ShuffleArray

function SingleAgentFilter
function PairAgentFilter
```
