# Wizard GUI

Refactored React components for the Wizard editor GUI.

  Root > Panel > Block > Functional Groups
  * Root styles use grid extents
  * Panels can only be inside of a root, not another panel


The components are (oldname):

  ScriptEditor:root
    ScriptView_Pane:panel       (PanelScript)
      <codejar>                 aka ScriptViewCode_Block
      ScriptViewWiz_Block       (ScriptViewPane)
    ScriptLine_Pane:panel       (ScriptEditPane)
      SlotEditor_Block          (SelectEditorSlots)
        SlotEditorSelect_Block  (SelectEditor)

