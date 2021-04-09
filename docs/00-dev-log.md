PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2: Start implementing device routing and skeleton input system 

---

# SPRINT 2106 / MAR 22 - APR 04

## MAR 25 THU - picking up from where I left off

I need to store the NET:UR_DEVICES message on the client in a way that is searchable using a client-side API. 

**Q. Where is the client-side API?**
A. `class-udevice` and `client-netdevices` 

## MAR 26 FRI - Adding client API for devices

The idea is that we can register devices of a certain type, and then query the device directory to find matches. Let's go through the steps of registering a faketrack device.

* [x] **Faketrack** says it has x, y, h properties
  * [x] HookPhase UR/APP_READY
  * [x] send device registration
* [x] **Tracker** query devices
  * [x] `client-netdevices` receives device map via NET:UR_DEVICES
  * [x] `client-netdevices` process device map into queryable object db
  * [x] `client-netdevices` has to be queryable by uclass
  * [x] list of inputs updates with UADDR as proof of concept

It turns out that I need to make a Differencer available in URSYS. So this is a second iteration of the original Pool, MappedPool, and SyncMap classes in GEMSTEP

The essential elements of Differencer:

```
new Differ(uniqueKey)
Differ.update(array or map)
const { added, removed, deleted } = Differ.getChanges()
```

It's a pretty simple class. It doesn't require pooling because these are not expensive pieces. We just need to know what changed since the last call, and get the ids

* [ ] add **DifferenceCache** to URSYS (variation of MappedPool, SyncMap)

  * [ ] **intake** a collection of objects with unique key
* [ ] **retrieve** the current list of objects
  * [ ] extension: can **hook** adds, updates, and removes during intake
  * [ ] extension: **retrieve** the differences since the last retrieval: updated, added, removed
  
  

## APR 02 FRI - Slow progress

The dental emergency knocked me on my ass last week and this week. Trying to recover from two weeks of delay and not get mad about it.

I had been working on the DifferenceCache which is supposed to help the device system **be aware of changes** in a way that's different from a SyncMap, which handles much more than changes. DifferenceCache probably should be used in MappedPool so the code is reused, but we'd have to write tests for it so maybe not.

DifferenceCache is being tested in-module and has better reporting of PASS/FAIL

### Using DifferenceCache in device directory

The current protocol will just rebroadcast the entire device list at once, so our difference cache will be used to see what was added/removed.

* [ ] FakeTrack registers itself
* [ ] Tracker detects registrations, but not deletions

Tracker shows a list of devices in its sidebar; I want this to always reflect the current device pool.

* [x] `Tracker.updateDeviceList()` is called 
* [ ] Add all methods of ingest to `DifferenceCache`
* [ ] replace old code in `client-netdevices` with a DiffCache

The differ is sort of working, but I'm not seeing dropped elements. When FakeTrack updates, I see two `NET:UR_DEVICES` messages:

* 1: gets an empty object
* 2: gets the current faketrack

The first one happens on drop (sent by server), and the second one happens when FakeTrack fires up and registers. So the errorr is probably in `svc-netdevices`

* [x] Is `SRV_SOCKET_DELETED` sending the right stuff? Yah, it's sending the updated map which is empty
* [x] How does `DifferenceCache` handle an empty object? It should work just fine! I didn't change anything and it started working; I suspect the compiler was not picking up code changes properly. After I added an explicit check it started working, but then when I removed the check it STILL worked.

**DeviceSync** is working, with the client keeping itself updated whenever the server reports a change in the devices. So **what's next?**

The **InputManager** API is similar to PTRACK in operation, but also has an `inputSpec`. There is a distinct InputManager instance for each type of input you need.

* `UseInputs( inputSpec )` - tells the InputManager what your application is looking for, the minimum, and the maximum. 
* `MapInputs( mapSpec )` will optionally tell the InputManager how to handle added, updated, removed inputs. 
* `PreTransform()` will accept a function that receives the object and transforms it by whatever means it needs to be before `MapInputs()` runs. 
* `Transform()` will accept a function that transforms data after `MapInputs()` is run. 
* `GetInputs()` will return the list of current entities for that InputManager instance, mapped and transformed if those options were used. 

**Modules that use InputManager** can use the results of `GetInputs()` as-is, but they may need to do a **secondary mapping** from those entities to assign to **agents**. So how does that work?

* module gets inputs, which will be a variable number from 0 to MAX
* The inputs are objects with ids provided from the input device, and are guaranteed to be unique across the entire system.
* the module has to figure out what to do with the inputs. 
  * For simple inputs, it's just pulling the value out of it during the `SIM/GET_INPUTS` phase. 
  * For tracker inputs, it has to allocate then to interested agents.

There are **two ways** I am forseeing how agents use inputs that use the `axis` type (-1 to +1)

1. Agents are **created** to use the input as-is, and hold a reference to it. When an input goes away, so does that agent instance. 
2. A fixed pool of Agents are **mapped** to the available inputs which dance around the screen as **cursors**. If not enough inputs are available, those agents are either dead or in some kind of AI state. These agents need to have either an **assignment** or **capture** method to bind the input to it.

We need the **easiest way** to get inputs into the system now. For now, I think this is to just **get the InputManager's** `GetInputs()` call to deliver **InputObjects** (or **Controls**) that have:

```
{ 
	udid: 'uniqueDeviceId',
	id: 'controllerId for devices with more than one control',
	[controlSpecificProperties]: value
}
```

conceivably, an InputObject could also deliver 

```
{ 
	udid: 'uniqueDeviceId',
	ids: {
		[id]:{ [controlSpecificValues]:controlValue ... }
	}
}
```

Note that **these data objects should be as small as possible**, users of a particular InputModule will need to know what type it is and what to expect from it.

## APR 04 - FakeTrack Hookups

* [x] Let's start converting FakeTrack into a CharacterController. 
* [ ] Add `DeviceSubscribe` stub which accelts a TDevice specifier and a TDeviceQuant

## APR 05-08 - Subscribing to an Input

The idea is that you can use `UR.DeviceSubscribe()` to request a certain kind of device. I think that instead of having a type for the selector, we pass a **device filter function**.

### When creating a NEW source device, need

need: `uaddr` `uname` `uapp` `udid` which is added through **DATACORESaveClientInfo({ uapp })**

* [x] `uaddr` - this is available from `client-urnet` when client registers on URNET
  * [x]  refactor `ur-common` to not import EndPoint
  * [x]  `client-datacore` now saves shared information redundantly; will eventually remove other sources of truth in NetPacket, and client-urnet
  * [x]  `client-datacore` now has `MyUADDR()` method to provide (required much refactoring)
* [x] `uname` - this has to be provided by the client io source ('FakeTrack') implementing device
* [x] ` uapp` - this is the app path, `UR.IsRoute()` is worth looking into. It's set in `SystemStart()` which is just `document.location.pathname`. **Now available in client-datacore**
* [ ] device: `udid` 

Now we have to figure out how to **generate unique UDIDs**. 

A udid has to be unique across the entire URNET, and can be based in UADDR. We will strip the last numbers out. `client-netdevices` will hold it. 

* **CharControl.jsx** has an example device registration

### Creating a Device

Construct a `UDevice` instance. You can pass the following to the constructor depending on what you need to do:

* **make new device** - the deviceClass name if you want to use a **named template**, or a **custom name** if a template doesn't already exist. You'll use this UDevice instance to **register in the network-wide Device Directory**
* **deserialize json into device** -  an **plain object** converted into a UDevice instance, a struct that looks like `{ device, user, student, inputs, outputs }`. This is used by the input module to convert JSON into the local **Device Directory** of all devices on the network.

Once you have defined a device, you can **specify what controls** it implements. There are both **input** and **output** controls. You receive data from the device from its inputs, and you can tell the device what to display with its outputs.

### Defining Device Controls

Every device can define a number of **Controls**, which are defined using a **ControlDef** structure:

```
struct ControlDef {
  controlName: string                   // name of control within device
  controlProps: { [prop]:EncodingType } // produces or receives objects of this shape
}
```

The **EncodingType** is one of several special URSYS-defined values:

```
enum EncodingType {
  int, float, string, uint, ufloat,
  byte, word, dword, qword,
  axis, vec2, vec3, matrix3, matrix4,
  bistate, edge+, edge-,
  enum, bits, bits2, fix2, fix3,
  {} // composite shape using above enums
}
```

Note that the controlProps property is a type definition. When actual input data is **received** from a device control, it will always be **an array of ControlDataObjects**. If there is just one output, it will be an array with a length of 1.

* Use  **UDevice.defineInputs()** to add ControlDefs that describe what this device can provide.
* Use **UDevice.defineOutputs()** to describe what this device can receive

### Registering a Device

Once you've created a UDevice and specified its input/output controls, you can register it to the URNET device directory so all clients will know it's available.

* **UR.RegisterDevice( udevice )** will make it available to the entire URNET

### Subscribing to a Device

The `UR.DeviceSubscribe()` call lets you define functions that are used to determine what **ControlDataObjects** will be returned when retrieving data.

Pass in the following function properties to the **UR.SubscribeDevice()** call as an object:

* `selectify(udevice)=>boolean`: filter by pattern all available devices
* `quantify(udevices[])=>UDevice[]`: return a subset of matching devices
* `notify({ valid, added, updated, removed }=>void)`: called when device list changes. if `valid` is true, then the conditions set by `selectify()` and `quantify()` have been met.

You will receive an array of **device API functions** that you can use to perform inputs operations:

1. **DeviceGetInputs**(): `()=>controlDataObject[]` - first function returns all entities
2. **DeviceGetChanges()**: `()=>{ added, updated, removed }` - second function returns what's changed, if any
3. **DevicePutOuputs():** `(controlDataObject[])=>Promise.resolve(status)` - third function sends control data objects to the named output
4. **DeviceUnsubscribe()**: `()=>void` - third function will unsubscribe to the control

### Receiving a Device List

The input system handles this for you after you use **UR.SubscribeDevice()** to pick a device you are interested in. After you receive the device API functions, you'll use them to 

### Receiving Control Data Objects

The input system handles this for you after you use **UR.SubscribeDevice()**. 

Use either **DeviceGetInputs** or **DeviceGetChanges** to receive an array of **ControlDataObjects**. It keep track of incoming inputs and maintains an internal input buffer, which you can read using **DeviceGetInputs()** you received when subscribing. You can alternatively use **DeviceGetChanges()** if you want to know what has changed since the last DeviceGetChanges() or DeviceGetInputs() call.

### Devices Overview

#### To register a new device

1. `let dev = new UDevice(devTemplate)` from a device class template (or custom name)
2. `dev.addInputControl(controlName, controlProps)` to add **input** controls
3. `dev.addOutputControl(controlName, controlProps)` to add **output** controls
4. `UR.RegisterDevice(dev)` to save new device declaration and send to server

#### To subscribe to a device

1. `const selectify = udevice => boolean`
2. `const quantify = deviceList[] => deviceSubset[]`
3. `const notify = (valid, added[], updated[], removed[]) => void`
4. `UR.SubscribeDevice({ selectify, quantify, notify })`

## APR 09 FRI - ToDo

#### Part 1

* [ ] CharControl.jsx declare itself as a device
* [ ] Tracker.jsx subscribe to devices using DBR, print matching devices
* [ ] Multiple CharControls add/remove handled by Tracker.jsx

#### Part 2

* [ ] CharControl.jsx sends Control Data Objects
* [ ] Tracker.jsx read ChangeList through provided function
* [ ] Tracker.jsx read AllEntities through provided function

#### Part 3

* [ ] test client-netdevices.SubscribeDevice() returned functions
* [ ] how does client-netdevices actually receive inputs and route them to the right device bridge?

### Part 1 Notes

CharControl.jsx needs to define the device.






---

# FUTURE QUEUE

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

