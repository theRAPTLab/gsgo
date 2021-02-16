## if clauses

currently we have:

* `ifExpr {{ }} `
* `if [[ prop x lt 15 ]] [[ ... ]] `

Let's fix `ifExpr` first

* [x] In `agent.exec()`, the check for object no longer holds true for expressions, which are now wrapped in an Argument Node
* [x] Update `agent.exec()` to check for `m.expr` and pass that to the `exec_ast()` method