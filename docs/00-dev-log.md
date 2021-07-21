[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.
* W2: Locale system design

**SUMMARY S2112 JUN 14 - JUN 27**

* W1: Mini Rounds Discussion. URDB+GraphQL+Loki design
* W2: Matrix Math Review. Data structures for Locale.

**SUMMARY S2113 JUN 28 - JUL 11**

*  W1: Pozyx review, GraphQL client, State Change Proto
* W2: Appstate-React, AppCore definition and conventions

**SUMMARY S2114 JUL 12 - JUL 25**

* W1: Refine AppCore conventions, document, debug
* W2: ScriptEngine Confirmation of ScriptUnit paths

---

## JUL 12 MON - Review With Ben

* color modulation for #157
* script editor needs to handle blocks
* how to formalize how to handle image assets #236
* the date: 
  * **August 2nd** (Vanderbilt, IU) - (MOTHS)
  * full pilot for IU **August 9** , soft pilot: IU **September** (FISH, ALGAE)
* make a module import document for Ben
* look at merge requests since 113 to get an idea
* Vanderbilt: candidate script is moths-sandbox branch

## JUL 13 TUE - Bug Fixes

* [ ] make sure that database is loading correct data on start

The issue is that when the localeID changes, we need to do several things:

1. set state.localeID
2. load ptrack data into state.transfor

```
agents
features
globals
inputs
interactions
named-methods
project
render
script-bundle
script-engine
sim
varprops
```

## JUL 14-15 - Bug Fixes Continued

The StateGroupMgr needed some refinements and best practices refined, but it appears to work now.

* appcore modules are allowed to mutate its state directly, but it is then responsible for sending the correct updates
* updateKey does **NOT** automatically use the change and effect hooks, nor does it notify. That functionality is provided only as part of the static class methods; it's up to the module to implementing the behind-the-scenes state management related to database loads and inter-related data.
* updated section in [modularity docs](01-architecture/02-modularity.md)

Everything SEEMS to work. Let's give it a try.

## JUL 19 MON - Script Engine Review

There is an issue with the SCRIPT WIZARD being **unable to render block scriptunits**. So I need to make sure ScriptUnit formats are as they seem.

## JUL 20 TUE - Script Engine Point-by-Point

**Q. Does TextifyScript produce an all-scriptUnit output?**
A. The actual conversion code is in `class-gscript-tokenizer` which only tokenizes the top level.

**Q. How to change gscript-tokenizer to fully recurse?**

```
tokenize is the top level, calls gobbleLine, which returns an array of "nodes" which are our token data type.

gobbleLine starts with gobbleToken
it checks first for our GEMSCRIPT additions:
[[ as the opening for a BLOCK
{{ as the opening for expressions

gobbleBlock tests for inline [[ ]] and returns { program } token
However, if the line ends without seeing ]], gobbleMultiBlock runs.

gobbleMultiBlock keeps track of levels to ultimately returns everything between the top [[ ]], and leaves the expansion to transpiler.r_ExpandArgs, which recursively calls itself through r_CompileUnit.
```

The contents of a block token are lines of text; the processing of these lines is deferred to `TRANSPILER.CompileScript()` via `r__CompileUnit` which calls `r_ExpandArgs` which calls `r_CompileUnit` for each line a `{ block }` token.

**Q. How do we change gScriptTokenizer to fully tokenize?**

* [x] first modify the tokenizer to call gobbleLine after the complete block is captured?
* [x] it actually is not re-entrant because of the way the class instance handles the character and line indicator. Rather than rewrite it, it was easier to do a recursive pass on the resulting scriptunit array

**Q. Now that the script is completely tokenizing, what changes in the compiler?**

```
r_CompileUnit() processing a single scriptunit array, and returns a TSMCProgram aka TOpcode[]

the unit is first "expanded"
```

## JUL 21 WEDNESDAY - Debugging Recursive Compile

There's a problem with **nblock** test:

```
B touch B [[
  prop C set 10
  if C gt 0 [[
    prop D add 1
  ]]
]]
```

Line 4, nested block of nested block, is **not tokenized**. This also affects **nblockblock** test.

This means there's a bug in my recursion logic. Let's pseudocode this

```
lines = text.split(`n`);
lines forEach line
	tokens = tokenizeLine
	
tokenizeLine is GScriptTokenizer...so this is the broken thing
```

The **key issues** is there are **TWO PARTS** to fix at the same time:

* either the tokenizer has to recursively tokenize OR
* the scriptifier has to do the recursion pass

The correct way to do this would be to fix the parser so 'block' is never returned anymore. 

So let's look at the tokenizer again to assess it for **recursion**

```
A [[  gobbleLine() - 
 B [[
   C
 ]]
 D
]]
```



```
[ A, [ B, [ C ], D ]
```

