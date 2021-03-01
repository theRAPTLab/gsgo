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

**SUMMARY S2102 JAN 25 - FEB 07**

* W1: Parse dotted object ref, expand args. Add keywords `prop`, `featProp`, `featCall` touse dotted object refs. Need to insert context into runtime in three or four places.
* W2: inject correct context for runtime.

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: 


---

# SPRINT 2104 / FEB 22 - MAR 07

## FEB 23 TUE - Multinet and Input Design

Moved discussion of network discovery to `draft-ext-ursys-multinet` in the IU Design google drive folder. The gist is:

* There's a main broker on the Internet that helps URSYS instances find their peers. 

## FEB 24 WED - Input Skeleton

I want to make progress on this infernal input system. It's time to **insert into the startup chain**. From memory, the way it works is:

1. server launches appserver module, which handles compiling and http server
2. server adds a NETINFO webservice on the same domain as the app server
3. client begins URSYS bootstrap
   1. client-exec: adds handler for NET_CONNECT to use the client-netinfo module to grab netinfo from the webservice
   2. client-urnet: triggered in ursys client `NET_CONNECT` hook, calling `URNET_Connect()`
4. client-urnet: The URNET_Connect() call works in **TWO PHASES**
   1. PHASE A: using netinfo to connect to URNET websocket - **opportunity**, and sets the initial message handler to `m_HandleRegistrationMessage()`, since the first message received from the server will be this packet. 
   2. PHASE B: after the registration message is processed by client, the message handler is set to the general message handler `m_HandleMessage()`

#### The Registration Message

The primarily use of the registration message is to deliver the **client uaddr** so the NetPacket class knows where it's sending from. The uaddr is set in `NetPacket.GlobalSetup()`, which is called in `m_HandleRegistrationMessage()` when it is received. **(this doesn't seem very clean)**

```
HELLO - a status string greeting
UADDR - assigned client uaddress 
SERVER_UADDR - uaddress of the server
PEERS - unused
ULOCAL - set if the server is running on localhost
```

UADDR is stored as CLIENT_UADDR under the global `window.URSESSION.CLIENT` object. **(this probably needs reworking)**

#### Built-In URSYS Message Handlers

Currently the URSYS client does not implement any special message handlers, but I can anticipate adding them for things like netlist and state updates

```
- incoming -
NET:UR_NETLIST - netlist update
NET:UR_NETSTATE - shared state update

- outgoing - 
NET:UR_HANDLER_CHANGE - send the current message dict to update
NET:UR_DEVICE_CHANGE - send status about current device props
```

### Cleaning Up Server-Urnet

As I looked for where to insert the new registration handshakes, I became dissatisfied with how URNET has three separate functions:

* URNET socket server setup
* socket connection management
* service handlers
* message routing

The `server-urnet` module now just handles the socket server setup and message routing. Socket list data structure API is moved into datacore, and service handlers are in their own `server-services` modue

## FEB 25 THU - HOTFIX Keyword JSX Rendering

With the change to the unit token format, the JSX rendering in `Compiler.jsx` no longer works. I think that the units just need to be expended before they are rendered, as they are for the compiler.

* [x] `RenderScript()` is the call that does it
* [x] React is crashing with an "object not allowed in component" error, maybe due to unit token objects
* [x] In `RenderScript()`, make sure to call `r_ExpandArgs()` as we do for the compiler to convert tokens literals to literals. It will not touch tokens for objref, expr, program
* [x] Move runtime evaluation helpers from `expr-evaluator` to more appropriate `class-keyword` 

## FEB 26 FRI - Back to Input/Device Management

Made a **diagram** of [URSYS NETWORK STARTUP](https://whimsical.com/urnet-system-8F73tHPWtjt6FHsqkJrMu8) to annotate as I inject new features

## MAR 01 MON - Input/Device Management

Starting BIPHASIC SLEEP schedule. The goal is to **outline plan** in the daytime, and in the evening **write a bunch of code**

### Designing the `devinfo` service

Like `netinfo`, I think I'll provide a "deviceinfo" service to see what services are available on a given server. However, this probably has to be part of the URNET system because a server might not provide a browseable routes. For now we'll call them `ursys devices` or `udevice` 

Thoughty thoughts

* add some kind of **device request** call to URSYS
* add some kind of **device handler** that automatically manages the current device list, and can fire events.
* this automatic management could eventually become the basis for **state sharing**

What is the difference between a UADDR and a UDEVICE?

* UADDR is an address on the URNET message system. The message broker itself is a kind of UDEVICE providing the URNET service on a particular host/port
* Other UDEVICE instances are either sources or consumers of a service, and exist on different server hosts on certain ports.

**QUESTION: what does a `udevice` look like?**

```
CURRENT SERVICES provided by a socket server
PROTOCOL -- DESCRIPTION ------------------------------------------------------
message			The URNET protocol implemented by message brokers
track    		For PTRACK data in normalized coordinates between -1 and 1
						applies to both PTRACK and FAKETRACK. It's a kind of axis input
						with X,Y,Z information
						
NEW SERVICES provided by a socket server
PROTOCOL -- DESCRIPTION ------------------------------------------------------
file        Persistent file saving/loading
db          Persistent database operations
log         Research-related logging
netstate    Network-wide shared state (state server)
simview     Distributing simulation display list
simrun      For submitting/requesting scripts
siminput    Button-like and value-like inputs, using JS name conventions
simcontrol  For controlling the simulation

NOTE: each server provides its own authentication
```

A **udevice** record would consist of:

```
udevice = {
  protocol: message, track, trigger, or number
  uaddr:    the associated uaddr of the device
  uident:   the logical identity of the device (username, group, authkey)
  upass:    identity token with encoded access to roles (returned by server auth)
}
```


So when a client joins URNET, it would request a list of available protocols by initializing a **client-protocol** module by passing a `uident`, or without a `uident` receiving a list of global services open to anyone.

* the `uident` of the connecting client, which it can change at any time. it is an implicit filter.
* when `uident` changes, the **protocol server list** updates. It's assumed to be all part of the app
* the client can then subscribe to a particular service after it provide a `uident` Only the accessible servers will be in the protocol server list
* each **client-side protocol manager** implements the API for the protocol, buffering data until it is requested, providing notification services, and supporting asynchronous API calls for data that can not be buffered or distributed

**QUESTION: What does the Protocol Server List look like???**




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

