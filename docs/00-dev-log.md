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
* W2: multinet design


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

I've written up notes in [ext-ursys-multinet](https://drive.google.com/file/d/1ylyxEJNX1hwEY00DP0LJCkh6i7Yg8pa9/view?usp=sharing) in the `IU Design / GEM-SCRIPT Inquiruim / docs4team drafts` folder.

HIGHLIGHTS from the document:

* There is something new called a **Protocol List** that is provided by the **Protocol Server Manager** to any connecting client providing its `uident`
* A `uident` is the logical identity of the device (username, group, authkey). This is the persistent identity that survives reboots.
* The Protocol List is maintained by the client's ursys module, and **only** lists services that this `uident` can access.
* After URNET connect, the Protocol Server Manager can be called sometime later with the `uident` and a list of services that are required. The call returns a Promise that can be used to initialize once all the services are available.
* If a protocol is available, it's assumed that they are all part of the same URNET and work together seamlessly as one big app! The `uident` has to provide enough information to **cleanly segment** multiple logical networks running on the same physical net. 
* If a protocol server goes **offline**, the PSM will change its state and fire an event. This event can be inspected directly as part of the app state, and be used to fire UI code to disable/hide stuff. When the protocol comes online again, the PSM will automatically reconnect using the current `uident`. 
* When the `uident` changes, it must re-request PSM protocols.

Some special considerations:

* Some protocols may have **limited connections** available (for example, the projector machine)
* Perhaps there is a way to to **blind fire** events to a specific protocol manager when it's not critical that it is available. The projector machine, for example.

The Protocol List contains **`udevice`** entries:
```
udevice = {
  protocol: message, track, trigger, or number
  uaddr:    the associated uaddr of the device
  uident:   the logical identity of the device (username, group, authkey)
  upass:    identity token with encoded access to roles (returned by server auth)
  ustats:   device characteristics (load, connect count, priority, arch)
}
protocols = {
	protocol1: { host, port },
	protocol2: { host, port },
	...
}
```

A **starting list of protocols** looks like this:

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
simdata     For submitting/requesting scripts
siminput    Button-like and value-like inputs, using JS name conventions
simcontrol  For controlling the simulation
video       accept media streams, output media streams
chat        accept chat room functionality, including screen sharing
asset       request a named asset
simrecord   aggregate siminput, simview, and video in one stream for playback

NOTE: each server provides its own authentication
```

See  [ext-ursys-multinet](https://drive.google.com/file/d/1ylyxEJNX1hwEY00DP0LJCkh6i7Yg8pa9/view?usp=sharing) for the **up to date** version

## MAR 02 TUE - Baby steps to Multinet

Ok, here we go with implementation on biphasic sleep day number 1!

### 1. stub-in new phases

I'm not sure exactly how this will get implemented, but as a first throwaway step let me just print something out on the client-side at the right time in the URSYS startup.

* [x] has to execute after `UR/NET_CONNECT`, which is part of `PHASE_CONNECT`
* [x] The current phases are `NET_CONNECT`, `NET_REGISTER`, and `NET_READY`, but I think we're going to redesign these.
* [x] Is anyone using NET_REGISTER or NET_READY...**Nope**! We can rewrite it
* [x] Replace `NET_REGISTER` with `NET_PROTOCOLS`and `NET_DEVICES` for hooking into place to pull initial service list.
* [x] Make new UR client module `client-netprotocols` and `client-netdevices`
  * [x] hook into `UR/NET_PROTOCOLS` and print message
  * [x] hook into `UR/NET_DEVICES` and print message

### 2. new URNET messages design

Phases are used to synchronize operations in an app, but we need to define some new NET:SRV_ messages to handle the protocol list.

* currently we're using the `NET:SRV_*` prefix as a special message prefix that is only implemented by an URSYS message broker server itself.
* With a multi-server architecture, we probably need to expand the prefix system, but we won't worry about it now becausae the `NET:SRV_` prefix is already consistently defined in `ur-common` so it's accepted in both server and client modules

So I think the steps would be something like:

*  implement server-handler for `NET:SRV_PROTOCOLS` that
  * expects a `uident`  that is a hashids-encoded `{ name, class, group, id }` (for students) or `{ name, class, role }` with additional optional `authkey` that is `{ type, keydata }` for a minimal login database. Use the Apache-style authentications types. If no `uident` is provided, then return the public protocol list (e.g. simview)
  * stores the `uident` on the socket so it can be looked-up by the server
  * returns the protocol list as a list of protocol names and server host/port with connection data
  * fires the `NET:SRV_PROTOCOLS` whenever the protocol list changes

When a protocol server comes online, it has to also somehow register its protocol in a central place. Since protocol servers don't use the `netinfo` service that an appserver provides, they need to have some way of discovering the master directory server

*  hardcode to a local address in a `configuration` file in `gsgo` that is accessable by the ursys package. This will be assumed to be named `gem_site_config` and will be in TOML format. We will need a TOML reader
*  The master server is part of all URNET at a reserved uaddr of `SRV_PRIME` 
*  If `SRV_PRIME` as configured is not available, then local discovery could happen with UDP checkin. There are a couple packages to look at:

  * [udp-discovery](https://www.npmjs.com/package/udp-discovery)
  * [microserv](https://www.npmjs.com/package/microserv) is sort of URSYS like?
*  The "Protocol Manager" requests the protocol list via `NET:SRV_PROTOCOLS`, providing a `uident` (if null, then any public services)

## MAR 05 FRI -

RECAP: In (1) I had last **added new net phases** to client-exec, and added `client-netprotocols` and `client-netdevices` to be directory services. There are also **stubs** that handle the new `UR/NET_PROTOCOLS` and `UR/NET_DEVICES` phases defined in new modules `client-netprotocols` and `client-netdevices`

### 3. Stub-in server messages

A bit of reorganization to separate service modules further

* [x] replace `server-services.js` with individual service modules in `ursys/services/` 

* [ ] rename `PhaseMachine.QueueHookFor` to `Hook`

* [ ] add server-side `NET:SRV_PROTOCOLS` 

* [ ] add server-side `NET:SRV_DEVICES`

* [ ] add client-side `NET:SRV_PROTOCOLS` receptor

* [ ] add client-side `NET:SRV_DEVICES` receptor

  




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

