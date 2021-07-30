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

## JUL 21 WED - Debugging Recursive Compile

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
* [x] gscript-tokenizer updated to return fully tokenized text

* [ ] there is a problem with NESTED SCRIPT BLOCKS being textified

## JUL 22 THU - Debugging ScriptifyText

```
script = [
  [ // statement 00
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    [ // conseq1
      [ // statement 1a
        { 'token': 'prop' },
        { 'token': 'C' },
        { 'token': 'set' },
        { 'value': 10 }
      ], 
      [ // statement 1b
        { 'token': 'ifExpr' },
        { 'expr': 'C' },
        [ // conseq2
          [ /** ERROR extra open ************************/
            [ // statement 2a
              { 'token': 'prop' },
              { 'token': 'D' },
              { 'token': 'add' },
              { 'value': 1 }
            ], // end 2a
            [ // statement 2b
              { 'token': 'ifExpr' },
              { 'expr': 'Z' }, 
              [ // conseq3
                [ /** ERROR extra open ******************/
                  [ // statement 3a
                    { 'token': 'prop' }, 
                    { 'expr': 'Z' }
                  ] // end 3a
                ] /** ERROR extra close *****************/
              ] // end conseq3
            ] // end 2b
          ] /** ERROR extra close ***********************/
        ] // end conseq2
      ] // end 1b
    ] // end conseq1
  ] // end 00
];
```

It looks like the code that produces the **consequent** in the block read is doing an extra wrap around the block.

in `gobbleMultiblock()` I removed the array wrap from`return [ scriptunits ];`

```
[ // program
  [ // statement1
    { 'token': 'when' },
    { 'token': 'A' },
    { 'token': 'touches' },
    { 'token': 'B' },
    [ // conseq is arr of statements
    /** missing statement [ ***************************/
    	{ 'token': 'prop' }, 
    	{ 'token': 'C' }, 
    	{ 'token': 'set' }, 
    	{ 'value': 10 }
    /** missing statement ] ***************************/
    ], /** premature end conseq ***********************/
    [ 
      { 'token': 'ifExpr' },
      { 'expr': 'C' },
      [
        [
          { 'token': 'prop' },
          { 'token': 'D' },
          { 'token': 'add' },
          { 'value': 1 }
        ],
        [
          { 'token': 'ifExpr' },
          { 'expr': 'Z' },
          [
          	[
          		{ 'token': 'prop' }, 
          		{ 'expr': 'Z' }
          	]
          ]
        ]
      ]
    ]
  ]
];
```

So that wasn't it.

I think the issue is that the **multiline parse is breaking across line boundaries**, so the statements are nested incorrectly. That's because it goes LINE-BY-LINE.

```
when A touches B [[
  prop C set 10       <---
  ifExpr {{ C }} [[
    prop D add 1
    ifExpr {{ Z }} [[
      prop {{ Z }}
    ]]
  ]]
]]
---------------------
process block line 1: 'prop C set 10'
	unit = [{prop}{C}{set}{10}]
	statements.push(unit);
process block line 2: 'ifExpr {{ C }} [['
	gobbleToken {ifExpr}{C} [[
		gobbleBlock() EOL ... so 
			gobbleMultiBlock()
		  	process block line 3: 'prop {{ D }} add 1`
					unit = [{prop}{D}{add}{1}]
					statements.push(unit)
				process block line 4: 'ifExpr {{ Z }} [[`
					gobbleToken {ifExpr}{Z} [[
						gobbleBlock() EOL ... so 
							gobbleMultiBlock()
								process block line 5: 'prop {{ Z }}'
									gobbleToken {prop}{Z}
							-return [[{prop}{Z}]]
						-[[{prop}{Z}]]
					- return {ifExpr}{Z}[[{prop}{Z}]]
				- return [{ifExpr}{Z}[[{prop}{Z}]]]
			- return [ [prop D add 1], [[{ifExpr}{Z}[[{prop}{Z}]]] ]
I WONDER if this is the issue...when returning the nesting it is one extra				
```

There is something **wrapping** the consequent?

Simpler version:

```
when [[
  prop A
  ifExpr [[
    prop D
  ]]
]]

script = [
  [ // statement
    { 'token': 'when' },
    [ // block
      [ // block statement
        { 'token': 'prop' }, 
        { 'token': 'A' }
      ],
      [ // block statement
        { 'token': 'ifExpr' },
        [ // block
          [ // block statement
            [ /*** ERROR *** spurious [ ***/
              { 'token': 'prop' }, 
              { 'token': 'D' }
            ] /*** ERROR *** spurious ] ***/
          ]
        ]
      ]
    ]
  ]
]


```

Maybe we have to spread the statement

```

script = [
  [ // statement
    { 'token': 'when' },
    [ // block
    /** missing [ **/
      { 'token': 'prop' },
      { 'token': 'A' }
    /** missing ] **/
    ],
    [ //
      { 'token': 'ifExpr' }, 
      [
        [
          { 'token': 'prop' }, 
          { 'token': 'D' }
        ]
      ]
    ]
  ]
];
```

So it seems to hinge around `statement`

### There is still a bug

```
fail nblock variations, pass block + ifExpr
WRAPPED nblockFail = 
[
  [
    { 'token': 'when' },
OK  [
OK    [ { 'token': 'prop' }, { 'token': 'A' } ],
OK    [
        { 'token': 'ifExpr' },
        [
          [  **** ERROR EXTRA WRAP
            [ { 'token': 'prop' }, { 'token': 'D' } ]
          ]  **** ERROR EXTRA WRAP
        ]
      ]
    ]
  ]
];

fail everything
NOWRAPPED const nblockFail = 
[
  [
    *** MISSING [
    { 'token': 'when' },
    [
      *** MISSING WRAP
      { 'token': 'prop' }, { 'token': 'A' }
    ] *** MISSING WRAP
    [
      *** MISSING WRAP
      { 'token': 'ifExpr' },
OK    [ 
        [ { 'token': 'prop' }, { 'token': 'D' } ]
      ]
      *** MISSING WRAP
    ]
    *** MISSING ]
  ]
];
```



```
statements = [[ u ]]
if (sl === 1 && Array.isArray(tarr) && typeof u === 'object')
```

## JUL 23 FRI - CompileScript

* [ ] The `moth` script doesn't run, but maybe that is OK because **blueprint** isn't set
* [ ] **comment** tokens are mysteriously not delivered as statements. Maybe build the line debugger in
  * the bug 
* [x] convert arrays back to program blocks...it all seems to work
* [x] update `scriptify-text` checks

### Debugging Comment Blocks

The issue appears to be when a comment is captured **inside a multiblock**

```
  gobbleComment() {
    const eol = this.line.length;
    const comment = this.line.substring(2, eol).trim();
    // this.loadLine();
    return [{ comment }]; // comments comment keyword
  }
```

A comment is being returned as a statement because comments are whole-line only.

I think the issue is happening when a multiblock returns a multiblock. It's pushing the result of the multiblock onto the stack.

```
a=[] sa=[]
multiblock gobbleToken ...
  b=[] sb=[]
  multiblock gobbleTokengobbleb.push([{comment}])
  b=[ [{comment}] ];
  ]] sb.push(b) sb = [ [ [{comment}] ] ];
  return [ [ [{comment}] ] ];
  
```

**The BUG** with **COMMENTS** was that comment tokens SHOULD NOT assume that it is returning a complete line as in `[ { comment }]` in `gobbleComment()`. There is a second comment returner that checks for `COMMENT_1` in `gobbleLine()` and this returns `gobbleComment()` directly

* [x] can we remove the line test and have it still work? YES
* [x] we need to detect blank lines generated by TextifyScript, when there is an empty line inside of a multiblock. 
* [x] add better difference hilighting

## JUL 24 SAT - Updating Transpiler-v2

Going through CompileBlueprint and other code.

**NOTE** The `_pragma` signalling is rather convoluted because how `#` is swiched to `_pragma` and `TScriptUnit`  so it can do this:

```js
if (stm[0] === '#') {
      objcode = CompileStatement([{ directive: '#' }, ...stm.slice(1)]);
```

The way that PRAGMA works is interesting.

* When a pragma is executed, it looks up a particular SMC function that will be returned depending on the kind of directive. The SMC function is used to initalize stuff in the compiler at compile time. It's not used f

## JUL 25 SUN - Checking Nested When Blocks

> Issue is that nested blocks in WHEN are not renderable as JSX because  the SCriptUNits of the block are not accessible as scriptunits, but as  already-compiled code functions. We want the WIZARD view to show those as  editable blocks that are also nested appropriately.

## JUL 28 WED - Designing the Asset Manager

The design is in [architecture/urfile](01-architecture/01-urfile.md). This is the complete design, more or less, in draft form. 

## JUL 29 THU - Where to start with the asset manager.

The essential function is to load an asset manifest from a directory. So the initial feature list:

* [ ] look at the asset manager right now and outline it a bit. It's in `class-pixi-asset-mgr.ts`



