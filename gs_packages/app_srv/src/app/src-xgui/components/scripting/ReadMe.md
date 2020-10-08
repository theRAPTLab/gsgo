# Script Editing Component Hierarchy

The script editing components are nested like this:

```
panels:     AgentPanel
panels:       AgentsList
panels:       AgentEditor             <== data updates cascade from here
scripting:      PropertiesList
scripting:      FeaturesList
scripting:            FilesList
scripting:              FilesListItem
scripting:      EventsList
scripting:      PropertyEditor
scripting:      || FeatureEditor
scripting:      || EventEditor
scripting:            FiltersList
scripting:              FilterEditor
*scripting:                Expression
*scripting:                  SourceSelector
*scripting:                  Expression...
scripting:            ActionsList
scripting:              ActionEditor
*scripting:                Expression
*scripting:                  SourceSelector
*scripting:                  Expression...
```

*scripting = base component


A few notes:
* <AgentEditor> is the originating source for data updates.  It has a handler for DB updates, reading the latest data and passing down props to all other components.
* <Expressions> can be nested.
* <Expression>, <SourceSelector> are used by both the FilterEditor and ActionEditor for display.