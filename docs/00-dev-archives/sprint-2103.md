[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S21-01 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S22-02 JAN 25 - FEB 07**

* W1: Script parser can now understands objrefs in block code at compiletime
* W2: Runtime engine injects objref context for block code at runtime

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input blueprint+design


---

# SPRINT 2103 - FEB 08 - FEB 21

* **TODO** - make sure can pass parameters to tests
* **TODO** fix `when` to be able to pass parameters to tests
* **TODO** - add stack operations for gvars and keywords

This sprint is for **adding FakeTrack** input as well as related systems for **device directory and input management**, possibly also **distributed state updates**. 

## FEB 09 TUE - Designing Input Manager

There are two parts to this:

(1) Device Addressibility

* Main Server (on WAN) is for LAPTOPS to connect to a SIMULATION SERVER
  * simulation server is a beefy laptop
  * is an URSYS endpoint
* Connecting devices select the role they want to use (this chooses the app)
  * First  come, first served for roles
  * Chromebooks for Script Editor, iPads for annotation/viewing
* The global simulation state is owned by Simulation Server
  * global simulation state is distributed to all devices

(2) Input Routing

* Inputs are Devices with Roles and InputType

I started `step/wip-role-mgr` to start blocking out functions. Putting it aside and looking now at adding some script keywords.

### Script Improvements

Switching to this...let's first look at **stack operations**: I think what we want to do is add `push()` and `pop()` to the gvars through `SMObject`

* [ ] The gvar methods don't have access to `state` because they are invoked with parameters, so we need to do a bit of massaging in the keywords themselves
* [ ] in `p[methodName](...args);` this is invoking the method name with args. Maybe we need a variation called `pushProp`?
* [ ] Alternatively, maybe we need to make all the gvar methods accessible as methods?
* [ ] Maybe we can always return the value by shoving the last returned value into an accumulator?
* [ ] how to write `prop agent.x setTo agent.y` ?
  * [ ] as `propPush` and `propPop`

## FEB 10 WED - bug fixing featPropPush

#### BUG

There's a **bug** with featPropPush() where ref[0] for `featPropPush agent.Costume.costumeName` is undefined instead of 'agent'

* [ ] the `refArg` coming into the compile() is already incorrect. This is produced by TRANSPILER
* [ ] compile() is called by r_CompileUnit() which calls r_ExpandArgs()
* [ ] `r_DecodeArg()` is already getting a bogus objref, so it's probably happening in `ScriptifyText()`
* [ ] so let's check `class-gscript-tokenizer` to **ensure there are no bugs in it**

There were several parse and logic bugs after running all the compiler tests. Seems to work now

* [x] featPropPush works?
* [x] featProp works?
* [x] prop works/
* [x] dbgStack works?
* [x] propPush works
* [x] propPop works?
* [x] featPropPop works?
* [x] dbgOut works?
  * [x] crash on objref
  * [x] no works on expression
  * [x] added agent context to passed contet
* [x] setCostume is wrapping things in multiple [ ] 
  * [x] state.pop was returning an array for a single item pop

### Stack Operations

* [x] propPush, featPropPush - uses objrefs only, not expressions
* [x] propPop, featPropPop - uses objrefs only, not expressions
* [x] state.pop() fixed to return default top value, not an array of one value
* [ ] dbgOut - can it still handle expressions?
* [ ] prop - can it handle expression assignments?
* [ ] prop - can it handle objref assignments?
* [ ] dbgOut, dbgStack - better way to implement output limits?

## FEB 11-12 THU/FRI - Documenting Compiler

Spent a couple of days figuring out how to document it using Typora+Mermaid, billed for half the time because was experimenting with Mermaid diagram generation. **New file is `tech-compiler-internals.md`**

Next up: INPUT STREAM RESUME...try to get to it over the weekend, then we can start writing more interesting Features.



## FEB 15 MON - Message System and I/O work through

I'm creating a new "MessageStream" class to figure out how this might work. I want:

* [ ] all the registered messages with parameters in one place in new `MessageStream` class
* [ ] use `MessageStream` to send all possible messages to server instead of `Messager` class
* [ ] handles URSYS **messages** and URSYS **device addressing**/netlist stuff and 

I'm not clear on what this will look like.

The new `class-message-stream` definition keeps a map of message names to parameter objects, where the keys are the names of the properties and the values are string descriptions

### IOSTREAM DEFINITION

We have a shared mechanism for URSYS messaging that are sent on the main URSYS server

* ursys apps span multiple app/devices, communicate via messages
* ursys apps can have synced state and data resources
* ursys apps use a "request change/received update/distribute" model

Input/Output streams are a bit different in that they use different websockets than the main URSYS server. Currently we have the following io streams:

* DisplayObject - currently implemented as an URSYS message
* PTrack/FakeTrack - currently implemented as a socket-based module

We want to add some more IO streams:

* Annotation Devices: model of discrete and continuous interactions
* Positional Devices: model of dimensional data updated continuously

Probably we want to make it so we have arbitrary tracks with names, and requested a shared track name will be like stablishing a new channel over a **dedicated websocket** address by the message broker machine.

in the IOSTREAM manager:

`JoinChannel('PTrack',{ authenticate }).then(data=>{ /* setup */ });`

then IOSTREAM caches all the changes to the PTRACK channel received over a particular port.

The other input channels use a protocol that is better tuned for interactive events:

* `triggerName`: triggerType, value --> update local input state by name, state
* `triggerTypes`: a logical name for operations handled by RxJS that mean something to us
* `filterTypes`: a list of [RxJS operators](https://rxjs-dev.firebaseapp.com/guide/operators) to apply with params

```
input entry:          controlType, logicalName, filterArray
controlTypes:         button, v1, v2, v3
filterArray (rxjs):   transform, toggle, debounce, momentary, autoOff
```

**What is the order of operation for registering for input from various apps?**

Let's start with how PTRACK works and expand:

```
server establish UDP listener on port for PTRACK
server establish TCP listener on port for FAKETRACK
... some time later ...
client connect to server on URSYS port
.. receive identity and service list sockets from server
.. register logical name, authentication credentials via URSYS port
.. automatically start receiving background netlist, servicelist directory

pick services based on websockets to participate in
.. client optionally connect to servicelist with authentication credentials
.. automatically start receiving background service-specific data and jwt token
.. service websockets requre jwttoken on every request? or just on changes?
.. register for particular messages on the service

what mode is a particular app in? it depends on the service it's engaged
what roles are available to select for a service? register input and type
```

Now we're hooked up to a particular service that is maintaining its cached status and possibly also **forwarding events** to our own client code to do something with it. Can also pull **current state** from the service name as needed, which is updated every sim frame

### What does DISPLAY OBJECT look like with this model?

**CURRENTLY**: 

* The display objects that are sent to `NET:DISPLAY_LIST` are calculated by `sim-agents` on every frame update. This is an *agent-to-dobj* map.
* The display object capture happens in `RENDERER.UpdateDisplayList(dobjlist)`. The actual drawing is done by `RENDERER.Render()`.  This is a *dobj-to-vobj* mapping

**UPDATED VERSION MIGHT BE**:

* a single **producer** can register for the role of **SIM_DISPLAY** with the URSYS thing, so mission control would have to request ownership of the service. This would be a separate service request.
* **subscriber** registers for DISPLAYLIST service, which is running on a different socket server
* the display list service is similar to `RENDERER.UpdateDisplayList()`, receiving `NET:DISPLAY_LIST` automatically. 
* All subscribers would request to become a client of `SIM_DISPLAY`. The `RENDERER` module would initialize itself when this service is requested, and then `Render()` would be available to call by the consumer.

### What does PTRACK look like with this model?

There's `PTrackEndpoint` which is a class that tracks PTRACK-style frames through `ProcessFrame()`. This is the **continuous update** manager.

There's also `in-ptrack` which creates a` PTrackEndPoint` instance and connects, then updates filter settings. It also has the `GetInputs(ms)` **current state** retrieval function.

### What does FAKETRACK look like with this model?

* FakeTrack is a webapp. It would request to become a source of PTRACK data with a particular logical name, role, and address through URSYS

* It receives-back the port to write to. This is all handled in the `in-ptrack` class or something similar.

* FakeTrack is separate from PTrack but uses the same data format, so it can reuse the ptrack module for frame processing and transformation

* The kind of FakeTrack entities might have a different input mode: **follow** or **embody**. 

  

### What does Button Input look like with this model?

* **producer** of button input registers for the role as a Button Input. Possible other kinds of input. THe registration include logicalName and authetication on URSYS node, and in return service list is received. 
* **producer** then registers itself as the producer of a certain named input type along with its logicalname/uaddr. If access is granted, establish the new socket connection that is returned. The producer can then write any data it wants to a particular logical named input
* **subscriber** of ANNOTATION socket receives all the button inputs as-is, recording the logical name of the input and its value, maintaining state. The state of a particular input or all inputs can be read during the GET_INPUT phase.

### What does MQTT Input look like with this model?

MQTT input from POSZYX is vector + trigger data, and I think we'd have a MQTT-to-URSYS bridge on the message broker. 

* producer of MQTT data will need to identify the device type, and maybe it has to be hardcoded somehow as a particular kind of input stream like PTRACK, though it is massaged into PTRACK data.

### INPUTS SUMMARY

* on URSYS connect, receive a **list of services** which have socket addresses
* To request a service, **activate** the service (essentially a channel) and register as either a **producer** or **subscriber** using a special message sent on the dedicated service socket.
  * **producers**: declare logicalName, l ogicalRole. Receive service token. Can send formatted data at any point.
  * **subscribers**: declare logicalName, logicalRole. Subscriber will now automatically receive data on that socket, which is buffered by the managing module and maintains the current state. Using `GetInput()` on the managing module returns the input

* [ ] how are **subnets** handled on a network with several mission control servers?
* [ ] what does a general purpose service manager look like on the server and client sides?



```js
// This creates the table of messages that this app expects to send or receive.

import { NetM, AppM, UpdateMessageList } from '@gemstep/ursys/client';

// two arguments: SENDER signature
// three arguments: CALL signature
NetM('NET:MESG_NAME', { a:"string", b:"number" });
AppM('MESG_NAME', { a:"str", b:"num", c:"bool" },{ result:{a:"str"} });
UpdateMessageList();
/*/
RECAP OF URSYS CONCEPTS

ursys applications can span multiple apps, sharing a conceptually unified space
ursys applications share access to common data resources backed by a database
ursys application share a common state object that is automatically updated

messages are our version of events that work network wide. they can be used to raise signals or send data, optionally receiving data in return.
system events are defined by the browser or operating system

EXTENDING URSYS TO IO STREAMS

iostreams have a TYPE, a UADDR, and a LOGICAL NAME
iostreams are requested through regular URSYS network protocol
iostream connections provide AUTH CREDENTIALS consisting of:
  logical name, token
and receive
	uaddr, list of available roles, list of active roles
to register a role, iostream clients
	send request role
	receive role assignment and updated token
	
iostream maintains connection with
	list of available roles
	list of current role assignments and modes
/*/
```

## FEB 18 THU - Where are we on the Input stuff?

The past couple of days were largely merges and bug fixes, so today I want to get back to the hard stuff: IO SYSTEM DESIGN

**getting a bead on my line of thinking** - first thing is to just make a registration system design, then block it all out. 

* [x] update `client-urnet` to set `m_status` through a call, rather than direct assignment
* [x] what is the `client-urnet` handshake? outline in `draft-tech-ursys.md`
* [x] what are all the modules involved and their names?

Largely I've just looked at the network startup, which is what I need to look at to be able to insert the device negotiation. 

Currently, the startup looks like this:

1. `gem_run` starts `gem-app-srv`, which launches the hot appserver. This also initializes the `NETINFO` module so frameworks can access the `/urnet/netinfo` web service that tells all served webapps where the URNET message broker lives.
2. early in client startup, netinfo is fetched and passed to`EXEC.SystemBoot()` which is shared by both nextjs and express custom servers. In NextJS, `_app.jsx` does the boot. In Express, `SystemInit.jsx` in the bootstrap calls `SystemBoot()`
3. Booting URSYS runs through `PHASE_BOOT`, `PHASE_INIT`, then `PHASE_CONNECT`, which runs before all other application phases. The two hooks are `UR/NET_CONNECT` and `UR/NET_REGISTER`
4. `NET_CONNECT` is hooked by UR-CLIENT library when `SystemStart()` is called in `SystemInit.jsx` before `SystemBoot()` even happens, and it **calls URNET_Connect**
5. `NET_REGISTER` is not currently hooked, but was formerly used to register messages right away 

QUESTION TO ANSWERS

* [ ] how do messages get registered during URNET_Connect?
* [ ] how are messages updated after URNET_Connect?
* [ ] what does this diagram look like of the calls?
* [ ] where can we insert the **input handshaking** and other **device registration** during URNET_Connect?

## FEB 19 FRI - URSYS DATACORE

There are a lot of data structures scattered around URSYS, so I'd like to make a reliable datacore class for it.

* [x] look through server-urnet for data to move
* [x] look through class-netpacket for data to move
* [x] make `server-datacore` , `ur-common` and `client-standalone` modules, and replace references to constants as possible. This centralizes several structures and establishes a rough template for expanding the network protocol

Next step: OUTLINE THIS ON SATURDAY

* where to insert **input handshaking** and **device registration** during connect?

* client connects to its domain + `/urnet/netinfo` to get URNET connnection ip, port

* cient connects to ip, port and ? sends a hello?

* server responds with ?

  

## FEB 21 SUN - URSYS CLIENT DATACORE

There aren't as many movable data stores, other than the STANDALONE stuff we currently aren't using from MEME. So the cleanup was large to make the client's terminology match the server.

* [x] Move the URNET connection out of app-specific startup (_app.js, _start.js) and into UR's `SystemBoot()` to fetch it directly, now that the NetInfo is always fetchable using the hardcoded path in the webservice provided by the appserver. This reduces the boilerplate in our apps by one line.
* [x] Rename `client-session` to `client-netinfo` and rename all the related code to "netinfo" instead of "options" or "session" consistently. Sessions still exist, but they are in the utility `session-keys` module for encoding/decoding.
* [x] Also did the option renaming from `m_network_options` to `m_netinfo` consistently across both server and client
* [x] Rename PHASE EXEC API from `SystemBoot` to `SystemNetBoot` and app-related phases to `SystemAppConfig` from `SystemConfig`, etc, to distinguish an app-scoped phase version a network specific action.

This makes it a bit easier to follow