[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

**SUMMARY S23 NOV 09 - NOV 22**

* W1: Save/instance agent blueprint, runtime expression evaluation
* W2: Start conditions, start a second gemscript tokenizer for blocks

**SUMMARY S24 NOV 23 - DEC 06**

* W1: handle multiline blocks, agentset and event conditions
* W2: finalize event conditions, delivery, break

**SUMMARY S2025 DEC 07 - DEC 20**

* W1: Port FakeTrack/PTrack into GEMSRV
* W2: Simplify agent prop, method, features for use by non-Sri peeps
* W2.1: Prep for Dec 23 demo, review features with Ben

**SUMMARY S2101 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S2102 JAN 25 - JAN 31**




---

# SPRINT 2102

There are four things to look at:

* [ ] how to do the object dot references
* [ ] adding new `prop`, `do`, and `call` keywords
* [ ] how to set context per program phase
* [ ] how the execution module might look

### Object Dot References

There are two parsers. We want the script tokenizer one, not the expression one. That is `class-gscript-tokenizer`.  This is based on **jsep** that's been changed to scan our script format **line-by-line** returning an array of character-based tokens. There are some problems with the multiblock scanner (see comments for `gscript-tokenizer`)

So what does it handle?

* gemscript extension: directives (#) returns 
* gemscript extension: [[ ]] and {{ }}
* numeric literal `isDigit`
* string literal `isQuote`
* identifiers: `isIdentifier` and not a unary op

## JAN 25 MON - Script Parser Review

I'm looking at `gscript-tokenizer` to see what it's doing. How do I see what it's parsing? Probably need to use the test module.

* go to **Compiler Route** and uncomment **import test-parser**
* test-parser tests both expression and our script-unit compiler. we should split them up
  * test-expr-parser, test-script-parser
  * **ERROR** can't parse dotted identifiers so need to fix that.

The error seems to be coming from gobbleToken() misclassifying the period as the beginning of a numericliteral, called by line 311, which is:

```
    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }
```

On comparison, our script tokenizer actually implements different logic, since it just wants to recognize certain patterns in the text. It doesn't implement `gobbleExpression()` or `gobbleBinaryExpression()`, instead just using a modified `getToken()`!!!

> **BUGFIX** Our version of `gobbleIdentifier()` returns the string. However, `gobbleVariable()` is probably what should be getting called. It turns out that our `gobbleToken()` called `gobbleIdentifier()` instead of `gobbleVariable()` so that fixed it after adjusting the node output to retain the period and afterpart

### ScriptUnits expanded parsing

Now that we have identifiers/variables that can have dots in it, we need to handle this case and somehow tell the compiler what to do with them.

* Transpiler has `ScriptifyText` which converts things to ScriptUnits. This just calls the gscript-tokenizer
* `CompilerScript()` takes ScriptUnits and convert them into a program bundle.
  * compile units by line, adding result to the bundle being built. 
  * The heavy lifting is done by `r_CompileUnit()` which uses `r_ExpandArgs()` to recursively convert our data types into javascript data types.
  * `r_ExpandArgs()` accepts the unit and handles:
    * ARRAYS are assumed to be nested scripttext that must be tokenized, returning as objcode (array of functions)
    * STRINGS are tested for inline `{{ }}`, returning an AST object
    * STRINGS are tested for inline  `[[ ]]` , returning an identifier that is a program name
    * everything else is returned 'as is'

It's important that these values are already converted to native javascript types for speed, as they are bound through closures into the compiled functions. It's up to the specific keyword to be able to handle the argument based on its order in the ScriptUnit.

#### Extending r_ExpandArgs()

We'll use `object` to handle program names and ASTs by adding a special identifier. 

There is some trickiness though...the string type has to detect "unquoted" idenitfiers versus "quoted". I think this means that the script tokenizer needs to return objects somehow? Or we detect it somehow

```gobbleToken
MultiBlock:247 return { block }
Token:337 return { value: arg }
NumericLiteral:398 return { value: number }
StringLiteral:446 return { value: str }
Identifier:474 return { identifier: literals[identifier] }
Identifier:478 return { identifier: }
Variable:511 return { variable: [identifier, dotIdentifier, ... ] }
ExpressionString:544 return { expr: str } // no {{ }}
Block:584 return { '[[ string ]]' } - inline program name

?Comment: return { _comment, cstring }
?Group:525 this might not be used, but it returns a token which is probabaly broken
```

I've converted this to node types as described above, so now it is a matter of adding special processing for these types in the transpiler in `r_ExpandArgs()` for the special cases. 

## JAN 28 THU - Conversion of Transpiler

gscript-tokenizer is now producing an an array of objects that define their type. This makes it a bit harder to read though in the console.

```
token: token string 
objref: parts of an object reference foo.bar
directive: #, array of directive parameters
value: number
comment: string
block: array of strings



```









---

**ADDITIONAL THINGS TO IMPLEMENT**

+ set the skin from a list of assets? - good
+ some way to load/save? - make cheese API to save a file (port)
  + include both templates and instance list
+ simple prop set like nectar count - we have
+ get faketrack integrated into Movement feature
+ spawn list for instancing
+ how to show the selection dropdown for each type
+ Target Content Areas
  + Use Fish/Algae content area to model: x-gemscript (aquatic_blueprints001.gs)
  + If we get done, move to blueprints002.gs (advanced)

* After I get OnTick working as the basic scriptevent in the user event system, will outline what's in the current engine as of today for the team, with an eye toward using this a foundation for introducing how to write simulations with it (a kind of informational and concise primer?) Then afterwards document the most recent things.

**TODO** AFTER ALPHA DEC 1

* **parameter passing** between scripts is kind of ambiguous, because of the number of execution contexts. Need to document all the execution contexts and try to make sense of it.
* no **filter result caching** in place yet
* no real tests implemented yet
* combine test functions into functions table, require that name begins with TEST_AB, TEST_A, or TEST
* the state object needs to have its **context** loaded so this values are available at runtime. How do we insert it before it runs? Maybe 
* provide a better debug output experience
* make sure that Agent blueprint inheritance is implemented
* `queueSequence [[ ]] [[ ]] [[ ]] ...`
* `on TimeElapsed 1000 [[ ... ]]`

**BACKLOG**

```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?
[ ] finalizing coordinate system
[ ] bring back location

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List
[ ] Important formal input mechanisms
[ ] Asset capture 

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc

Conditional When Engine:
[ ] slow...speed it up

Persistant Data
[ ] server?
[ ] assets?
[ ] bundle-based asset management outside of git?
[ ] handle app packaging, asset packing, identitifying groups, students, orgs that it belongs to. 

```

---

