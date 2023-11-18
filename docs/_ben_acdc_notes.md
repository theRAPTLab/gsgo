ac/dc Project API

Key Questions
  * Are projects stored under a single ac - project / dc - project instance ?
  Or are they stored separately in each submodule ? e.g.ac - blueprints keeps
  track of projId at the top level


dc-projects
  PROJECTS
  CURRENT_PROJECT
  CURRENT_PROJECT_ID

  SetProject(projData)
  SetCurrentProject(projData)
  GetProject(projId)
  GetCurrentProject()
  
  UpdateProjectData(projData)
  
  ProjectFileRequestWrite(projId)
  ProjectFileCreateFromTemplate(templateId, newfilename)
  
ac-project
  PROJID
  
  GetProject(projId)
  LoadProjectFromAsset(projId)
  
ac-blueprints
  BPTEXTMAP -- [bpName, [Bndls]]

  GetBlueprint(projId, bpName)
  GetBlueprintBndl(projId, bpName)
  
  SetBlueprints(projId, blueprints)
  InjectBluepritn(projId, blueprintDef)
  UpdateBlueprint(projId, bpName, scriptText)
  DeleteBlueprint(projId, bpName)
  
ac-instances
  INSTANCES

  GetInstances(projId)
  GetInstance(projId, instanceId)
  GetInstanceIdList(projId, currentInstances)
  GetInstanceUID
  EditInstance(projId, instanceId)
  UpdateCurrentInstance(projId, instance)
  SetInstances(projId, instances)
  WriteInstances(projId, instances)
  AddInstance(projId, instance)
  WriteInstance(projId, instance)
  DeleteInstance(projId, instanceId)
  DeleteInstancesByBpname(projId, bpName)
  RenameInstanceBlueprint(projId, oldBpName, newBpName)

dc-sim-resources
  BLUEPRINTS -- bpBndls
