PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S2101 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S2102 JAN 25 - FEB 07**

* W1: Parse dotted object ref, expand args. Add keywords `prop`, `featProp`, `featCall` touse dotted object refs. Need to insert context into runtime in three or four places.
* W2: inject correct context for runtime.

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2: Start implementing device routing and skeleton input system 

**SUMMARY S2106 MAR 22 - APR 04**

* W1: start client registration, DifferenceCache
* W2: CharControl, UDevice + DeviceSync start

**SUMMARY  S2107 APR 05 - APR 18**

* W1: CharControl, DeviceSub, Directory, Data Structure documentation
* W2: Device Define/Publish, Subscribe/Read Complete DR01!

**SUMMARY S2108 APR 19 - MAY 02**

* W1: GetInput API, DiffCache Buffer Mode
* W2: Notification, start break.

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: 

---

# SPRINT 2110 / MAY 17 - MAY 30

Our current priorities

* Tinting Feature
* Spawning Feature

* Script Wizard UI

* Line Graph Widget
* Differentiated render view
* PTrack cursor
* Creation/Spawning

* Sim on Server
* Multihost URNET
* How to measure socket backpressure

What Ben has in mind: Ben is going to continue refactor of project data, which is going along prety well. THen intent is to get some coverage for some other script features they need. He wants coverage of those script features first before going into GUI Script.

**Input System and PTrack System -**

Maybe I can write out architectural sketches:

* PTrack Sketchout

## May 21 Friday - Debugging ifExpr

This crashes the transpiler:

```
when Bee touches Bee [[
  ifExpr {{ true }} [[
    dbgOut 'true'
  ]] [[
    dbgOut 'false'
  ]]
]]

```

The culprit is the **second block** in the nested expression. The parser isn't handling this correctly and reporting `unexpected [` 

To me that suggests that the first block is parsed but it's not handling the chain correctly in the recursive call. 

Tweak debugging tools to remove the React cruft, importing the test module into SystemInit. It appears to be happening on `gobbleLine()` which is probably part of the block parse.

* [x] how many places is `gobbleLine` called? only in `tokenize()`
* [x] `gobbleLine --> gobbleParts --> gobbleIdentifier`

This is the pertinent part of gobbleParts 

``` js
  gobbleParts() {
    let ch_i;
    let node = []; // let node;
    ch_i = this.exprICode(this.index);
    if (ch_i === OPAREN_CODE) {
      // is group ( expression )?
      node.push(this.gobbleGroup()); // node = this.gobbleGroup();
    } else {
      node.push(this.gobbleIdentifier()); // node = this.gobbleIdentifier(); // otherwise it's an identifier
    }
    // note: 
```

Can see **`gobbleIdentifier()` ** is being called if the first char it gets is not a `(` which would indicate it's possibly a group as in `call(a,b,c)`. 

Since we're seeing this crash happen at the end of the outside block, I suspect that the logic isn't counting the `]] [[` continuation correctly and is missing the last `]]` 

1. when `[[` is detected, call `gobbleBlock()`
2. if there is a closing `]]` on the same line, it's a program name reference, otherwise if no closing `]]` was detected on this line it's a **multiblock** and `gobbleMultiBlock()` is called. Note that everything following the opening `[[ ` is discarded!

```
ALGORITMS
when we enter multiblock, we are already one level deep from starting [[, so 
lines until we find a closing ]]

PATTERNS
[[    add level, add '[[' to strbuf
]]    subtrack level
        if level still > 0, add ']]' to strbuf
        if level === 0, increment to next char
        always increment to next char 
 
 at the end of the line, if the strbuf has charaters push it into our block
 after all lines processed, make sure level is 0, otherwise there was an
 unclosed block
```

* [x] add showCursor()... it looks like the case `]] [[` isn't being detected, and the opening `[[` is lost. 

>  It looks like there's a **bug** in my logic; it's skipping the second part and miscounting due to the level logic...I think.

## MAY 25 - FIXING ISSUE 196

free writing mode...

What seems to happen is the parsing of the initial `]] [[` stops after the closing brackets because the level calculation is subtracted but never re-added.

CHANGES
* [X] remind myself that the point of multiblock is to capture LINES AS IS for recursive procesing
* [X] LINE PROCESSOR: add some more careful conditional checking using IF-ELSE rather than IF with breaks, as this causes lines to stop processing prematurely
* [x] LINE PROCESSOR: remove the 'level > 0' check, because we want to actually process all chars in the line to completion because a `]] [[` sequence will set --level but the next pass will ++level
* [x] TESTING MODULE: rewrite to handle arbitrary tests and compare results to the parser output, so we can catch issues in the future
* [x] PARSER: Change the `{ block }` token to include the wrapping `[[` and `]]`, so they are consistently included. Required change is making TRANSPILER do the unpacking of the outermost `[[ ]]` before recursively parsing the block.
* [x] TRANSPILER: change `r_ExpandArgs()` to do the `[[ ]]` unpacking for block token types.

This is working now at least on the top level, but it is crashing in practice when using `DevCompiler` . This is because the parser parser converts

```
when bee touches bee [[
  ifExpr {{ true }} [[
    dbgOut 'true'
  ]] [[
    dbgOut 'false'
  ]]
]]
```

into this (ignoring the `when` lead-in)

```json
{ token: 'when' },
{ token: 'bee' },
{ token: 'touches' },
{ token: 'bee' },
{ 
  block: [
    "[[",
      "ifExpr {{ true }} [[",
      "dbgOut 'true'", 
    "]] [[", 
      "dbgOut 'false'",
    "]]",
  "]]"
  ]
}
```

During **recursive compilation**, the block text is reconstructed as follows:

```
[[
  ifExpr {{ true }} [[
    dbgOut 'true'
  ]] [[
    dbgOut 'false'
  ]]
]]  
```

While this is valid script text, the stripping of the outermost `[[ ]]` doesn't work, because the **parser doesn't break this into two blocks**

```
	ifExpr {{ true }} [[
    dbgOut 'true'
  ]] [[
    dbgOut 'false'
  ]]
```

should be converted to (I think):

```
	ifExpr {{ true }} 
	[[
    dbgOut 'true'
  ]] 
  [[
    dbgOut 'false'
  ]]
```

Will have to confirm this tomorrow.

## MAY 25-27 - Part II Bug Fix

The main issue was that the multiblock parser has to behave differently when parsing the nested `[[ ]]` than it does with the containing `[[ ]]`.  

HOW DO WE DETECT THIS WITHIN MULTIBOCK?

* when we are processing multiblock, we start at LEVEL 1 and exist when all lines are processed, at which point we expect LEVEL to be 0
* in the case where there are no nested blocks, the level never rises above 1
* when level is > 0 and we get a `[[`, we want to just capture the block line-by-line

Everytime we have an **inter-transition** to level 0, we want to push the current block out and create a new one. These transitions are the "top level block chains". 

