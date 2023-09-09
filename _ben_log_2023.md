# Setting up -- 2022-0326

* `load_proj('local')` seems weird?  'project' vs 'sets of assets'
  `load_proj('AEP')` doesn't work? 

* Moths Parameters: https://gitlab.com/stepsys/gem-step/gsgo/-/wikis/Design/MothsParameters
  --  It's useful to them if they can just demo and talk through
  
* moth3:110: `ifExpr...else` is not implemented yet?

* Example hard problems:
  --  physics dependent on costume
  --  Figuring out how to coordinate physics and costume sizing for students
      --  You don't necessarily want them to worry about setting both physics and costumes.
      --  So it's like you have two levels of scaffolding: one the higher order abstract
          that takes care of things for you, and another, the low-level that allows you to 
          customize behaviors.
      
# features symbol selection -- 2022-0312

PRB ScriptEditPane
    
    
# ac/dc -- 2022-0425

PRB Pure Data dc-project

TDO 
* dc-project
  PRB Perhaps dc-project really isn't a dc-class?
      It's closer to a project manager class?
  TODO
  --  Remove PROJECT and ASSETS
  --  m_LoadProjectFromAsset should be moved to ac-project?
  --  m_FileWriteProject should be moved to ac-project?
  --  m_UpdateProjectFile should be moved to ac-project?
  --  CreateFileFromTemplate should be moved to ac-project?
  
LOG
    DO  project-server
        * Remove DC_LOAD_PROJECT call.
        ac-rounds
        * We need to do two update all the time?
          --  update dc-project with latest data
          --  trigger a project write with ac-project
              =>  But how?  What should the messaging be?
                  via UR call?
                  via import?
                  --  Can ac-rounds import ac-project?
                  --  Or have ac-project subscribe to ac-rounds?
                  --  Or does dc-project initiate anything?
                  --  Or set a ac-rounds.parent = ac-project?
          --  m_UpdaterProjectFile is being called twice?
              --  Once by bleuprints
              --  Once by instances
        --  expres-assets --- AsetUpdate_Middleware is not being called?
            --  saves are not happening?  No errors?
            --  works in tmp/gsgo
            --  how about dev-next-gui?  Yes works.
            --  So the recent changes broke something.
            =>  Was using an async call when it wasn't necessary.

# ac/dc -- 2022-0426

PRB blueprint for 'BlockID' not defined -- transpiler-v2:129
    --  MakeAgent should be using bpname, not bpid.
    --  simagents:160
PRB Does anyone actually use the gemproj blueprint id?
PRB ac-project / PanelProjectEditor updates should not result
    in a complete project update!  Since it only edits project metadata
    and project label data?

DESIGN
* ac-project
  --  Should it be the main project data module?
  --  How should it handle label/id updates vs actual project data updates?
  --  PanelProjectEditor changes are not currently being saved!
  
# ac/dc -- 2022-0427

PRB Add new character instance -- 
    project-server.InstanceAdd:427
    =>  ac-blueprints referencing removed 'blueprints' key

NEXT Reconcile use of 'blueprints' in ac-blueprints.
    --  Should it be bundles or blueprintText?
        How do we know which to use when?
    --  ScriptEditor is not able to load script
        Because the project 'model' has the wrong data?
        Really we just want DCENGINE.GetAllBlueprintBundles
        We don't need the whole model?
    QA  Select Character Script to edit
        --  PanelBlueprints.OnBlueprintClick:50
            ScriptEditor.RequestModel
              project-server.ReqProjData
              project-server.HandleRequestProjData
              project-server.ReqauestProject
              ACProject.GetProject()
            Needs
              --  scriptId
              --  GetBlueprint should probably return DICT?
                  so we can look up blueprints by name?
              --  ScriptEditor needs blueprint text for display too.
              --  ScriptEditor only needs blueprint name to look up 
                  specific blueprint.
              --  Should ScriptEditor talk to dc-script-engine directly?
                  Probably not?  We want project-server to be the interface?            
        Add new Character Instnace
        --  INSTANCE_ADD project-server:427
    
# ac/dc -- 2022-0428
DES Start with what project-server.RequestBpTextMap hsould return!
  --  It can't return a dict!  So it should return either an object
      or an array.
DES Think also of what the various blueprint data objects are:
  --  gemproj bp defs
      {
        name: 'BlockPragma',
        scriptText: '# BLUEPRINT BlockPragam',
        editor: undefined
      }
      --  Define this in tscript.d?
  --  bpBundles
QA ac-blueprint.UpdateBlueprint
QA ac-blueprint.DeleteBlueprint needs to be rewritten to take care of BPTEXTMAP
QA ac-blueprint saves are not being saved to the project file?!?!
    --  PanelScript.SCRIPT_UPDATE
    --  project-server.ScriptUpdate
        --  ACBlueprints.UpdateBlueprint
        --  ACBlueprints.updateAndPublish(blueprints)
    --  When should writes happen?  Part of the hook_Effect only?
        --  Explicitly request during Update and Delete?
        --  What does projectFileRequestWrite actually write?
            DCPROJECT keeps what kind of blueprint?
            Blueprints aren't updating DCPROJECT?
            or DPCPROJECT needs to update itself before writing?
        --  updateAndPublish should be udpting DCPROJECT.

# ac/dc -- 2022-0429
QA  Renamed bp does not remove old instances until reload
DO  ac-bluerpint:453
    --  convert loaded blueprints {id,label,scriptText} into simplified {name,scriptText}?  Or do we leave it alone?
    --  We're partially doing it now.
QA  Delete Instance is not removed from sim
    InstanceEditor.OnDeleteInstance
    LOCAL:INSTANCE_DELETE
    project-server.InstanceDelete
    --  DCAgents.DeleteInstance
    --  DCAgents.DeleteAgent
    What do we call when we add an instance?
    --  INSTANCE_ADD
    --  project-server.InstanceAdd
        --  AddInstance
        --  RaiseModelUpdate
        --  RaiseInstancesListUpdate
QA  Delete/rename blueprint should immediately remove instances
    RES What is the key call that will remove agents?
        * sim-agents.AllAgentsProgram?
          --  Converts script to instances.  
              SCRIPT_TO_INSTANCE will remove instances.
          --  Who calls it?
              ALL_AGENTS_PROGRAM
              mod-sim-control.SimPlaces
              --  instancesSpec is drawn from ACInstances.GetInstances
                  =>  The instance spec is correctly pared down.
                  =>  SCRIPT_TO_INSTANCE correctly calls onRemove
        * But the agent itself is not removed?
    RES How are we handling agent deletion from InstanceEditor?
        --  Because that works.
        --  project-server.InstanceDelete calls
              ACInstances.DeleteInstance(data.id);
              DCAgents.DeleteInstance(data);
              DCAgents.DeleteAgent(data);

QA  APP_START cannot read property of undefined (id)
    --  project-server.Initialize()
        ACProject.LoadProjectFromAsset
        --  dc-project.ProjectFileLoadFromAsset
            --  as-load-project.getProjectByProjId:208
                => For some reason the asset is missing `.rsrc`!!!
    --  http://localhost/assets/local/projects/
        --  lists 'blocks.gemprj'
        --  But downloading it is empty!
        TRY Restart npm run gem
    =>  Culprit is in bad blocks instances!
        --  Deleting instances loads it?
        --  Delete id: 4 => FAIL
        --  Delete id: 3 => FAIL
        --  Delete id: 3,4 => OK
        --  Change id2 SmallBlock to BlcokPragmaNew => OK
        --  Change id 3,4 to SmallBlock => FAIL
        --  Add initScript to 3,4 => OK
    =>  Culprit is empty initScripts!!!
        =>  regexp seems to not properly match tempty strings
BUG project-server renamed blueprint needs to remove instances with old name
     or proiperly run ACInstances.RenameInstanceBlueprint()
FIX project-server's use of ScriptUpdate
    --  Need to remove CompileBlueprint?
    --  Need to properly handle BlueprintDelete?  e.g. remove isntacnes
    --  Should maybe use SymbolHelper just to extract the name?
* Clarify PanelBLueprints' use of 'blueprints.  Is it:
  --  an array of bpbundles?
  --  an array of bpDefs (id, label, script)
  --  an array of bpIdLabels {id, label}
* Review ac-blueprints.UpdateBlueprint and DeleteBlueprint
  --  they call UR.WriteState('blueprints') -- wtf is that?
BUG Tracking blueprint.editor -- ScriptEditor will be disabled if someone is editing
    --  Who is keeping track of that?
        * PanelSelectBlueprint displays
          --  bpEditList has .editor
        * Who requests it?
          --  SELECT_SCRIPT
              --  ScriptEditor.OnSelectScript
              bpidList is coming from ac-bluepritns.GetBpEditList

# RESET STAGE -- 2022-0501
PRB ResetStage does not reset the dcagnets and dcinstances?

DES UPDATE_MODEL
    project-server
    --  RaiseModelUpdate
        * [ ] Change `UPDATE_MODEL` to `UPDATE_PROJDATA`?  `UPDATE_PROJECT`?
    Main
    --  HandleSimDataUpdate
        --  Source call is UPDATE_MODEL raised by
            project-server.RaiseModelUpdate after an instance
            is added, or script is updated.
        =>  Rename to `UpdateProjectData`
        =>  Move logic to either project-server or mod-sim-control
        =>  State setting should only be setting display parameters
            e.g. projId
    
CUR HACK_SIM_RESET
    Raised by:
    ->  PanelPlayback
    --  Main.OnToggleRunEdit
    Handled by:
    ->  Main.DoSimReset
        --    
    
    DES
    PanelPlayback.HACK_SIM_RESET => SIM_RESET
    mod-sim-control
    --  Raise SIM_WAS_RESET
    project-server
    --  Handle SIM_RESET => DoSimReset
        --  SIM STOP?
        --  DoSeimReset
        --  project-server.ReloadProject
    Main
    --  Handle SIM_RESET => Post message, set state
        
CUR HACK_SIM_STOP
    Raised by:
    ->  PanelPlayback
    --  Main.DoSimReset
    --  feat-timer
    Handled by:
    ->  mod-sim-control.DoSimStop
    --  Main.DoSimStop
    

DES Instance Reset
    --  DCAGENTS will delete instances
    Who creates all the agents?
    --  SimPlaces!
        --  ACInstances.GetInstances()
            =>  ALL_AGENTS_PROGRAM
            --  sim-agents.AllAgentsProgram
                --  SCRIPT_TO_INSTANCE.syncFromArray
    TRY Maybe just delete instances so they start from scratch?
        --  Works
    ??? Should the instance deletion happen in project-server
        or in mod-sim-control?
        --  project-server should only focus on loading and
            setting project settings right?
            That way anyone can call mod-sim-control and have the 
            sim properly reset?  It should be the main call?    
    
# bpName -- 2022-0505

DO  When writing blueprints, where is the data pulled from?
    --  dc-project.ProjectFileRequestWrite uses CURRENT_PROJECT
    --  CURRENT_PROJECT is set during
        --  UpdateProjectData
            --  Called by ac-blueprints.updateAndPublish
        --  SetCurrentProject
            --  Called by ac-project.LoadProjectFromAsset
            --  Calls ACBlueprints.SetBlueprints
                --  Which calls compile, where 
                    name is reset.
DO  InjectBlueprint
    --  blueprintDef should be name + scriptText
    

# ac-projects -- 2022-0509

DES Data flow
    1.  ProjectEditor change
    2.  --  update 'project' state
    3.  ac-project update
    4.  --  update ac-projects
    5.  --  write

DES ac-blueprints
    --  Trigger:
        --  SetBlueprints
        --  CompileBlueprints
            ==> DCENGINE updated as side effect
    ac-metadata
    --  Trigger:
        --  SetMetadata
        --  updateAndPublish
            ==> DCPROJECTS updated as side effect
    ac-instances
    --  Trigger:
        --  UpdateCurrenInstance / Add/Write/Delete
        --  WirteState
        --  
ISU How should ac- state deal with dc-?
    --  Should dc- be updated with hook_Effect?
    --  Should dc- be updated with direct API call?
    
DES In general, ac- projects should work like this:
    1.  client requests state update
    2.  ac- updates the state
    3.  ac- hook_Filter runs
        =>  This is where any dc- data updates should happen
    4.  ac- hook_Effect runs
        =>  This is where the dc- write is triggered
        
    Where things should NOT happen:
    --  updateAndPublish should NOT write to dc
        --  It should happen in hook_Filter
    --  Set* should not write to dc

STATUS
* ProjectEditor needs to properly update ac-projects
  and ac-rpoject
* ac-project label updates needs to 
* ProjectEditor should load ac-project directly?
  or perhaps talk to project-server.
  See what's happening with Blueprint editing or something
  else.  
  
# dev-wizard UI -- 2022-0513

ISU Dev Wizard
    --  Invalidating Script Line Tokens
        If you change the keyword, the valid slots are changed.
        * How do you display valid options?
    --  

# dev-wizard mockup

ISU Show combined props and features

# LineSlot

Supporting SelectEditorLineSlot (aka Slot Selector), a display of slots!

* The number of slots corresponds to the validationTokens, and are variable
  as the slots are filled in with valid/invalid complete/incomplete entries
* validationTokens are derive from a scriptUnit (an array of IToken)

We need to know the "nature" of the slots to render
The SlotSelector ui events:
- select slot (one at a time) - slotIndex:number
- 

Related ui events (not SlotSelector)
- Submit when done editing - we will ALLOW invalid entry, but flag it in the UI
- Any submission (to project server, to compile) has to obviously pass validation

- each slot has

  data (1)
  the current contents of the slot (unitText)

  data (2)

  validation status:

  displayAsValidated
  - the current selection has no errors
  displayAsEmpty
  - not validated because there's no validatable content
  displayAsVague
  - we don't know how to validate this but it has data
  displayAsError
  - the current contents is illegal or causd an error
  displayAsUnexpected
  - overflow state (underflow is taken care of by displayAsEmpty

  data (3)

  selection status
  - the current selected slot
  - selectedViewState of each slot

type Slot {
  expectedType: name:gsType
  viewState: valid | empty | error | unexpected | vague
  unitText: "text representation of scriptToken"
  dataSelectKey: slotIndexNumber starting from LINE_START_NUM
}

const line = 'prop agent.energyLevel setTO 10';
const lineScript = TRANSPILER.TextToScript(line);

const slots = WIZCORE.GetSlotViews(lineScript);
// slots is used to render the selection thing

function RenderSlot (props) {
  line = WIZCORE.SelectedLineNum();
  const pageLine = WIZCORE.GetVMPageLine(line);
  const { lineScript } = pageLine;
  const slots = WIZCORE.GetSlotViewData(lineScript);
  tokenList = [];
  slots.forEach(slot=>{
    const { expectedType, dataSelectKey, viewState, unitText } = slot;
    tokenList.push(<GTokenVariant ...slot >);
  });
  return tokenList blah
}

// tokens might look like this...they have the data select key
function GTokenVariant (props) {
  const { expectedType, dataSelectKey, viewState, unitText } = props;
  return (
    <div dataKey=dataSelectKey key=? ...>
    </div>
  )
}

// meanwhile, in ac-wizcore DispatchClick...
add a check for another data attribute (e.g. data-selslot?)
update state as needed 

Q. How do you get the arg structure from the keyword validator?
A. That's what Sri is writing!


---
# BL

* EditSymbol selection should change slot def, not line
  (at least not yet)
* How to handle slot/token deletion?
* How to end/exit/save line edit?

# STATUS 5/25/22

wizcore sloteditline should be vtokens?
or else how can we figure out allowable values to enter?

# STATUS 5/26/22

As student enters data, how do we know what to show?
vmTokens was used previously.  What are the pieces of data?
1. Full Script Side
  * vmPage > vmPageLine > lineScript > scriptToken
2. Slot Editor Side
  * keyword > syntaxLine > syntaxTokens
  * slotEditor > slotLine > slotTokens -- includes validation as viewState?
  * lineScript > scriptToken

EditSymbol is getting list of objects from `selection`
--  sel_validation comes from WIZCORE.State()
--  validationTokens comes from sel_validation
--  symbolData comes from validationTokens

--  sel_validation is set during _interceptState, based on sel_linenum

??  Should EditSymbol be using the selected blueprint line (left side) for
    validation?  Or should it be using the selected slot (right side) for
    validation?  And should it use the keyword syntax or the currently 
    selected value?

SelectEditor
--  Renders `selection`
    from `props`
    from ScriptEditPane
    from WIZCORE.SelectedTokenInfo

# Merge next-gui-validate-merge -- 2022-0527
* STATE.SendState
* if there's an error in the validationToken, how does EditSymbol
  know which options to show?
  --  Handle Overflow
* Value entry not working?
  --  Maybe becuase of `tok.toString` call?
  --  Or is something else going on?

# Refining SelectEidtorLineSLot -- 2022-0528
* Show disabled 
* Save is not saving extra vtoken?
  --  value is not being saved for some reason
  --  input field handler is changing script_tokens?  But that is not the slot token?
      --  THe scripChagned save is only triggered on ENTER
      --  Somehow the 'value' is added to the 'setTo' not a separate object???
  =>  Change Existing Value
      slots_linescript has the right token, but not the updated value
      script_tokens also has the right token but not updated values
  =>  Value isn't changed until you press ENTER
      --  ScriptChanged script_tokens has the new value!!!
      --  SelectEditor is re-initialized with a scriptToken with the correct
          value
      xx  But then SElectEditor renders 118 with the wrong value?!?
          --  probably b/c it's reading from vtok and not scripToken?
      --  And save still leaves `slots_linescript` and `script_tokens` wrong
  =>  The basic problem is that the `scriptToken` used by SelectEditor
      should be the slotScriptToken, since it's changed byRef?
      --  `scriptToken` comes out of selection
      --  selection comes out of SelectedTokenInfo
      --  `scriptToken` is straight out of the source `script_tokens`?
          and refers to objects in `script_page`
      --  What's the slot equivalent?  When we have so many different
          token representations?
          --  SElectEditorLineSlot gets the slot data from TRANS.VlidateStatement
          --  So the tokens are creatd on each render.
          --  But SelectEditorLineSlot DOESN'T handle the tokens used by
              SelectEditor!!!
      --  Maybe the input value editor should be in SElectEditorLInieSlot?
          =>  NO.  It handles the line slot and the Editor, either 
              EditSymbol or Input
              --  The issue is maybe that the slot validation tokens
                  need to be generated outside of SelecEditorLineSlot?
              --  Or just that the Input needs to pass off the values
                  to the slots_linescript?
          =>  The main data that SelectEditorLineSlot 
* Should State use slots_validation
  --  with { validationTokens, validationLog }
  --  or use sel_slot_vmtokens?
  --  TRANSPILER.ValidateStatement returns
      a validation object.  So let's stick with that?
      because we need tor un it multiple times?
* Why is SelectEditor constructor getting an outdated
  slots_validation object?
  --  Actually it IS getting the right object
  --  The problem comes when the sel_linepos changes?
* Why is class-state-mgr choking on valid states?    
* Selecting is all wrong?!?
* click choiceKey handler is not correctly updating the current selection?
  --  updating the wrong slot?  slot index is off?
  --  or auto-incrementing slotPos to +1 is
      messing with the stored values.  
* ERROR
  1.  Reload
  2.  Click 'prop'
  3.  Change 'prop' to call
  4.  Click 'x'
  5.  => methodName error in previous token
  --  Somehow the choice calls are getting 
      weird slot info?
* After 'x' is selected, we really should call
  validate tokens again!
# REVIEW
* `sel_slot_scripttoken` is actually a validation token -- NOT a scriptToken
* `slots_linescript` should be the main object that SlotEditor works with.
=>  Change <button> to use local handler with an (e)
* DispatchClick read line should use new call
    so it reads the right line, withbloxkcs
* ScriptChanged method needs to do something?!?!
  --  who calls it and what are they looking for?
* Deselect after cancel is broken
=> Change VIEWSTATE ENUM -- TValidationErrorCodes
* Review click handler code
  --  Should we be updating token by reference
      instead of creating a new object?
      
# Show invalid in script_page view -- 2022-05-31
* script-to-lines.tokenOut() and lineOut() can be used
  to insert validation
* How do we show viewState in SelectEditorSlots?
  --  Key data is viewState?
  --  Where does Slot Editor get validation tokens?
      --  slot_validation
      --  wizcore.interfcept state
          --  TRANSPILER.ValidateStatement

# Show invalid in script_page view -- 2022-06-01
DO  Make sure ScriptViewPane's passed GValidationToken
    components match SElectEditorSlots'
DO  Rename `GValidationToken` to `GValidatedToken`?
DO  Remove top nav
BUG Replace number with string doesn't work

# overwriting prop -- 2022-06-10

1. ac-blueprints.SeetBlueprints
2. ac-blueprints.SeetBlueprints
3. ac-blueprints.SeetBlueprints

1. LoadProjectFromAsset

PRB ac-blueprints.
      m_ResetAdnCompileBluepritns
        m_SymbolizeBluerpitns triggers first
        m_CompileBluerpints is second
          bpDefs map
    The `overwriting prop` warning is coming
    from ac-blueprints.m_CompileBlueprints
    calling TRANSPIELR.SymbolizeBlueprints on a
    blueprint that has already been symbolized.
    Perhaps we either need to clear the symbols
    first, or we need to skip the extra symbolize?
    (Probably not skip since the changed blueprint
    might have new symbols that need to be symbolized)

# ovewriting prop -- 2022-0611
PRB Why is SymboliozeBluerpint called twice?
    1.  First call is ...
    2.  Second call is m_CompileBlueprints

# fix script load -- 2022-0611
PRB class-symbol-interpreter.ts:424 Uncaught TypeError: Cannot read properties of undefined (reading 'length')
    at SymbolInterpreter.argsList
    --  Seems to happen if there's only one init line
DO  'not an object' -- show expected value below slot
DO  gsBoolean slots are not working
DO  How to remove extra arguments -- `DELETE` button?

# add / delete -- 2022-0612
DO  Add new line
DO  Delete line
PRB What should the replacement be?
    {identifier: 'call'}

# fix EditableTokensToScript -- 2022-0612
PRB const nscript = TRANSPILER.EditableTokensToScript(lsos);
    This line messes up block block edits

# qa Line selects after blocks -- 2022-0614
PRB Line selections after blocks are off by 1
PRB Saving first line of block results in errors
DO  Auto-select newly created line for editing

class state manager:324
queue effect
look at scroll line into view
ScrollLineIntoView
QueueEffect
-- look at intercept state

Why isn't scroollIntoView working?

# KEYWORDS -- 2022-0615
* prop 
* addProp

# objRef -- 2022-0615
[
    {
        "identifier": "prop"
    },
    {
        "objref": [
            "agent",
            "energyLevel"
        ]
    },
    {
        "identifier": "setTo"
    },
    {
        "value": 0
    }
]

# validation tokens for prop vs featProp -- 2022-0616

prop      --  should only show prop, not feature
featProp  --  should only show feature not prop

# how does ValidateStatement work -- 2022-0616

ValidateStatement
  kwp = IKeyword
  kwp.validate
  class-keyword.validate
  class-keyword.validateToken

# merge editable tokens -- 2022-0617
PRB instances choke
    --  the problem is when instances are created
        probably related to scriptifying?
    TRY No initscript for instance?
        =>  Still same problem

# unedefined every -- 2022-0622
PRB scriptToken
      identifier: ''
    validationToekn
      unitText = undefined

# prop jsx -- 2022-0623
PRB InstanceEditor.render()
    TRANSPILER.ScriptToJSX
    script-to-jsx.ScriptToJSX

REV How much do existing projects make use
    of initScripts
    * aquatic-energy -- pos
    * aquatic --  pos, custom props, widget
    =>  A fair amount, but all all settings

# saving scripts -- 2022-0624
PRB beforeunload
    --  This not the right call
        because it only triggers when the window is about to unload
    componentWillUnmount
    --  This is too late!
PRB Crappy UI Experience
    
# qa -- 2022-0625
PRB SlotEditor Cancel
    Uncaught Error: DecodeKeywordToken: tok 'undefined' is not decodeable as a keyword

# QA Keyword Test -- 2022-0627
TRY Existing Lines
TRY New Lines

# Prop objref editor -- 2022-0627
PRB prop name should be bp.propName
    Let EditSymbol handle both
    
TRY Break blueprints into dicts

# 2022-0627 
* see featObjRef for latest example of interpreter flow
* focuse on EditSymbol, avoid changing symbol-inteprreter
--  EditSymbol
--  featProp
--  class-symbol-interpreter
        symbolScope: ['features'], // 'names of things we want to show -- features'],

DES What kinds of objrefs are there?
    propObjRef:     prop     <bp>.<propName>
    featPropObjRef: featProp <bp>.<featName>.<featPropName>
    featMethObjRef: featCall <bp>.<featName>.<featMethod>

DES Alt
    Can we just flatten the objref?
    e.g. break down bp, propName into two separate slots?

# 2022-0628
PRB `prop` line results in multiple errors
    --  class-keyword.tsx:417 K_DerefProp: objref arg is undefined (bad scriptText?)
        =>  objref is undefined in prop.tsx
            because the line is just `prop`.
            So if there's an error this egregious,
            do we not compile it?  Or do we try to fail
            gracefully?
        =>  Do we not allow saves of bad script?
    --  prop.tsx:65 Uncaught TypeError: Cannot read properties of undefined (reading 'undefined')

# 2022-0630
PRB Two Cancels
    --  Slot Editor
    --  Script Editor
    Do we warn about both?
    Simultaneously?  Or one at a time?
    Or disable until after save?
    
PRB Initial Update
    
PRB Update Tracking
    --  ScriptEditor
        --  Initailize
            =>  RequestBpEditList
        =>  handleWizUpdate
    --  PanelScript
        =>  handleWizUpdate

Operational Modes
--  local state
--  mode: 
    --  who's turned on?
    --  who's turned off?
    --  general operation
    --  edit
    --  input stages
    --  select line
    --  select token
    --  add a line
    --  delete a line
    --  scroll
    --  edit slot
    --  edit script
    --  can you click on things
    

PRB Clear slot editor after panel switch


# 2022-0629
PRB Locked
    --  Shouldn't locked tokens be done on a validationToken
        level?  Rather than purely visual lookup?
    --  We can't lock the WHOLE line, since for controllers
        we still need to be able to set true/false
        and blueprint needs to be able to set name
    --  Lock needs to happen by the keyword, not the choices
        e.g. if # is the selected slot, we want to prevent
        changes to another choice.
    --  

# 2022-0630
PRB Block Insertion
    --  Blank Line: New ifExpr / When / OnEvent
    --  Existing Line: Edit 
    --  Delete Line: 

# 2022-0630
PRB ifExpr
    --  SelectEditorSlots
        --  validationTokens: 
              error
              gsType: expr
              labeL: no unitText, so fall back to gsType

# 2022-0701 STATUS

#### next
PRB Overflow words are being cut off by the
    validator for some reason.
    THe current 
#### stash
next-gui-qa:wpivalidate has
* isDirty calls
* attempted fixes at overflow arguments -- but its wrong
* attempted fixes at "nothing to select" padding

# isDirty 2022-0707
PRB After submitting changed script, the system update is causing
    ScriptEditor to think the script_page is dirty.
    --  line edits via slot editor should set dirty flag
    --  But general edits should not
    Dirty should be handled by WIZCORE!
PRB What's causing all the PanelScript renders?
    1.  ScriptEditor.OnInstanceUpdate
        =>  Skip the instances update
    2.  ScriptEditor.handleWizUpdate:186
        =>  setState is always triggering even though
            wizupdates do not pertain to ScriptEditor.
    3.  Scripteditor.UpdateBpEditList:235
        =>  
PRB Switch from Code to Wizard should not dirty

# slot editor dirty -- 2022-0708

PRB slot_linescript_is_dirty updates do not 
    trigger SelectEditorSlots updates

DES EditorCore
      WizCore
      SlotCore
      
    See ac-wizcore-util for how supporting modules might work
    "data-not-saved" -- not isDirty -- 'needsSaving'
    'needsRefresh' is different
PRB SlotCore -- when to raise needs_saving?  From 
    ScriptEditor when script changes?  COordinat ewith WIZCORE

ScriptEditor handleWizUpdate needs to recognize when slots_lienscript_is_dirty is triggered so that it updates SelectEditorSlots.        

# slot editor unsaved -- 2022-0709
PRB Add Dialog to Slot Editor
PRB Should editorcore handle wiz and slot state updates?
    Really it needs to, otherwise, ScriptEditor is doing it.
    wizcore should be:
      wizcore
        pagecore
        slotcore
PRB Issue is DevWizard
    --  Can DevWizard just switch to SLOTCORE and EDITMGR?
        The problem is that DevWizard has to handle wizUpdate
        and trigger a slotUpdate.
        Ideally editorcore does that?
    --  Can't quite handle it in editorcore?
        --  input changes affect slots_linescript?
            so we can't just rely on editorcore.dispatchClick
    --  Split into slotcore and wizcore?
        --  even if slotpos and slot_linescript is handled in slotcore
            we still need to process line selection from wizcore
            and have editorcore handle the changes.
        --  Where should that happen?
            --  Not in ScriptEditor!!!  
            
PRB SelecEditorSlots
    --  Moving state handlers directly into SelectEditorSlots
        so that we're not cascading changes down from 
        ScriptEditor -> ScriptEditPane -> SelectEditorSlots
    --  Should SelecEditorSlots use slotcore directly as state?
        --  This is how wizcore was intended to be used?
    =>  Rename SlotEditor

# editorcore -- 2022-0710
PRB In the middle of moving slotcore methods out of wizcore
    --  Reivew SaveSLotLineScirpt, CancelSlotEdit, DeleteSlot
        --  Can these actually be easily extracted?
            or do they need some interaction with wizcore?
            in which case, we need editorcore?
        --  Or perhaps they belong in editorcore
            instead of slotcore?
QA  `prop agent.name` selecting `method` breaks.
    but works with `prop agent.x`  
    --  slot edits need to trigger re-compile
    --  how did the old recompile work?
    upon slot changes, we need to redo slot bundle
    --  And not rely on wizUpdate since it's not wiz updating
    --  The old method recompiled bundles 
MAP Screwy Updates?
    --  editcore
        --  dispatchClick
    --  wizcore
        --  interceptState
    --  editore
        --  wizUpdate
        --  slotUpdate
    --  slotcore
        --  interceptState
QA `prop agent.name`
    --  EditCore:283.DispatchClick  - SLOTCRE.SendState(newSlotState)
        SlotEditor:113.HandleSlotUpdate - setState(vmStateEvent)
        SlotEditor:289.render - WIZCORE.GetLineScripText(lineScript)
        WizCore:461.GetLineScripText
        script-tokenizer:30.StatementToText - not a statement {}

# state changes -- 2022-0711
PRB What level should init state changes?
    --  DevWizard => script_page
PRB Click "Touches"
    --  Cannot convert undefined or null to object
    ObjRefSelector:165
    --  Happens on the SECOND click!
    --  Happens AFTER clicking on invalid "Touches"
        then clicking another one!!!
        TRY interpreter doesn't provide proper
            options after "Touches" becuase
            "Touches" is not a valid bpName
            so no propName options can be found.
            =>  Just ignore bad options?

# feature compile -- 2022-0713
PRB addFeature AgentWidgets
    featProp agent. => can't see AgentWidgets

# undefined text -- 2022-0714
PRB TokenToUnitText returns 'undefined' string
    TokenToUnitText maps to...
    script-tokenizer.TokenToPlainString
    Getting from UnpackToken
    UnpackToken deliberately adds the 'undefined' string.
    So let's just strip it out when dislaying the input
    
# bp list update -- 2022-0714
PRB PanelSelectBlueprint
    Delete Blueprint Call is...
      project-server.HandleBlueprintDelete
      BlueprintDelete
      ACBp.DeleteBlueprint
      Updates state - bpDefs
      bpNamesList gets updated
    ACBlueprints state subscription
      
    => ScriptEditor does not get bpNamesList update.  Only project-server does.  
    
    Does project-server need to pass on the event?
    
    State update should call UpdateBpEditList

# new bp -- 2022-0714
PRB New Script
    --  PanelSelectBlueprint
        --  SELECT_SCRIPT, bpName: ''
    --  ScriptEditor
        --  OnSelectScript
        
# when tests -- 2022-0714
PRB RegisterWhenTest is only called on Main?
    
# select script -- 2022-0716
SHould ScriptEditor really use OnSElectScript to start up a new script?
Is the "this.OnSElectScript" call in componentDidMount necessary?

Two Seleciton methods
1. new script -- works
2. select existing script - broken

Issue
* When selecting from Main, what's the proper load method?
* Should ScriptEditor load all assets directly and not rely on the bpEditList from Main?

PRB new script does not call OnSelectScript
    With regular load, who does?

# bplist -- 2022-0716
PRB ScriptEditor bplist showing deleted scripts 
    --  ScriptView_Pane.NET:BLUEPRINT_DELETE
    --  project-server.

PRB SlotEditor/EditSymbols showing deleted scripts
    --  wizcore.interceptState
        TRANSPILER.SymbolizeBlueprint
    --  BUNDLER from 'script/tools/script-bundler
    --  SIMDATA.GetOrCreateBlueprintBundl
    --  DeleteBlueprintBundle
    =>  Bundle IS deleted
        but validation list is not 
        getting the right list?
    PRB ScriptEditor's SIMDATA is
        different from MAINs?
        =>  YES
    PRB How do we maintain parity?
        
PRB `untitled` bp needs be removed
    Actually, `prevName` bp
    =>  Upon editmgr.SaveSlotLineScript,
        Do we?
        --  Make wizcore handle
            it during interceptState?
        --  keep track of current bpName in SlotEditor?
        --  Can't do it in wizcore
            because we don't have 
            access to the previous
            name by then?

# smart features -- 2022-0716
PRB featTouches
    --  Physics
    featCursor
    --  Movement
    
# removal -- 2022-0716
PRB Remove
    * PanelScript
    * ScriptViewPane
    * ScriptEditPane
    * SelectEditorSlots
    * SelectEditor

# symbolize slot -- 2022-0717
PRB script-compiler.SymbolizeBlueprint
    --  Does it not replace the old one?
    --  Is dc-sim-data.DeleteBlueprintBundle the right symbol bundler?

NEXT
PRB What happens when you click on 'agent'?
    --  editmgr.dispatchClick.choiceKey
        SLOTCORE.SendState(slots_linescript)
        slotcore no intercept
    --  editmgr.handleSlotUpdate.slots_linescript
        !!! bundle gets it from wizcore!!!
        
    What happens when you click "Save"?
    --  EDITMGR.SaveSlotLineScript
        --  WIZCORE.SendState(script_tokens)
        --  SLOTCORE.SendState(slots_need_saving)
    --  WIZCORE.interscept(script_tokens)
        --  delete old blueprint bundle
        --  EDITMGR.handleWizUpdate(cur_bdl)
            --  update slots_validation
            
    Where is ObjRefSelector getting validationTokesn from?
    --  SLOTCORE.State().slots_validation
    
    PRB slots_bundle is not re-created when
        you select the new line?!?
        
        After changing the bpName, wizcore's 
        cur_bdl remains pointing to the old 
        bundle?
        
        Somehow slotcore slot_bundle is being
        updated with an old budnle?  by who?
        
        As soon as you click a differnt line the slots_bundle reverts back?
        After saving the last one, slots budnel did not get updated?
            
# script Event deletion -- 2022-0716
KEY dc-sim-data.DeleteScriptEvent
KEY ac-blueprints.m_ResetAndCompileBlueprints

# react nochange -- 2022-0718
PRB SlotEditorSelect_Block render
    --  shadowroot
        --  value is correct=0
            but shadow root shows 5
PRB What's being called when we select a different
    line?
    --  EDITMGR.DispatchClick
          WIZCORE.SendState(sel_linenum, sel_linepos)
            WIZCORE._intercept -- n/a
          SLOTCORE.SendState(sel_slotpos)
            SLOTCORE._intercept -- n/a
        EDITMGR.handleWizUpdate(sel_linenum, sel_linepos)
          SLSOTCORE.(sel_linenum, sel_linepos)
          
        EDITMGR.handleSLotUpdate
        SlotEditorBlock.HandleSlotUpdate
        SlotEditorBlock.render
PRB Select Slot Position
    --  EDITMGR.DispatchClick
          SLOTCore.SendState(sel_slotPos)
            SLOTCORE._intercept -- n/a
        EDITMGR.handleSlotUpdate -- n/a
        SlotEditorBlock.HandleSlotUpdate
          setState(vmStateEvent)
PRB Select Choice
    --  EDITMGR.DispatchClick
          SLOTCORE.SendState(
            slots_linescript
            slots_need_saving
          )    
PROGRAM DEFINE
    MakeAgent
    
# qa -- 2022-0719
PRB Add Instance
    --  Triggering sim reset because it thinks
        the sim is running?
        
# safeload -- 2022-0720
PRB project-server
      199:ACProject.LoadProjectFromAsset
        DCPROJECT.ProjectFileLoadFromAsset
          PROJECT_LOADER.getProjectByProjId
          as-load-projects.getProjectByProjId
        ACMetadata.SetMetadata => just sets state
        ACRounds.SetRounds => just sets state
        ACBlueprints.SetBlueprints => skip compile, just set bpDefs
        ACInstances.SetInstances => just sets state
      200:SIMCTRl.SimPlaces
    
PRB Submit script
    ScriptView_Pane.SendText
      NET:SCRIPT_UPDATE
      
    project-server.RaiseModelUpdate

# Algae is missing from bp list -- 2022-0720      
      
# dbgOut -- 2022-0720
PRB Show message
PRB Strip quotation marks from message
    --  Where should that happen?
        class-symbol-interpreter works with unitText from validation tok
        which is slots validation
        slots_validation is done in editmgr
        TRANSPILER.ValidateStatement
        script-compiler.ValidateStatement

# Costume reset -- 2022-0720
PRB ScriptEditor updates affect only a single blueprint
    --  and the instances for that blueprint
    --  But Feature Reset is in api-sim,
        and affects all instances for all blueprints
    =>  Do we just recompile everythign whenever
        a new blueprint comes in?
        --  Makes sense if other bps make refer to the current bp?
    PRB If script update comes in during sim run
        then reset stage ought to clear the error

# New Script -- 2022
PRB 1. Create from Main
        PanelBlueprints
    2. Create from ScriptEditor
        PanelSelectBlueprint
        
PRB On name change
    project-server.ScriptUpdate(data) does
      receive 
    SlotEditor
      EditMgr.SaveSlotLineScript
        WizCore.SendState(script_tokens)
          WizCore._intercept(script_tokens)
            name change ? SIMDATA.DeleteBlueprintBundle

# Multiple Loops -- 2022-0722
1.  Stage()
      Main.componentDidMount
      client-exec.SystmAppRun
      APP_STAGE
2.  Stage()
      Main.componentDidMount
      SystemAppConfig
      project-server.Initialize
        DoSimReset
      
PRB SystemAppConfig & project-server.Initailize
    both trigger api-sim.Stage() too close to
    each other.        
    --  SystemAppConfig without autoRUn doesn't seem tow rok?
    
PRB Ideally, projserver.Initialize runs AFTER
    api-sim.Stage() has completed.

PRB Stage() is being called again before the
    async() method is finished.      
        
# Rename -- 2022-0723
PRB Rename needs to be done on both
    * ScriptEditor bundle
    * Main bundle
    
    Add a `RenameBlueprint` call?
    Or can we just rely on one bundle
    replacing another?
    
    Should ScriptEditor be the one to instigate
    a global delete?
    
    Rename Sources
    * SlotEditorBlock
      editmgr.SaveSlotLineScript
      wizcore._intercept(script_tokens)
        -- detect name change

    Delete Call
    * ScriptView_Pan.OnDeleteConfirm
      => NET:BLUEPRINT_DELETE

    project-server.HandleBlueprintDelete
    
# Name -- 2022-0723
PRB Mysterious `name` field
    methodName
    featObjRef.cur_scope(prop)
      prop = props[height]
      props = feature.props
      feature = features[Physics]
      features = blueprint.features
      blueprint = bluepritns[bpName]
      blueprints = SIMDATA.GetBlueprintSymbols
        GetBlueprintSymbolsFor
        GetBlueprintBundle
        BLUEPRINTS
          dc-sim-data.SaveBlueprintBundle
            transpiler-v2.RegisterBlueprint
              transpiler-v2.CompileBlueprint
                CompileStatement    
            ac-blueprints.m_CompileBlueprints
      
      script-compiler.SymbolizeBlueprint
        SymbolizeStatement
          kwp.symbolize
            feat.symbolize
              feat-physics.symblize
                height: SM_Number.Symbols
                  => class-sm-number somehow
                     inserts a `name: 'methods'` into
                     the `Symbols` definition?!?
      
    bundle
      symbols
        features
          Physics
            props
              height
                methods
                  name
                  add
                  setMax
                  setMin
                  setTo
                  setToRnd
                  sub
      
# QA -- 2022-0728
PRB Moths-Acitivty-Dont-Know
    1. Run Round
    2. Stop Round
        class-sm-agent.ts:472 Uncaught TypeError: Cannot read properties of undefined (reading 'name')
    at SM_Agent.exec (class-sm-agent.ts:472:38)

    PRB On Start Round
          class-gscript-tokenizer-v2.ts:828 Uncaught Error: KeywordFromToken: tok 'block' is not decodeable as a keyword
          at Module.KeywordFromToken 
        TRY Remove `//` from start of roundinitscript?
            => NO
        TRY Error is in `prop lightOrDark setTo dark`
            
# untitled agent -- 2022-0731
PRB untitled agent when changing projects
    ISU ScriptEditor is designed to open scripts from
        multiple projects, but it is not fully implemented.  When you have ScriptEditor open
        to one project and then open another project
        what should happen?  
        --  Display Warning:
            "Main has loaded a new project.  Would you like to select a Character from the
            the new project?"
        PRB You can't really continue to work on the
            current project because of symbolization
            issues -- you need to symbolize the 
            project context in order to view agent
            information.
        =>  The proper fix is to make ScriptEditor
            completely independent of Main?
            --  If we make them completely independent
                we run into major permissions issues
                with multiple people opening the
                same project?
        =>  Interim Fix?
            --  Show warning and force reload?
            --  Ignore?
            --  Is it even possible to submit
                a script to the non-current project?
                =>  Nope!
# graph updates -- 2022-0731
PRB graphProp.value going to undefined?!?!

# QA -- 2022-0802
PRB Load keywordTest with global properties: PrepRound
      script-bundler.ts:31 Uncaught Error: AddToProgramOut: call OpenBundle() before this call
          at m_HasCurrentBundle (script-bundler.ts:31:11)
PRB Rounds init with partial orund
    PRB Prep Rounds Triggers
        --  CUR_BUNDLE is undefined
        --  sim-rounds.RoundInit
            sim-rounds.m_RunScript
    TRY What's the standard symbolize and compile call?
        --  TRANSPILER.SymbolizeBlueprint(script);
            TRANSPILER.CompileBlueprint(script);
        TRY Can we call SymbolizeBlueprint?
            script-compiler.SymbolizeBlueprint
        TRY Can we use CompileBlueprint
    TRY If we create a round bundle, where should
        it go?  Where should it get compiled?
        To a 'global' bundle?

# Costume/Physics -- 2022-0808
From a student's perspective, it should be a set once and forget about it.  The system should take care of physics sizing and scaling.

Costume does not rely on Physics.
But Physics does rely on Costume.
And Touches relies on Physics.
Touches => Physics => Costume

Issues
* Physics has separate widths:
  --  width         -- user-set value
  --  bodyWidth     -- calculated
  --  costumeWidth  -- calculated
  --  scale         -- overrides width

Use Cases
* Setting Costume
  --  When setting costume, it should default to 
      size of the PNG
  --  If you want to resize it, you should be able
      to define one dimension: `size`?
      --  `size` is overriden by `width/height`
  --  If you want precise sizing, use `width`
      and `height`.
  --  `scale` is a more advanced concept
* Set costumeName needs to set Physics size if present?
* Set size of costume by scale
* Set size of costume by exact width/height

Advanced Use Cases
* Set separate physics body size

Where should size/scale be set?
* Costume: It's more natural
* Physics should just be body?
  --  What about collisions?

# Movement -- 2022-0810
TRY `featProp agent.Movement.moveWander setTo true`
    =>  exclusionary is problematic.
        you have to turn off the value for someone else
TRY `featProp agent.Movement.movementType setTo 'wander'`
    =>  How do you decide to stop seeking an agent?
    --  static: (none)
    --  wander: (distance)
    --  edgeToEdge: (distance) (direction)
    --  goLocation: x y
          `featProp agent.Movement.targetX setTo 10`
          `featProp agent.Movement.targetY setTo 10`
          `featProp agent.Movement.movementType setTo 'goLocation'`
          vs
          `featCall agent.Movement setMovementType 'goLocation' 10 10`
          vs
    --  jitter
    --  wanderUntilAgent: (agent)
    --  seekAgent: (agent)
    --  seekAgentOrWander: (agent)
    TRY STRINGS
`featProp agent.Movement.moveWander setTo 0` // static
`featProp agent.Movement.moveWander setTo 5` // move distance
`featProp agent.Movement.moveEdgeToEdge setTo 180` // direction in degrees
`featProp agent.Movement.moveGoTo setTo '10,10'` // x,y as string
`featProp agent.Movement.moveJitter setTo 5` // jitter distance
`featProp agent.Movement.moveWanderUntilAgent setTo 'Tree'` // blueprint
`featProp agent.Movement.moveSeekAgent setTo 'Moth'` // blueprint
`featProp agent.Movement.moveSeekAgentOrWander setTo 'Moth'` // blueprint

        The key would be that anytime one of these values is set, the others
        are cleared?  But how would we know that?
        =>  During FEATURES_UPDATE we proces the movement, and then immediately clear it?

TRY FEATURES_UPDATE
    --  Set movementType properties
    FEATURES_THINK
    --  Calclate movements
    FEATURES_EXEC
    --  Process derived properties
    VIS_UPDATE
    --  apply positions

# seek -- 2022-0812
* seekAgent is not working?
  --  where is 536: options.targetType coming from?!?!
      --  It's stored in SEEKING_AGENTS
      --  `seekAgent` is an internal method!
          * seekNearest
          * seekNearestVisibleCone
          * seekNearestVisibleColor
* how to stop seek?
* commit and push Movement

# Block Editing 2022-0813
* Block Editing
* Establish a common frame rate?

# Help 2022-0813
PRB Current Help
    * SELECTED_SLOT_TYPE_HELP
      --  Help for the selected slot
      --  Rendered by `EditSymbol_Block`
      --  codex.`ForTypeInfo`
      --  `codex-types`.yaml
    * SELECTED_CHOICE_HELP:
      --  Help for selected choice
      --  Rendered by `SlotEditor_Block`
      --  codex.`ForEditorSelection`
      --  `codex-keyword`.yaml
PRB Types of Help
    info -- 
    1.  First select slot line
        a.  What you're seeing
            SELECTED_SLOT_TYPE_HELP
        b.  What ACTION to take
            How to take action?
        c.  What are the options you see
        d.  What you've selected
            --  !selected ? general instructions
            --  selected ? selection explanation 
    * Slot Editor Slot: SlotEditor_Block?
      --  Select a keyword
      --  Select a Feature
      --  Select method
      --  Select a feature method
      --  Input a Value
    * Hovered Choice Option: EditSymbol_Block
      --  Option to choose
    * Selected Choice Option: EditSymbol_Block
LOG Working On...
    --  objRef:agentProp tokenHelp

# help -- 2022-0815
* SlotEditor_Block
  --  subsequent validation tokens are replacin the original help

* EditSymbol help works for features
  SELECTED_CHOICE_HELP should ideally 
  also show feature help info?
* EditSymbol popup help for keywords and methods?
PRB EditSymbol_Block
    --  Need context of agent line
        in order to figure out what kind of 
        feature methods
    --  f_render_choices gets
        sd = sd.methods.monitor
        vs = vs.methods[info, items, unittext]
    --  How are the signatures?
        prop => methods = slot 3
        featProp => methods = slot 3
        featCall => methods = slot 3

# help -- 2022-0816
* HELP
    --  Look at kw to see if it's 
        a featProp or featCalll?
        if so look at objref to see
        which feature was spec'd?
    --  Is there a better way?
        How else can we know that it's
        feature-related?
        --  The symboldata and viewdata
            tokens themselves do not have
            that info
  --  generic 
        HELP.GetHelp(gsType, selectedValue)?
        HELP.GetHelpForVToken(vtok)?
        =>  NO!  Too specific?
* POPUP
  --  Popups for slot editor get cut off
      by the top of the screen
* Adding Movement zeroes positions!?!
  --  Should x/y be set?
  --  do we want to allow
      using prop.x?
      or do we want to force
      the use of Movement?
  =>  Movement should NOT be necessary to set
      initial position!!!
      So that means Movement should respect
      agent.x/y setting?
      But agent.x/y is not set until initScript?
      So set it after?  Add an init?
  TRY When does initScript run?
      GLOOP_PRERUN
      --  dc-sim-agents.DefineInstace
* featProp property help does not work
* Advanced symbols help is impossible to read because of opacity
* addProp propType Help is not being read
* "LOCKED" Help
  --  keywords might have special syntax
      that has to be displayed, e.g
      `every` should explain `runAtStart`?
  --  featMethods might also have
      special syntax that needs to stick
      around
  --  What do we do?  Cascade them?
      Make them all stick around?
      Glue them all together?
      How do we show them?  Separate them?
* `String` does not match `string`
  --  And help is broken because of it
* TYPES OF COLORS
  --  Syntax
  --  Selected Information
  --  Selected Item
  --  Instruction -- italics, blue?
* CONCEPTS
  --  Slot Selection
  --  Token Selection (value for slot)
      --  Token Choices
  --  Line Level editing
* REVIEW
  --  Should everything be routed through ForChoice?
      Should there be ForEditorSelection?
      How about the others?
      Who's actually using which calls?


# COVERAGE
* [ ] Slot 1: Keyword
  * [ ] -- BLANK -- needs instructions?
  * [x] addProp
  * [x] addFeature
  * [x] prop
  * [x] featProp
  * [x] featCall
  * [ ] if
  * [ ] ifExpr
  * [x] when
  * [x] onEvent
  * [-] every
  * [ ] _comment
  * [x] propPush
  * [x] propPop
  * [x] featPropPush
  * [x] featPropPop
  * [x] exprPush
  * [x] dbgOut
  * [-] dbgStack
  * [-] dbgContext
  * [-] dbgError
* [ ] Slot 2: 
  * [x] feature name (list of existing)
  * [x] objRef: <agent>.<propName>
    * [x] 1:blueprint
    * [x] 2:feature
    * [x] 3:featProp
* [ ] Slot 3:
  * [x] propType 
  * [x] propMethod
  * [x] featMethod
  * [x] when conditions tests
* [ ] Slot input:
  * [x] prop name
  * [x] input value

* prop Algae.spawns true => ends with full ALL selectors?

# ifProp -- 2022-0824
PRB ifFeatProp dereferencing is screwy

# gsName Help -- 2022-0825
PRB Why can't we add gsName to SM_String?
PRB Types of hover help:
    --  slot
    --  selected type
    --  selected value

# gsName Help -- 2022-0827
PRB Syntax Help 'monitor' is overriding 'method'
    --  How to get syntaxhelp to read 
        the syntax on a feature-related call
        instead of trying to read 
        the type overrides?
    --  Call is 
        GSTYPE        method
        SELECTEDVALUE monitor
        PARENTLABEL   Touches
        =>  b/c it's a feature
            (has PARENTLABEL)
            codex calls m_GetFeaturePropHelp which returns 'monitor' method
    --  Do we want to use ForEditorSelection instead?
        --  Maybe?  It is the right info.
        --  But what about touchType?
    1.  Use gsName
        =>  This is correct.
    2.  Why is gsName returning
        monitor?  B/c unitText!
PRB unitText is being set to "undefined"
    Who's doing it?
    --  Who generates validationTokens?
        TRANSPILER.ValidateSTatement
        script-compiler.ValidateSTatement
        class-symbol-interpretor:1531 .argsList
          is somehow returning 'undfeind'?!!?
        script-tokenzier.TokenToPlainString
        UnpackToken is doing it!

# gsName / syntax Help -- 2022-0831
ISU Symbols are static
    The main issue is feat props?
    Because feat methods are settable?
    =>  methods can define arg types
        but props cannot?
    TRY Can we just do a codex-only
        substitution?  
        =>  The problem is we don't know
            what type to use?
    TRY Add a custom symbolize?
PRB Define feat prop in codex-features
    but feat method arg in codex-types
    Two Values?
    `featProp movementType setTo mtype`
    --> featProp argName
        setTo
        --  args
        movementTypeString
        --  methodSig
          --  name: setTo
          --  args: [movementTypeString:]
        => arg knows methodSig?
    `featCall monitor touchType b2b`
    --> featCall method argName
    TRY m_GetFeaturePropHlep should work
        How do we know to call it?
        --  arg token knows method
        --  we know keyword?!?
        How does this work?
        --  <gsName>: parent
        --  kw: featProp undefined
        --  obj: ObjRef 
        --  method: setTo 
        --  arg: string movementTypeString
PRB SlotEditor_Block.gsNameHelp definition
--  gsNameHelp's ForChoice call should
    somehow trigger m_GetFeaturePropHelp
    --  Using info from 
    --  `gsType` will be an unkown type
    --  `selectedValue` will be arbitrary
    --  what should `parentValue` be?
    --  how do we know when to trigger
        it?  When it's a GVAR?
--  What do we need to know?
    --  `featName` in order to know
        which feature to look it up from
PRB We WANT the help defined in the codex!
    And NOT in the features?!?
    This way it's centralized?
    But it's fine for the args types to be defined in the feat and class-sm
REV Definitions are in codex => good
    Do non-spec'd methods cascade?
PRB `addFeature` featName prop
    --  gsType is `feature`, but then
        you end up looking for `feature` in 
        codex-features, which does not make 
        sense at all!   It should be codex-types
    --  Is this a codex issue?
PRB ObjRef syntax
PRB ObjRefSelecto'rs syntax labels
    --  featProp is broken!
    --  What kind of codex object should it be?
        --  it's not a codex-feature
        --  it's not a codex-keyword
        --  not a gvar
        --  should be a type!
      
# WIKI 
## Overview
Notice there's a distinction between initially naming something (e.g. a new prop name) vs selecting from a list of existing prop names.
`any*`
`*Name`


## Syntax
* Keywords
  --  codex-keywords
* Keyword Arg
  --  new prop name (prop) -- `addProp`
  --  existing prop name (prop) -- `prop`
  --  feature (objref) -- `featCall`
  --  feature prop name (objref) -- `featProp`
  --  expression (string) -- `ifExpr`
  --  `ifProp`
  --  `ifFeatProp`
  --  any blueprint -- `when`
  --  available event -- `onEvent`
  --  number -- `every`
  --  timer option (everyOption) -- `every`
  --  agent prop (prop) -- `propPush`
  --  agent prop (prop) -- `propPop`
  --  feature prop (featProp) -- `featPropPush`
  --  feature prop (featProp) -- `featPropPop`
  --  expression string -- `exprPush`
  --  string -- `dbgOut`
  --  `dbgStack`
  --  `dbgContext`
  --  `debgError`
  LOOKUP  
  --  codex-gs-args
  --  keyword definition's validate function
      --  look up symbol-interpreter's call
  --  symbol-interpreter defines arts
* GVars
* Feature Prop (Typed GVars)
* Feature Methods
* Feature Method Args (Typed GVars)

ISSUES
* There isn't a one-to-one mapping between the
  gsName, the syntax display, and the object typ
  (gsArg type?)
  --  e.g. prop "agent prop:prop"
      e.g. addProp "new prop name:prop"

# refinement -- 2022-0901
PRB Should syntaxHelp use something other than ForChoice?
    It should favor info over input?
# refinement -- 2022-0901
`numeric value` -- shuld be `number`?  `number value`?
What should selected help be?


# NEXT
REV REVIEW KEYWORDS
        <kw-def>       <interpreter>  <cxgsargs> 
`addProp` => WORKS
    --  simplePropName:simplePropName:`new prop name`
         =>  change to `prop name`
        ObjRefSelector uses `prop` for existing
    --  anyPropType:  anyPropType   `pick type`
        =>  `propType`
        ISU selected propType returns help for the 
            propType, including input help
            But it should be propType selection help
            --  Instructions are using gsTypeHelp
                gsTypeHelp is (propType, number)
`addFeature` => WORKS
`prop` => WORKS
    --  agentObjRef:  agentObjRef: `agent prop`
        =>  change to `prop`
        =>  objref types are defined in the ObJRefSelector
            --  `select blueprint`
            --  `select prop`
`featProp` => WORKS
    --  featObjRef:   featObjRef:   `feature prop`
        =>  change to `select feature prop`
        =>  objref types are defined in the ObJRefSelector
            --  `select blueprint`
            --  `select feature`
            --  `select feature prop`
`featCall` => WORKS
`ifExpr`=> WORKS
`when` => WORKS
`onEvent` => WORKS
`every` => WORKS
    --  generic number! anyNumber
`propPush` => WORKS
`propPop` => WORKS
`featPropPush` => WORKS
    --  'select feature prop` is used in two places!
        --  ObjRefSelector is correct
        --  But SlotEditor lookup is not
            because 
`featPropPop` => WORKS
`exprPush` => WORKS
`dbgOut` => WORKS
`dbgStack` => WORKS
`dbgContext` => WORKS
`dbgError` => WORKS
`_comment`
    --  not editable
    --  

TYPES OF HELP
  --  define a name (set to a name? name a prop?)
  --  `set` a property to a value
  --  `select` an existing value
  --  

TRY pass keyword + featName + method parent with each
    HELP.ForChoice call?
    --  How much are we duplicating between SlotEdit and ObjRef and EditSYmbol?
TRY What do we need to know?
    * keyword
    * featName
    * currentToken: method vs gvar ?    
TRY Can we fallback from subtype to standard type?
    --  Do we do this in codex?  Or sloteditor?
PRB Help should use class-sm-number's method definitions?  Not the hack in codex-types?
PRB How to display popup centered on panel?

# ai logging -- 2022-0904
* ProjectSelection
* OpenMain, OpenViewer, OpenController, OpenScriptEditor
* SimRun
  --  Reset
  --  Prep Round
  --  Pick Characters
  --  Start
  --  Stop Round

# agent 'u' bug -- 2022-0904
PRB 'u' agent appears
    objref shows "LOAD" and "un"
    --  Actually it's added after
        you click 'featProp`
    --  After you select "Char"
    TRY Where the heck is the 'u'
        coming from?!?
    TRY Why is featObjRef:1170 
        getting a bpName 'u'?
        =>  profef?
        extractokenMeta?

# symbolize rounds -- 2022-0824
* Q for Sri
  --  RoundScripts run under the global agent context.
      We need to symbolize and bundle the global agent, and we need to symbolize and bundle the roundScripts.  
      --  Each round is sort of like a pragma 
          directive in that whenver we run them,
          we retain the current global agent state
          and do not reset the agent with each round.
  --  See `sim-rounds` for broken script
  --  See `wizcore`.WizardTextChagned
      for another example?
  --  See ac-editmgr for how to 
      compile bundles?
  --  See script-compiler.SYmbolizeBlueprint for example of how to open a budnler for blueprint -- use this method to open the global agent bundler?
      
# global agent -- 2022-0905
PRB https://inquirium.slack.com/archives/C01J8G6FRK2/p1659471534738089
    --  We still need it occasionally.
    --  Ideally we don't use the Feature
    --  Does it work from code view?        
PRB Used to be able to add global
    props using round script.
    But with change to REFEREE
    that means we can't add Globals
    --  Do we want to just make the
        global agent accessible by
        everyone?  
        => Can be confusing.
    --  Allow REFEREE to add to global?
        => Too much work!
    --  Allow objrefs in addProp?
        => Confusing!  And edge case
           drives complexity.
    --  `addGlobalProp` keyword?
        => Possible.  A little cleaner!
    TRY Can we even reference global? 
    --  sm-agent registers it as `GlobalAgent`
    --  but code does not like it?
        prefers `global`?
PRB Where should `global` agent be symbolized?
    --  dc-sim-agents?
        --  More of a factory
            no real init
    --  sim-agents?
        --  Maybe in AllAgentsProgram
            Yes it clears global agent!
            Symbolize it there?!
ISU Even if we have a separate GlobalAgent that is always accessible, we still want to access `prop global.xxx`?
TRY agentObjRef is getting the right 
    bundle. and it does exist.
    But it's missing symbols somehow?
TRY ScriptEditor does not run sim-agents
    and AllAgentsProgram?!?
    TRY How DOES it load agents?
    --  UpdateBpEditList does symbolize
    TRY Hack in symbolize for now
        to see if this is the right place
ISU Where should the global agent
    script be stored?  And how does
    ScriptEditor get to it?
    --  If we're just using the
        feat-global, we'd have to
        compile and symbolize all
        blueprints first?  But
        even then that wouldn't 
        symbolize for the global agent?
    --  GlobalAgent should really
        be treated separately?
        So agents can access the global
        props?
    --  Rounds has the same problem.
        If agents need to access round 
        props, rounds needs to be 
        compiled up front?
    --  Where and how should it be
        intialized then?
        How do you add global props?
        --  New `addGlobalProp` keyword?
            =>  That does not help with
                symbolization.  That just
                makes things more 
                complicated.
        --  Defaulit 'global' script?
            =>  All projects have it?
                Then you treat it like
                any other agent?
                except that you can
                access it globally?
        --  The main issue is adding a prop?
            --  REFEREEE isn't well symbolized either
            --  Do it in Round Init?
                =>  That doesn't work on ScriptEditor 
                    app.  RoundInit won't run at all!
                =>  Somehow in ScriptEditor.UpdateBpEditList
                    we need to symbolize REFEREE as well.
        --  Both REFEREE and GLOBAL need a script!
            That way ScriptEditor.UpdateBpEditList can 
            run and symbolize them.
TRY Inject Global Blueprint
    PRB Why is the global prop referenced in
        K_DefefProp not the same global?
    =>  bpDefs defined in 
        `ac-bluepirints.SetBlueprints`
        are just defs.  Instances are created
        later.  And they are not connected.
    PRB When are the defs instantiated?
        `sim-agents.AllAgentsProgram`
        --  InstancesSpec defines which instances
            are going to be created.  But we
            never spec GlobalAgent, so it isn't
            created!
    TRY Force creation during AllAgentsProgram?
        PRB `ALL_AGENTS_PROGRAM`
            Called by `mx-sim-control.SimPlaces`
            --  SimPlaces is called by 
                `mx-sim-control.DoSimReset`
        PRB ac-blueprints.ResetAndCompile
            already compiles GlobalAgent.
            So it should be in the bundle already?
        PRB Do we need to create a globalAgent
            instance?
            --  How is sim-rounds doing it?
                REFEREE is a SM_Agent instance
                created by global.js
# global -- 2022-0910
* Fix use of ASSETDIR
* Convert 'GlobalAgent' to 'global' for consistency?    
* Is it still necessary to inject it in agentObjRef?                
* interpreter.agentObjRef
  --  don't interpret `prop foo` as error?
  =>  Won't do.
* decomp:805:   //exprPush {{ global.getProp('energyReleasedAsHeat').value }}

# video -- 2022-0911
* setBoundary is the size of the sim playfield
  set by the project.
PRB Challenges with React Function Method
    --  useEffect -- run only once!
    --  how to handle input updates
    --  how to maintain the var context without state?
# video -- 2022-0912
PRB Initial load api-render calculates the world at 512x512
    and sets the initial scale that way.
    api-render.SetBoundary to 800x400 is then called
    and a new scale factor is established, BUT the new scale
    factor does not get passed to WebCam.
PRB Video player should be inited only once
    And only after component is mounted
    --  Still need to handle size updates
        though we could hook resize.
    --  `loop` runs continuously, copying frames
        it needs access to the current variables?
    --  Once the listeners are set, they can keep going
        the problem is that `loop` vars need to be 
        reading the current values.  So we need 
        to use closures for that?
    REQ * Always be centered vertically and horizontally
        * Default 1/1 scale fills parent
        * When parent is resized, you're also resized
        * Can pass either a scale value or a width/height
          or both
        * Store/load default values
          --  Can be done within the component?
PRB After load locales, the meters need to be set
    --  We can't use defaultValues for that b/c they've
        already been set.
    --  Do we want to hack in value setting?
    --  Or is it better to go with controlled values?
        And if that's the case, then how do we handle state?
PRB Save locales
    --  See PanelTracker
    --  See ac-locales
    =>  Maybe save as project data instead?
        --  Have to save whether video is on or off
        --  Transforms will change based on world size.
    --  scaleX is a state variable, but inside of `loop`
        it isn't the current state.  It is the value of scaleX
        when `loop` was defined. 
        --  Shouldn't the whole function (WebCam) be running
            on every frame / update?
            So we don't need the setTimeout?
            we canjust run the whole sequence right before render?
    --  Video update is really slow?  Need to increase the render frequency?
PRB Enable/disable webcam
    --  Ideally we do it before metadata is loadeD?
        Or do we only create the stream after load?
    --  UI to toggle webcam?
# webcam -- 2022-0914
    --  vid once off, cannot be re-enabled
    --  save `metadata` as state instead of individual values?
        --  add sub object `videoxform`?
    --  Are the `play` and `loadmetadata` listeners really necessary?
    --  Maybe `loop` needs to be defined such that we pass state to it?
        (assuming that's even possible?)
PRB
    =>  Auto-save settings after 1 second!!!!
PRB Reset alphas after toggling webcam
    --  Key Call: 
        `window.resize`
        `PanelSim.setBoundary`
        `api-render.SetBoundary`
    --  But the webcam toggle call is...
        `Main.WEBCAM_UPDATE`
        `PanelSim.updateWebCamSetting`
        `api-render.SetGlboalConfig`
    --  So we should be able to just trigger set boundary?
Video
    --  switching webcam on/off does
        not cause a RENDERER redraw, so 
        the backgorund remains alpha'd.
        Resizing will trigger the redraw.        
PRB drawWidth/DrawHeight is changing.
    --  glitchy from transfmedVideo/
PRB Glitchy Video
    --  Seems to be caused by multiple streams?
        turning streams on and off repeatedly?
PRB Agent selection/mouseover is broken
    --  global branch drag works
    --  webcam 10:55a works
    --  webcam 11:01 works
    --  webcam 11:21 works
    =>  1:46p stillw roks
        --  Changes to PanelSimulation are OK
        --  Changes to ac-metadata are OK
    --  1:47 doesn't work!?!
    --  2:43 breaks?
TRY AGAIN
    --  1:46 broken!?!
    --  11:21 works
    --  Yes, 1:46 broken
TRY 1:46 one by one
    --  ac-metadata METADATA_LOAD to WEBCAM_UPDATE OK
    --  panel simulation
        --  add ACMetadata => OK
        --  Add updateWebCamSetting => OK
        =>  Add WEBCAM_UPDATE -> updateWebCamSetting
TRY Must be the SetGlobalConfig command?
PRB video offset by 10?        
    main deiv needs to be absolute?
PRB Initial scale value is 1.7, but
    it should be about 1.1/1.2
    Something is being set too late?!?
* Save values in locale?
* show values?
PRB     --  Why is script-setting alpha for background
        sprites not working but intScript is working?
    
# add broke -- 2022-0916
PRB Call Order
    --  `PanelBlueprints.OnBlueprintClick`
    --  `LOCAL:INSTANCE_ADD`
    --  `project-server.InstanceAdd`
    --  `RaiseModelUpdate`
    --  `UPDATE_MODEL`
    PRB Instance turns to `global`
TRY Revert global change -- does it work?
    --  Already broken in global!!!
    --  `feature-help` -- works 9/5
        12:56p
        73f09222c0b59974e4203b41a5d2f197f9462a1d
    --  `rounds` -- works 9/7 9:20p 
        3614624da17188c1bd4453b43c9053d94543e719
    --  9/9 10:13p 63e087e303d56d97a3be1a686016feef3f9461cd
        --  pre global get uid works
    --  9/9 11:06 uid BROKE!
    --  9/9 11:03 uid
        --  Try with replacing
            ACInstances ref
        =>  Works, but adds a global
            instead of regular
            instance?!?
TRY Why would instance
    be created, but not
    rendered?
    Why would existing SETUP
    list two 'globals'?
TRY Are we not clearing
    instances before AllAgentsProgram?
TRY Why would things work
    fine without global?
    --  Global is created
        automatically?
    Should global be created automatically?
    Should we replace it during AgentsProgram?
    Or during creation insert the bpdef? 
    --  Delete the global instance each 
        AllAgentsProgram?
    --  Need to run exec with AllAgents
        Program because it needs to be reset
    TRY Just duplicate the agent id?
PRB NET:INSPECTOR_UPDATE seems to send full blueprint data?

# Logging -- 2022-0920
PRB PKT_RTLog formatting is all commas?!?!
    17:46:17:0341 pz	id,pz7120,bpid,Fish,x,-0.24572467118948718,y,-0.6027702474130232'


TRY EVENTS
PROJECT
* Create New Project
* Open Project
* Open SimViewer
* Open CharController
PROJECT SETUP: ProjSetup
* Select Setup
* Select Save
* Project Settings Edit
* Project Settings Save
* Edit Round Script
* Save Round Script
* New Blueprint <bpName>
* Add Character
* Edit Blueprint <bpName>
* Edit Instance InitScript
* Save Instance InitScript
* Drag <name> <x> <y>
* Click Character <name> <x> <y>
INSPECT: Inspect
* Show Inspector <name>
* Hide Insepector <name>
RUN SIM: SimEvent
* Prep Round
* Pick Characters
* Start Round
* Stop Round
* Reset Stage
SCRIPT EDIT: ScriptEdit
* Save to Server
* Save Slot <linetext>
* Cancel Save Slot
* Delete Slot <linetext>
* Select Choice <symbol>
SESSION: Session
* Viewer Connect
* CharController Connect
CHARCONTROL: CharCtrl
* CharController Set Number of Entities <num>
* CharController Select Character <bpName>
* Drag <bpName> <entity-id> <x> <y>
POZYX: pz (in RTLog)
* pz id <id> bpid <bpid> x <x> y <y>
PTRACK: pt (in RTLog)
* pt id <id> bpid <bpid> x <x> y <y>
TOUCH: Touch
* Touch agentId <agentId> targetId <targetId> b2b <b2b> binb <binb> c2c <c2c> c2b <c2b> 

NetPacket: 
[
  'data',    'msg',
  'id',      'rmode',
  'type',    'memo',
  'seqnum',  'seqlog',
  's_uaddr', 's_group',
  's_uid'
]

PRB Add "log" button
PRB Why is dipslaylist being logged to regular log?
PRB Why is LogEnabled(true) not registering/logging?!?!

# Bug Fixes 2022-0922
PRB CharController
    "Costume" Error
PRB Touches/Physics
    * Delete agent in SETUP in KyewordTest
      results in "no feature named 'Physics' error
      --  agents not deregistering with deletion

# New Script -- 2022-0923
PRB Ways of Creating New Scripts
    --  Main: (non-SETUP) New Character Type => Opens new Window.  Broken.
    --  ScriptEditor: Add Character Type => WORKS!
    --  ScriptEditor: URL http://localhost/app/scripteditor?project=keywordTest&script= => Broken
PRB New Button Approach
    --  `SelectScript`
PRB Blank URL Approach
    --  
PRB Text centering is off.
    --  For some reason textBounds is calculated wrong until 
        DBGOUT RESET OUTPUT COUNTER to 1000
        dbgOut:18
PRB Physics bug
    --  Now the opposite problem?
        If click on the instance in bp list,
PRB New Character script
    is blank
PRB Test Pozyx Tags!!!
    --  Why is only 7120 working?
    --  Why are the updates so infrequent?
        --  Review raw stream?

# QA -- 2022-0926

PRB `featCall Population createAgent xxx [[block]]`?!?
    --  Why is block appearing?
    --  And why is it invalid?
PRB Why does pozyx take 10 secs to appear?
    --  Partly b/c mqtt server takes forever to start up.
    =>  REVIEW: But why aren't entities forwarded immediately?
        Are we queuing up some number of entities before displaying them?
    
# Graphing -- 2022-1001

PRB Use graphValue.min/max to set graph?
    =>  No, that's the value being graphed, AND graphs might use graphProp.
TRY Set it explicitly

# Boolean -- 2022-1003

PRB How toset boolean to false (not undefined)
    ac-editmrg.UpdateSlot is the call
    * How to set it initially?
    * 

# NEXT

PRB After Send to SErver in code mode, editor returns to script selector

QA  Test Scripting        


Global
* Make sure GlobalAgent is not added to InstancesList
* Make sure all keywords can access global

* PanelSimulation is UR/LOAD_ASSETS
  being loaded twice?
  

`LOAD` appears as an agent sometimes?!?!
--  On creating a new character type?

_comment / note

ISSUE
  * change existing line `prop Char.scale` to `addProp xxx`
    xxx refuses to be set as an identifier?!?
ISSUE
  * SelectedChoice help should be empty if nothing is selected?
  
ObjRefSElector help should show last selected item.

Boolean 'true' method screws up the UI

Need to differentiate between comparators/gets and setters?



# NEXT (after HELP)

* Save Cancel
  --  Add a "Don't Save" button?

      --  
          

* Defining global properties in rounds

# How to deal with extra parms

# NEXT
file DevWizard issue

# stream error
LOG Start 9:30am-ish
    Main:         UADDR_05
    ScriptEditor: UADDR_03

# NEXT
GIT Merge Error branch
DES Gracefully handle script fails
    --  How to fix/update without having to reload npm?
    --  Undo?
    --  Saved versions?
    

QA  `prop agent.name` selecting `method` breaks.
    but works with `prop agent.x`  
    =>  `name` should NOT be listed at all as a prop!!!

QA  Test saving
QA  Initial load should not enable Save button


# STATUS
DO  Add Feature object ref insertion (e.g. Costume.costumeName)

PRB validation tokens being returned for "Costume.costumeName"
    appear to be feature oriented (e.g. returns props and methods of the feature), rather than prop oriented (e.g. returns agent and feature props)
    
    culprit might be script-compile.ValidateStatement?
    --  Somehow it is looking at feature instead of prop?


      
# TO DO
* Make sure scripts are encoding quotes properly
* Sri req
  => Revisit 1-based vs 0-based -- is it possible to change
     all refs to be 1-based?
     -- transpiler.ValidateStatement would have to return
        1-based validationTokens
     -- TWO issues:
        1. linePos is 1 based
        2. slotPos is 1 based
        
      
* Discuss error code
  --  e.g. 'prop x setTo' change to 'prop costumeName setTo'
           why is 'setTo' method vague?  it should be OK?
           unless number setTo is different from string setTo?
           

# STATUS




# NEXT

TDO Review ac-instances
    --  WriteState calls
        ..hook_effect
        ..updateAndPublish -- so state is updated twice?!?


QA  --  'project' label edit works
    --  'project' metadata edit works
    --  'bpName' change during script edit
        --  old bp is removed
        --  new bp is added
        --  old instances are removed
    --  'instances' can be added

REVIEW
* How should ac-projects work?
    --  Should it allow loading multiple projects?
    --  e.g. if scriptEditor is requesting a script from a different project?
    --  When you are requesting a different project to load, how should the
        request be structured?  Who holds it?
        Or does ac-project work with any arbitrary project?

TODO
* RESET STAGE doesn't seem to work?
FIX project-server.ScriptUpdate should use SymbolHelper to extra name, 
    not Compile

TODO
* ac-project
  --  Rename 'project' state data to 'projLabel'?  
* ac-blueprints
  --  Remove use of id and label?  And just rely on bndl.name?



TODO
* as-load-projects
  --  getProjectBlueprintsList is using bp id
      --  who calls this?
* script-extraction utilities
  --  can use SymbolHelper class
  --  can reference symbols inside the bundles



# 2023-0208 Debug distanceTo not calculated
Error:  m_FindNearbyCharacters skipping ${agent.blueprint.name} ${agent.id} because distanceTo was not yet calculated by SIM/PHYSICS_UPDATE.
See https://inquirium.slack.com/archives/C01J8G6FRK2/p1675860134324419

PRB Why is m_FindNearbyCharacters being called?
    --  m_FeaturesThinkSeek
        --  m_FeaturesThink < Hook phase SIM/FEATURES_THINK
    
PRB When they touch, finchesSmall is set to seek scientist
PRB Call Order
    --  m_PhysicsUpdate
        m_FeaturesThink
    --  m_FeaturesThink
          m_FeaturesThnkSeek
            m_FindNearybyCharacters
              => ERROR b/c agent.distanceTo not set

PRB When does SEEKING_AGENTS get updated?
    --  At seekNearest call
    --  The problem is that seekNearest is set BETWEEN
        the PHYSICS UPdate nad the THINK

PRB m_FeaturesThink.SEEKING_AGENT is deleting the finch
    b/c the finch's movement type is set to edgeToEdge

SUM m_FeaturesThink is deleting the finch b/c the 
    finche's movementType is `edgeToEdge` during the
    Think phase.
    Setting 


# 2023-0701 Resize Script Editor
# 2023-0701 Edit Comments
* SlotEditor_Block is the main component?
  --  Should coments be treated like "Number" input fields?
      --  There's already a keyword, so don't need to select other keyword?
      --  Add some kind of generic text editor?
  --  Look for id="SEB_slots" in SlotEditor_Block renderer
      --  data is coming from `tokenList`
          which is constructed during the render pass
      --  How is selcting a variable value (token) diff from how comments
          are being selected?
      --  Dump validationTokens?  Where are they being genreated? What do they look like?
          
# 2023-0804 Resize Main
* Hide MESSAGES
    
# 2023-0815 `agent` references
* ScriptEditor => select blueprint 'agent'/'global'
  --  ObjRefSelector_Block
  --  VSDToken.blueprints
      lists `agent` and `global`
      --  Who's adding the list of blueprints?
          --  It's not in bpNamesList in ac-blueprints.
          --  It's being added in VToks?
  --  `character` results in error
      --  error is at `detectTypeError`
      --  script-tokenizer
# 2023-0819 `character`
* project-server.Initialize: SIMCTRL.DoRSimReset() error
  --  context missing 'character'
      --  featCall:54

# 2023-0818 enum options
* keyword types are defined in 
  src/modules/sim/script/vars/class-sm-boolean.ts
* How do we define options?
/Users/loh/dev/gsgo/gs_packages/gem-srv/src/app/pages/components

# 2023-0818 commenting
* Comment types are defined at SharedElements.tsx
  Types include:
    if (label.includes('COMMENT KEY')) classes += ' commentKeyHeader';
    if (label.includes('🔎 WHAT')) classes += ' explanationCommentHeader';
    if (label.includes('🔎 DEFINITION')) classes += ' explanationCommentHeader';
    if (label.includes('🔎 QUESTION')) classes += ' explanationCommentHeader';
    if (label.includes('✏️ LETS')) classes += ' changeCommentHeader';
    if (label.includes('✏️ CHANGE')) classes += ' changeCommentHeader';
    if (label.includes('✏️ HYPOTHESIS')) classes += ' changeCommentHeader';
    if (label.includes('🔎')) classes += ' explanationCommentBody';
    if (label.includes('✏️')) classes += ' changeCommentBody';

# 2023-0820 commenting
* Where to put bookmarks list.
  --  ScritpEditor > ScriptView_Pane

# 2023-0825 commenting styles
* Each comment update needs to update the prefix/body
  --  The initial values need to be set on updates, not on construct
      otherwise the values are fixed?
* Rethink
  --  1. Init: ComponentDidMount
  --  2. OnChange: Handle state update
          -- should update the default
  --  2. Handle Style Select
  --  3. Handle Text Input
  
# 2023-0826 comment cursor position
* Retain cursor position!!!!
  --  with each update, cursor is pushed
      to the end?!?
  --  Do we want to revisit use of input
      handling?  Don't update
      until Save Line?
  --  If we update with 
      --  componentWillMount then selectin
          another line will not update
          body
      --  componentDidUpdate then end
          up in an infinite loop
  --  But the state approach is the 
      how we can maintain the input 
      text position
* Current call order
  --  ProcessCommentInput updates body
  --  componentDidUpdate updates body input
      reverts body to commentTextBody
  --  componentDidUpdate updates body
      gets upated commentTextBody 
* New approach
  --  Shadow defaultText?
      --  And don't update until SaveLine?
      --  Will componentDidUpdate notice?
* slotsState updates
  --  allow updating slots linescript
      but skip updating script_page?
  --  Should slots_linescript update
      with every keystroke?
      ->  Need to do this if we want to
          update the green string view?
      ->  So the hack is to ignore the
          slots_linescript update if 
          we're not updating the 
          whole text?
* uncontrolled means...
  --  we only update defaultText
      if componentDidUpdate with 
      change in slotcore?
      --  otherwise, the key vars
          prefix + body remain
          uncontrolled.
      --  When should they get
          updated?  
          --  when slots_linescript
              changes, but NOT when
              slots_validation changes?
          --  problem is we DO have
              to update slotsLinescript
  --  conditiions
      --  props defaultText changes
      --  prefix changes
      --  body changes
* delesecting a line results in ieeror?
* cannot select an empty comment line
* `_comment` to `//`
  --  script-tokenizer?
  --  GValidationToken.name
      is the conversion!
* SlotEditor_Block instead of using 
  existing vtok to update comment
  we should probably be injecting
  something other than a keyword?
  -- what is happening to slotcore
    with each keyword add?
  --  EditableTokensToScript
  --  What happens when you select a keyword?
* symbolHelp and tokenHelp for comments
  is generic

# Cancel Slot Edit -- 023-0829
* SlotCore.Send state: sel_slotpos -1
  --  

# symbol inteprreter -- 2023-0829
* See `class-symbol-interpreter`
  --  look for where the symbols arereturned
* Extend Class ekyword constructor to include options
  --  keyword constructor
      --  rename the constructor
  --  scrtipt line
      => validation
  --  validation tokens are 
      --  keyword has symbol holder
  --  there is a datacore 
  --  keyword processor
      --  are individual keyword modules
      --  kwp processor]]
  classkeyword
    source is in dc-symbols
      returns an array
    class-symbol-interpreter
      uses to generate symbol data on 296 const symbols = {keywords}
      symbols are rendered direclty
    are we display symbols but generating the token
    ITokens are indentifiers
    modify symbol data coming back?
      --  once you choose something, how does it modify the keyword
    comment line starts with 'coment' not 'identifier'
    SUMMARY
    --  to edit a line, ahve to check if it' scomment or keyword line
    --  line, selected lot is the list of tokens
    --  validation token array is part of appcore
    --  when you make the selection, replace token with something else
    --  TO DO: check when editing the first slot, see if it's  acomment
              make sure it's a comment, not an identifier
              if '//' then convert to comment type
    --  Start with a clean
        --  change to super('//');
        --  look for any use of `_comment` and replace with '//'?

# comment to // -- 2023-0829
* script-to-jsx:48
* script-to-jsx:64
* script-compiler:104
* class-gscript-tokenizer-v2:823
* script-bunder:247
* script-bunder:292
* script-compiler:182

* script-compiler:182
  --  SymbolizeStatement: keyword processor _comment bad
  =>  dc-sim-data:217
  
* script-bunder:292

* ScriptViewWiz_Block
  --  script page lines should return valid vtokens using _comment?
      --  Where are the key interactions?
          --  SlotEditor keyword selector: //
          --  SlotEditor slot line editor: //
          --  ScriptView wiz : _comment
* ScriptView
  --  vTokens does use `{comment: 'xxx'}`
      --  So why is it invalid?
          --  It's coming from script_page_validation.validationTokens
              Where are those created?
          --  script_page is coming from props
          --  script_page comes from WIZCORE
              --  TRANSPILER.ScriptToLines.vmPage
              --  from transpiler-v2
              --  from script-to-lines.ScriptToLines
              --  from LINER.scriptToLines
              --  from LINDER.mapLinesToTokens
      =>  gscript-tokaneize-v2.IsValidToken/
          --  Found types is in UnpackToken
  =>  KEY IS class-gescript-tokenizer-v2.KeywordFromToken Call!!!!!!!!!!!!!!!!!!
      
# Define custom fields -- 2023-0830
* How to load
  --  Styles need to be loaded to ScriptEditor
      so does that mean we don't have access
      to dc-project?  Or would the project
      load from there?
  --  Should we have an ACCommentStyle module?
      that handles loading project data as
      part of meta info?
  --  asset-mgr is the main loader
      --  we support 'sprites', 'sounds', and 'projects'
          Do we need to add a new type?
          'yaml'?
          A special project file?  (probably not good)
      --  Can we get a list of all assets?
          asset-mgr.PromiseLoadAssets is already
          a typed list.
          --  AssetLoader.PromiseManifest(route)
              grabs everything then?
          --  manifest does list yaml
      --  asset type is in ur-constants  
  * Key Files
      --  ur-constants => asset tyle
      --  manifest.js => f_Projectassets filters project
      --  class-aset-loader.PromiseManifest
          does NOT include the comment file??!
      --  manifest.DelvierManifest
  * How are projects loaded?
    --  ac-projects.LoadProjectFromAsset?
        dc-project.ProjectFileLoadFromAsset()
        asset-mgr.GetLoader
        PROJECT_LOADER
  * How is Yaml loaded?
    --  NEXT: How to load yaml?
        
  * KEY POINTS
    --  `manifest.js` req `npm run bootstrap`
        before the code will update
    --  `projects` is set by asset directory
        so we can't use as-load-settings to load
        the project as aseparate loader.
        It needs to be part of the project loader
    --  `.gemprj` is being loaded from `

# comment styles -- 2023-0831
* Styles are loaded from SlotEditor_CommentBlock
  --  When should it update?
      When CommentBlock is constructed?
      When CommentBlock is initialized?
      When and if does it change?
      Should we support change over time?
  --  ScriptEditor already loads bplist when
      project loads.  That seems like a natural
      place?
      --  But where does COmmentBlock load?
          from parent?
          
# comment styles -- 2023-0901
* AddStyles is somehow adding ALL preferences?
  --  it becasue we're combingin them?
* How to load project settings data?
  --  Use UR.CallMessage('NET:REQ_PROJDATA', {
  --  Use model of ScriptEditor
      but load it elsewhere
  [X] Add a method in project-server to 
      handle project settings data request
  [X] Call it "Settings" instead of 
      "ProjectSEttings"?  "Preferences"?
      "Templates"? "Options"? "Config"?
      because it's not project-dependent.
  [X] ScriptEditor should request the project
      data somewhere/somehow
  [X] ScriptEditor can then update the
      bookmark list with the items
  [X] Add a .yaml loader that converts to json
  [X] Replace color/background color
      
# line selection -- 2023-0904
* Call Order
  --  `handleWizUpdate` triggers bookmark
      So the scroll event should be handled
      by handleWizUpdate? With the actual
      scroll called before the render?
* Problem
  --  Clicking on the bookmark menu changes
      state, so it triggers a render
      even though the first click should 
      just be to open the menu?
  --  DispatchClick fires before
      OnBookmarkSelect, so we can't even 
      ignore the click!

# fix bg name change -- 2023-0905
* bug
  --  ac-editmgr;470.SaveSlotLineScript
      --  nscript has the new bpname
      --  ScriptView_Pane.handleWizUpdate:302
          chokes on the name?
      --  vmStateEvent has curr_bpid
          and old_bpid identified.
      --  Error is happening before intercept 
          state and after SaveToServer
  --  class-symbol-interpreter:1132
      ->  bpName is referring to the old bpName
          where is it being read from?

# agent2char -- 2023-0906
* class-expr-evaluator
  --  ifExpr:28
  --  class-sm-agent:493, 480, 514
  --  Expression evaluator is trying to
      find agent Objref in expression.
      ==  Does it work outside of expression?
      =>  It works!!
          agent.getProp('trackerId').value !=  Player.getProp('trackerId').value
      =>  this doens't work
          {{ character.getProp('trackerId').value !=  Player.getProp('trackerId').value }}
  --  138, 77, 121, 64, 83, 68
      --  138: Main Evaluate fn
      --  77: evaluate Binary Expression
          --  Probably for `when`
      --  121: 'Member Expression'
          --  64: 'evaluateMember
      --  83: 'CallExpression'

# TO DO  
  [ ] class-expr-evaluator we can hack
      evaluateMember to convert the
      'character' to an 'agent'
      -- this is probably a terrible hack
         but it points to where the problem
         and possible solution might be?

  [ ] ac-settings needs to load CHELPER?
      --  Or can we just stuff it into CHELPER?
  
  
NEXT
* Handle 4x WIZCORE state updates per ScriptView_Pane render
* SharedElements.GValidationToken has J&M comment style injections -- should be moved into CHELPER?



-----------------------------------------------------
-----------------------------------------------------

# SHORTCUTS

## Code Folding
CMD-K CMD-0   - unfold all
CMD-K CMD-1   - fold all to level 1
CMD-OPT-]   - unfolde recursively from cursor ?
CMD-OPT-[   - fold recursively from cursor ?




