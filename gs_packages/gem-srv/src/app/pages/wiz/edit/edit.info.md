Script "editing mode" components. The root components
loaded by DevWizard are:

* ScriptViewPane - the clickable line token view of the script (left)
* ScriptTextPane - the editable text view of the script (right)
* ScriptEditPane - show supporting info for the current blueprint (right)

TextPane and EditPane currently toggle as a debug switch; Text is not
visible to students normally, but is a developer debug tool.

The EditPane itself contains several subpanels. Some of them
are defined as local component functions; see the source. However,
there are also individual editor components for handling specific
kinds of user input:

* EditNumber
* EditString
* EditObject
* EditSymbol

etc.

