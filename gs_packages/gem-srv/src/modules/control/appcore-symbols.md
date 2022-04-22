*generated and compiled on april 21, 2022*
see gsgo-repo-docs/01-architecture/gemstep-arc-appcore

### ac-instances.js
note: this is both a state module and a datacore module mixed together,
GEMSTEP CYCLE - manages the instances createf from gemproj
GUI:
```
timerid AUTOTIMER
STATE GROUP MGR
  .projId
  .instances
  .instanceidList
  .currentInstance

  function hook_Filter
  function hook_Effect

function updateAndPublish -- should be m_UpdateAndPublish
function delayedInstancesSave -- should be m_DelayedInstancesSave

// manages instances created from the gemprj file
function GetInstances
function GetInstance
function GetInstanceidList -- id should be Id
function GetInstanceUID
function EditInstance

function UpdateCurrentInstance

function SetInstances
function WriteInstances
function AddInstance
function WriteInstance
function DeleteInstance
function DeleteInstancesByBPID
function RenameInstanceBlueprint
```

### ac-devices.js
```
STATE GROUP MGR
  .devices
  .controlGroup
  .controlGroupSelect

const Devices -- should convert from const to function
const controlGroupSelect -- should rewrite as function, PascalCase
```

### ac-blueprints.js
```
STATE GROUP MGR
  .projId
  .blueprints
  .bpidList
  .bpBundles
  .defaultPozyxBpid
  .charControlBpidList
  .ptrackControlBpidList
  .pozyxControlBpidList
  function hook_Filter
  function hook_Effect

timerid AUTOTIMER
function updateAndPublishDerivedProperties -- should rename to m_Something
function updateAndPublish -- should rename to m_Something

function GetBlueprints
function GetBlueprint
function GetBlueprintIDsList
function CompileBlueprintBundles
function GenerateCharControlBpidList
function GetCharControlBpidList
function GeneratePTrackControlBpidList
function GetPTrackControlBpidList
function GetPTrackControlDefaultBpid
function GeneratePozyxControlBpidList
function GetPozyxControlBpidList
function GetPozyxControlDefaultBpid
function GetBlueprintProperties
function GetBlueprintPropertiesMap

function SetBlueprints
function InjectBlueprint
function UpdateBlueprint
function DeleteBlueprint
```

### ac-locales.js
```
STATE GROUP MGR
  .locales
  .localeNames
  .localeId
  .selectedTrack
  .ptrack
  .pozyx
  function hook_Filter
  function hook_Effect

function promise_WriteTransform -- rename to m_Something
function m_LoadLocaleInfo

timerid AUTOTIMER

const LocaleNames -- convert to function
const Locales -- convert to function
const CurrentLocaleId -- convert to function
const GetLocale -- convert to function
const SetLocaleID -- convert to function

function LoadCurrentPTrack

phasehook UR.HookPhase('UR/LOAD_DB') callback
```

### ac-projects.ts
```
STATE GROUP MGR
  .projectNames

function HandleProjectsUpdate
```

### ac-rounds.js
```
STATE GROUP MGR
  .projId
  .rounds
  function hook_Filter
  function hook_Effect

timerid AUTOTIMER

function GetRounds
function GetRoundCount
function GetRoundDef
function RoundsShouldLoop
function SetRounds
```

### ac-project.ts
```
STATE GROUP MGR
  .projId
  .project
  function hook_Filter
  function hook_Effect

timerid AUTOTIMER

function GetProject
function TriggerProjectStateUpdate
function HandleProjectUpdate
```

### ac-wizcore.ts
```
assetdict PROJECTS

STORE = NEW STATE MGR
  .script_text
  .script_tokens
  .script_page
  .line_tokmap
  .sel_linenum
  .sel_linepos
  .error
  .proj_list
  .cur_prjid
  .cur_bpid
  .cur_bdl
  .sel_symbol
  .sel_validation
  .sel_context
  .sel_unittext
  .rt_bpfilter
  .rt_propfilter
  .rt_instancefilter
  .rt_testfilter
  .dev_or_user
  .dbg_console
  function _interceptState() callback

function m_ChildOf

phasehook UR.HookPhase('UR/LOAD_ASSETS') callback
phasehook UR.HookPhase('UR/APP_CONFIGURE') callback

function ScriptChanged
function DispatchClick
function DispatchEditorClick
function WizardTextChanged
function WizardTestLine
function PrintDBGConsole
function UpdateDBGConsole
function ScrollLineIntoView
function GetAllTokenObjects
function SelectedTokenId
function SelectedLineNum
function GetTokenById
function SelectedTokenInfo
function GetLineScriptText
function ValidateLine
function ValidateSelectedLine
function ValidatePageLine
function GetBundleSymbol
function GetBundleSymbolNames
function IsTokenInMaster
function LoadAssetDirectory
function GetProjectList
function GetProject
function GetProjectBlueprint
function LoadProjectBlueprint
function UIToggleRunEditMode

clidebug load_proj
clidebug list_proj
clidebug list_proj_bps
clidebug load_proj_bp
```

### ac-metadata.js
```
STATE GROUP MGR
  .projId
  .metadata
  function hook_Filter
  function hook_Effect

function updateAndPublish -- should rename to m_UpdateAndPublish

timerId AUTOTIMER

function GetMetadata
function GetBoundary
function Wraps
function SetMetadata

```
