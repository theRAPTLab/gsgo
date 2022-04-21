*generated and compiled on april 21, 2022*
see gsgo-repo-docs/01-architecture/gemstep-arc-datacore

### dc-sim.ts

```
variable MODES
variable FREE_MODES
variable RCRD_MODES
variable PLAY_MODES
```
### dc-named-methods.ts
```
datadict FUNCTIONS
datadict PROGRAMS

function RegisterTest
function GetTest
function DeleteAllTests
function RegisterFunction
function GetFunction
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
```
datadict AGENTS
datadict AGENT_DICT
datadict INSTANCES

setting INSTANCE_COUNTER_START_VAL
variable INSTANCE_COUNTER

function m_CopyProps
function m_CopyFeatProps

function DefineInstance
function UpdateInstance
function DeleteInstance
function GetAllInstances

function GetInstance
function GetInstancesType
function DeleteAllInstances
function DeleteInstancesByBlueprint

function CopyAgentProps
function SaveAgent
function DeleteAgent
function DeleteAgentByBlueprint
function GetAgentsByType
function GetAgentById
function GetAllAgents
function GetAgentByName
function DeleteAllAgents
```

### dc-script-engine.ts
```
datadict BLUEPRINTS
datadict KEYWORDS
datadict SCRIPTS
datadict SCRIPT_EVENTS

typedict VALID_ARGTYPES

function ValidateArgs
function UnpackArg
function RegisterKeyword
function GetKeyword
function GetAllKeywords
function SubscribeToScriptEvent
function GetScriptEventHandlers
function DeleteAllScriptEvents
function SaveScript
function UpdateScriptIndex
function DeleteScript
function SaveBlueprint
function GetBlueprint
function GetAllBlueprints
function DeleteBlueprint
function DeleteAllBlueprints
function UtilDerefArg
function UtilFirstValue
```

### dc-project.ts
```
function m_LoadProjectNames
function m_LoadProject
function m_LoadProjectFromAsset
function m_LoadProjectFromDB

function promise_DBWriteProject
function promise_WriteProjectSettings
function promise_WriteMetadata
function promise_WriteRounds
function promise_WriteBlueprints
function promise_WriteInstances

function FileWriteProject
function UpdateProjectFile
function CreateFileFromTemplate

endpoint HandleLoadProject
endpoint HandleWriteProject
endpoint HandleWriteProjectSettings
endpoint HandleWriteMetadata
endpoint HandleWriteRounds
endpoint HandleWriteBlueprints
endpoint HandleWriteInstances

phasehook UR.HookPhase('UR/LOAD_DB') callback
```

### dc-render.ts
```
datadict CONTAINERS

dataxform RP_DOBJ_TO_VOBJ
dataxform RP_PTRAK_TO_VOBJ
dataxform RP_ANNOT_TO_VOBJ

function SetModelRP
function GetModelRP
function SetTrackerRP
function GetTrackerRP
function SetAnnotRP
function GetAnnotRP
function RP_AddModelVisual
function RP_AddTrackerVisual
```

### dc-script-bundle.ts
```
typedict BUNDLE_CONTEXTS

variable BUNDLE_NAME
variable BUNDLE_OUT
variable BUNDLE

function IsValidBundleProgram
function IsValidBundleType
function StartBundler
function SetBundleName
function SetBundleOut
function CompilerState
function AddSymbol
function BundleTag
function BundleOut
function IsValidBundle
```

### dc-globals.ts
```
variable FRAME_TIME
variable _frame
phasehook UR.HookPhase('SIM/RESET') callback
phasehook UR.HookPhase('SIM/INPUTS_READ') callback
```
### dc-features.ts
```
datadict FEATURES

function GetFeature
function GetAllFeatures
function GetFeatureMethod
function Register
function DeleteAllFeatures
function GetAgentBoundingRect
```

### dc-varprops.ts

```
datadict VAR_DICT

function RegisterVarCTor
function GetVarCtor
function SymbolDefFor
function GetAllVarCtors
```

### dc-interactions.ts
```
variable INTERACTION_CACHE

function m_MakeInteractionKey

function RegisterSingleInteraction
function RegisterPairInteraction
function GetInteractionResults
function GetAllInteractions
function DeleteAllInteractions
function ShuffleArray
function SingleAgentFilter
function PairAgentFilter
```
