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

**SUMMARY S2106 MAR 22 - APR 04**

* W1: start client registration, DifferenceCache
* W2: CharControl, UDevice + DeviceSync start

---

# SPRINT 2107 / APR 05 - APR 18

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

* [x] CharControl.jsx declare itself as a device
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

**CharControl.jsx** needs to define the device during `APP_READY`. Tis seems to be working now. Each uaddr now has its own map of devices keyed by udid, as each uaddr can have more than one device potentially.

* [x] Now, is client-netdevices getting **changes** to the device list? **YUPPERSS**

Now **Tracker.jsx** needs to subscribe to `CharControl` devices. To mirror CharControl, we hook into `APP_READY` in `componentDidMount` by hooking the phase. 

* [ ] **SubscribeDevice** gets `selectify() etc`
* [ ] The `selectify() etc` is stored as a "device bridge" object in DATACORE
* [ ] **SubscribeDevice** returns `unsub() getInputs() getChanges() putOutputs()` functions

So now we need to handle each type of function

* `selectify()` is **passed udevice**, returns true or false
* `quantify()` is **passed udevice[]**, returns subset (or everything or nothing)
* `notify()` is **called** whenever the device **directory changes**, and also provides `valid` flag if `selectify` and `quantify` return a device list

We also need to write at minimum:

* `getInputs()` function will return all the current control data objects

Also, **how does a device send control object** ???

```
{ 
	udid,
	inputs: {
		[controlName]: [ cdo, cdo, cdo ]
	}
}
cdo = { id, x, y } // controlProps
```

These are gathered by any means necesary and sent to the server. 

The client has to:

* create a **DifferenceCache** for each controlName defined by the device that has been subscribed to
  * DifferenceCache provides the `getInputs()` and `getChanges()`  functions that are returned by SubscribeDevice. `putOutputs()` is a function that sends `{ udid, outputs: {[controlName]: [ cdo, cdo ]}}` back to the server, which then looks up the associated uaddr and forwards it
* when `udid` comes in, look it up on the Device Directory, iterate over the keys in controlObject `inputs`  and pass the array to the associated DifferenceCache instance

#### SubscribeDevice() wiring

* [x] fix **bug** when two devices are attached and one updates. We should be getting a **removed** detectin in updateDeviceMap, but instead we're seeing one element update and not seeing the remove

Now we have a stabled device map, so **SubscribeDevice** should be workable.

* in Tracker during `UR/APP_START`, we call SubscribeDevice to let the device subsystem know we want to receive  notifications and get some kind of API to perform functions.

* DATACORE has  `DEVICE_SUBS` map which maps `key:subnumber, => value:deviceBridge`
  * device bridges store the user-supplied **selectify, quantify, notify** functions 
  * we use these device bridges to handle updates to the system
  
* DATACORE also has `DEVICE_DECLARATION` map which maps `key:udid => value:udevice`

  used by **RegisterDevice** to hold in the client itself, and also to send to network.

* The `DEVICE_CACHE` is the current network-wide directory, but it's located in client-netdevices

  * It's a **DiffCache** that can `ingest()` a collection and then be queried for **what changed** and the **list of all devices** by `udid` 

* [x] for consistency, move `DEVICE_CACHE` to DATACORE

#### Using DeviceBridges and DeviceAPIs

```js
const deviceSub = { selectify, quantify, notify, dcache, cobjs } 
```

The bridge is saved through `DATACORE.SaveDeviceSub(deviceSub)`. We have to build-in the differenceCache in `SaveDeviceSub()`, and use it to return the deviceAPI structure.

**EVENT: DeviceList Changes** - check the updated devicelist against every deviceSub in DEVICE_SUBS. If `selectify()` and `quantify()` returns `{ valid, devices }` . If `valid` is false, then `devices` may contain an empty list of a partial number of inputs so they can still be used by the UI

**EVENT: ControlObjects Arrive** - A device update contains a number of control data objects.

```
deviceInput = { udid, inputs: { [controlName]:[cobj, cobj,...] } }
cobj = { id, inputs: [ cobj, cobj ... ] }
```

When you subscribe to a device, your selectify function returns a list of matching devices. Each of those devices has:

* a unique **udid**
* presumably the same **inputs controlDefs**

When `deviceInput { udid, inputs: { [controlName]:[cobj, cobj,...] } }` arrives, we want to route those inputs to an **aggregate collection** of all matches that are part of the subscription. So how do we route things?

* device subs filter the device list, creating a **deviceCollection** that is part of the sub.
* the **deviceCollection** is just a set of udids.
* when a **deviceInput** arrives, its udid can be checked against the deviceCollection
* for matching udids in the deviceCollection, the `inputs` property is scanned for **named arrays** of **controlObjects**
* For each named array, a new **inputCache** is stored by controlName. 
* Each input property is processed into this data structure

Now how do we **retrieve** the associated inputCache by name? This isn't quite working...

SLEEP ON THESE QUESTIONS:

* How can I combine the inputs from multiple devices each with multiple named controls?
* How can I create a unique controlObj id from the udid+cobj.id? 

## APR 10 SAT - Sending Control Data

The last bit is wiring the **deviceBridge.getInputs()** to control data sent by a remote device!

* the **sending device** constructs a `ControlFrame` that looks like this

  ```
  ControlFrame = { 
    udid, 
    markers: [ { id, x:1, y:1 }, ...]
  } 
  ```

  (a) This is sent to the server using `sendMessage('NET:SRV_INGEST_INPUT', controlFrame)`. It's up to the program to construct the control frame.  The broker has to figure out which devices to forward that message to by inspecting the `udid` property, and seeing which sockets have subscribed to it.
  (b) Alternatively, use `sendMessage('NET:UR_CONTROL_IN', controlFrame)` to **bypass the input broker**. This is easier for right now.

* the **input broker** forwards the controlFrame to interested devices by using the `selectify` criteria from each device subscription.

* the **receiving device** receives `NET:UR_CONTROL_IN` with the controlFrame and processes it as follows:

  ```
   
  ```

  






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

