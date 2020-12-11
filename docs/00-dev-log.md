[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**1	SUMMARY S20 SEP 28-OCT 11**

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

**SUMMARY S25 DEC 07 - DEC 20**

* W1:
* W2:


---

# SPRINT 25

**STILL TO IMPLEMENT**

* [x] an agent or agent template that can be created
* [ ] static or faketrack controls

## DEC 08 TUE - Picking Up

Ben's been implementing some kind of scripting UI. I'm trying to remember what to do next. I just **refactored datacore** in anticipation of managing the `INSTANCES` map. This is an array of initializer programs for each agent instance, since they could all be different. These can be null programs too, but this is what we need to maintain a list of instances.

So...how does this work?

* Instances have an initialization program that sets unique starting values. This is produced by the transpiler as the `init` program in TSMCBundle.
* I should change the pragma also for output libraries...done

Freewriting...the instancing operation would look something like this:

* user drags a blueprint into the world
* The blueprint is instanced per usual
* the instance appears in a panel
* clicking an instance allows you to change the name and starting property values. The name is stored in the instance itself

When saving state, we need to save the blueprint, the name, and the initial values. The initial values are a program like `setProp frame 1`, so it's a program array again.

* [x] Define TInstanceMap and TInstance in dc-sim
* [x] `DefineInstance(name,bp,init)`
* [x] Rewrite Transpiler.MakeAgent to use new TInstance class
* [x] Rewrite sim-agents.AgentProgram to define instances then make them

## DEC 09 WED - Adding FakeTrack

The idea is to **port the old one as-is** and see what it does. I forget.

FakeTrack PLAE breakdown

* **game-run.jsx** - loads game-run.css, also LoadAssets does `<FakeTrack controller={MOD_FAKETRACK}/>`
* **FakeTrack.jsx** - this component has state with transformation matrix. Port FakeTrack component, also MOD-faketrack as input-faketrack.js`. 

GOT AS FAR AS REWRITING FAKETRACK DRAG INTERFACE without JQUERY. What a pain in the ass.

Tomorrow we'll try hooking-up the GetInput on the client side to confirm we're getting FakeTrack data

## DEC 10 THU - 2nd Stage FakeTrack...input into client

Where I left off yesterday was just getting FakeTrack to send data. It seems to work. Now I have to remember how to get it into the system.

**Q. Who is handling the PTrack input?**

In `modules/step/ptrack` and `modules/step/lib/*` are the tracker related classes. 

* server-side: `step-ptrack.js`
* client-side: in PLAE, it was `step/input` which is now `lib/input-faketrack` 

client **sender**: FakeTrack calls `{ Initialize } from input-faketrack` which 

**server**: `step-ptrack` has out_DPORT 3030, ptrack socker server, IN_DPORT 2525 is where FakeTrack data is inserted. Data on 2525 is handled by `m_ForwardTrackerData`, which forwards the packet to PTrack sockets. 

client **receiver**: This would be a connection to port 3030, which is handled by `step/lib/class-ptrack` . It looks like `plae-input` is the ported  code 

```
PLAE: game-run.jsx loads mod-tracker which loads step/input, which implements:

// initialize once
INPUT.InitializeTrackerPiecePool({
  count  	 	: COUNT,
  initFunc 	: m_SetTrackerPieceVisual
});

// process the pool
INPUT.UpdateTrackerPieces ( ms, {
  addedFunc      : f_SetVisual,
  lostFunc       : f_ResetVisual
});

// get the valid tracker pieces
m_pieces = INPUT.GetValidTrackerPieces();

// extra stuff
INPUT.ChangeLocation();
INPUT.UI_EnableProcessing();

```

To enable the receiver on Tracker:

* [x] `lib/input-faketrack` is used by `FakeTrack.jsx`
* [x] rename `lib/input-faketrack` to `lib/mod-faketrack-ui`
* [ ] convert `plae-input` into something useful by gemsrv
  * [ ] 
* [ ] in `lib/input-faketrack` 



```
// STEP/INPUT

function m_Initialize ( token, serverAddress ) {
		console.assert(serverAddress,"Must pass ServerAddress?");
	//	Initialize PTRACK
		PTRACK.Initialize(token);
		PTRACK.SetServerDomain(serverAddress);
		PTRACK.Connect();
		m_RegisterInputModule(PTRACK);
	}

// MOD-TRACKER
API.SetHandler('GetInput', function( ms ) {
  function f_SetVisual (p) {
    p.Visual().Show();
    p.Visual().HideLine();
    if (debug) m_SetColorByTrackSource(p);
  }
  function f_ResetVisual (p) {
    p.Visual().HideLine();
    p.Visual().Hide();
  }
  INPUT.UpdateTrackerPieces ( ms, {
    addedFunc      : f_SetVisual,
    lostFunc       : f_ResetVisual
  });
  // update m_pieces array
  m_pieces = INPUT.GetValidTrackerPieces();
});

```

**What should it look like?**

1. Create a WebSocket to 2525 PTRACK SERVER, which also passes FAKETRACK. This should be renamed to just INPUT, because we'll ride all our inputs on this socket. PLAE version is in `mod-tracker`which uses the INPUT module in `step/input`
2. Connect websocket message to `_ProcessFrame()`, which will generate the list of entities. This is located in `step/ptrack`. The PTRACK module is responsible just for keeping up-to-date with the flowing inputs, creating a bunch of entities
3. The `GetInput` lifecycle grabs the list of whatever from the INPUT module. entities. Probably **InputObjects**, the companion to DisplayObjects.

THIS IS HOW PLAE BREAKS DOWN

```
CLIENT SEND
mod-faketrack  	generate faketrack data for injection via 2525

SERVER INPUT HANDLER

step.js 
  step-tracker .... UDP listener, FakeTrack listener, Pozyx listener
										Track Forwarder to subscribers at port 3030

CLIENT RECEIVE
mod-tracker .......	GetInput lifecycle, manages the piece list from INPUT
	step/input ...... TrackerPiecePool for m_inputs (raw entities)
	PIECES	          UpdateTrackerPieces( ms, addf, lossf )
										MapEntities( inputs, ms, addf, lossf )
		step/ptrack	... Connect() to hook messages to ProcessFrame()
		ENTITIES		  	initialize connection to 3030 via PTRACK
										maintain EntityDict m_entities
										ProcessFrame updates entities

```

GEMSTEP REMAPPED PLAE FILES

```
PLAE									GEMSTEP

- sender -
1401-game/faketrack		pages/FakeTrack.jsx
mod-faketrack					app/pages/elements/mod-faketrack-ui

- server -
server/step						urdu, which calls...
step-tracker					server/step-tracker (Start, Stop forwarding)

- subscriber -
1401-games/tracker		pages/Tracker.jsx
mod-tracker						./elements/mod-tracker
assets/modules/step		src/modules/step
input
```

Next up...let's lay-in api-input







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

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List

Runtime:
[ ] Create Agent Template
[ ] Instance Agent Template
[ ] Control

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc
```

---
