[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S21-01 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S22-02 JAN 25 - FEB 07**

* W1: Script parser can now understands objrefs in block code at compiletime
* W2: Runtime engine injects objref context for block code at runtime

**SUMMARY S2103 FEB 08 - FEB 21**

* W1: new keywords, compiler tech documentation
* W2: network/input design, keyword jsx assist

**SUMMARY S2104 FEB 22 - MAR 07**

* W1: refactor ursys for new code, ben key/jsx help
* W2: multinet design, start implement of directory. URSYS call bug found.

**SUMMARY S2105 MAR 08 - MAR 21**

* W1: URSYS debug remote-to-remote call, declare nofix because not needed with current data flow
* W2:Start implementing device routing and skeleton input system 

**SUMMARY S2106 MAR 22 - APR 04**

* W1: start client registration, DifferenceCache
* W2: CharControl, UDevice + DeviceSync start

**SUMMARY  S2107 APR 05 - APR 18**

* W1: CharControl, DeviceSub, Directory, Data Structure documentation
* W2: Device Define/Publish, Subscribe/Read Complete DR01!

---

# SPRINT 2107 / APR 05 - APR 18

## APR 05-08 - Subscribing to an Input

The idea is that you can use `UR.DeviceSubscribe()` to request a certain kind of device. I think that instead of having a type for the selector, we pass a **device filter function**.

### When creating a NEW source device, need

need: `uaddr` `uname` `uapp` `udid` which is added through **DATACORESaveClientInfo({ uapp })**

* [x] `uaddr` - this is available from `client-urnet` when client registers on URNET
  * [x] refactor `ur-common` to not import EndPoint
  * [x] `client-datacore` now saves shared information redundantly; will eventually remove other sources of truth in NetPacket, and client-urnet
  * [x] `client-datacore` now has `MyUADDR()` method to provide (required much refactoring)
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

  *the **input broker** forwards the controlFrame to interested devices by using the `selectify` criteria from each device subscription.

  * the **receiving device** receives `NET:UR_CONTROL_IN` with the controlFrame and processes it as follows:

## APR 13 TUE - Algorithm Implementation!

In the [Whimsical Diagram](https://whimsical.com/input-system-dr01-Y2xuF7r1N1kxNJ2MyfzqZY) there's some algorithms on the right side

* when **DeviceDirectory changes**, run the device list through all subscription conditions
* retrieving a **Controller** returns a `getInputs()` method where you specify the controlName you want to receive
* when **receiving ControlFrame**, rewrite ids to udid+id, then ingest them into the cProp map

Where are we currently? Well, there are a number of data structures we need:

* ` DEVICE_DIRECTORY` is the cache of all devices descriptors, implemented as a DifferenceCache, and used to manages changes in the device directory that is sent network-wide

* `DEVICES_LOCAL` is used by a **device provider**, and is mapped by udid to UDevice. The udid is created by combining UADDR with the local device count, which guarantees a unique device id across the entire network. Each UDevice can be used to create a **deviceDescriptor** which is describes the device to the network without any credentials.

* `DEVICES_SUBBED` is used by **device subscribers** to hold a "subscription" mapped from a "subscription id". This id is just an int that is used to look-up the subscription to delete it. The DeviceSpec has the selectify/quantify/notify functios, and has some **added** properties: `dcache` to cache the multiple devices that this subscription could have, and `cobjs` for the controlObjects received from al these devices. 

* `DEVICES_INPUT` maps `udid` to a buffer. This map is populated by the subscriber client code, so if an incoming control frame has a udid that's in the map, that means it's been selectified/quantified. The mapping is a bit convoluted:

  ```
  udid --> Map<controlName, [FINISH WRITING HTIS OUT]
  ```

So...

**Q. How is UDevice used to create a ControlFrame?**

**Q. In the extended DeviceSpec, is `cobjs` adequate for handling all the controls?** 
Or do we have to make sure that the DeviceSpec designates a **single control name per device specification**? Look at `UR.SubscribeDevice()` to determine where to insert this.

## APR 14 WED - Algorithm Implementation II

There are three subsystems that I want to implement, and also nail down the actual map needs. The thing that's confusing me now is how to access a **named control** from the deviceDescription. Again, this is what is looks like:

```js
// A CONTROL
const exampleControlDefinition = {
  controlName: 'markers',
  controlProps: { x: 'axis', y: 'axis', jump: 'trigger' }
};
// A DEVICE WITH MULTIPLE INPUT CONTROL
const cdef = exampleControlDefinition;
const exampleUDevice = {
  udid: 'udev01:1',
  meta: {},
  inputs: [cdef, cdef]
};
// A CONTROL OBJECT 
const exampleControlDataObject = {
  id: 0, // this is not the same as udid, but it the instance control
  x: 0,
  y: 0,
  jump: true
};
// A FRAME ASSOCIATES CONTROL OBJECTS WITH A UDID
const cdo = exampleControlDataObject;
const exampleControlFrame = {
  udid: 'udev01:1',
  markers: [cdo, cdo]
};
```

The **controlData** object is the same as **controlProp** in gneral shape, though the 'encoding' in the deintiion is replaced with actual data in the controlData of course, and the **id** is added as well. 

* We want to subscribe to a device which can be any device. We get a device handle from the call.
* Since devices can have multipe controls, we need to tell the device handler's control to get input from.
* When devices send updates for a control, they appear as a bunch of named properties that are written to a device's buffer object, which can contain a buffer for each controlName's controldata type

We want to detect packets from a udevice and map them 

algorithm for writing a hashed path

```
we want to check that all props except the last one is a map
bits = path.split('.');
map = this.map;
bits.reduce( acc,cv => {
	if (!map instanceOf Map) throw Error('err:path contains non-map');
	map = map.get(cv);
	return acc&&map instanceOf Map;
},true);

```

## APR 15 THU - Implementation III

We have the beginnings of the PathedHash class, and I realized that the controlFrame processing is different than how I documented it. 

**GOAL: send an arbitrary control frame from CharControl**

* `CharControl.jsx` called `Initialize()` in `componentDidMount()`
* in `mod-charcontrol-ui.js`,  frame data is periodically sent through `setInterval(SendControlFrame, INTERVAL)`

* Cleaned up CharControl, now how do we make the correct control frame?
* [ ] On device registration, we need to keep the device udid handy afterwards

## APR 16 FRI - Implementation IV

* [x] return udid from RegisterDevice, save in mod-charcontrol-ui
* [x] new method `UDEV.makeControlFramer(cName)` returns a function that generates a control frame for the named control
* [x] how to send the controlFrame to all devices? `NET:UR_CFRAME`
* [x] fix class-endpoint so it can use the UAddressNumber by declaring NetNode, LocalNode later
* [x] why is DATACORE.IngestDevices() called every time CharControl adds another entity? Initialize is called whenever numEntities changes
* [x] Why does input rate increase every time numEntities is incremented? Same as the Initialize thing above

**GOAL: process received control data into entities**

* [ ] `client-netdevices`compare incoming controlFrame against `udid` via `sub.dcache.hasKey(udid)` 
* [ ] why is DEVICES_SUBBED empty? We have not processed the device directory to populate it!!!

a DeviceSub has additional things added to it

* dcache - all the udids in this sub, stored in a DifferenceCache of udid=>Device
* cobjs - received control objects, grouped by controlName =>DifferenceCache **this is what needs to be fillled with control objects**

`DEVICES_SUBBED` contains all the subscriptions, but when is it actually populated? That should occur whenever the Device Directory updates

* [x] it's in `client-netdevices` `m_UpdateDeviceMap`, which calls `DATACORE.IngestDevices()`
* [x] `IngestDevices() ` populates `DEVICE_DIR` and produces added/ updated, subbed. 
* [x] Change `IngestDevices()` to allow selection of what to retrieve by setting option `{ all: true }`
* [x] `all` is an array of udevice directory entries, which do not have user or student info
* [x] `GetSubsByUDID()` want to process the list against the subscribed devices in `DEVICES_SUBBED` to find matching subs for a controlFrame

`DEVICES_SUBBED` is a `Map<int,devSub>`, and the sub has `dcache` and `cobjs `. The dcache is a udid-to-cName map for this sub's valid udevices. **Now the subscriptions are being updated when cFrames come in!**

Now CFRAME and DEVMAP are being processed into SUB.DCACHE and GetSubsByUDID...we want to **notify** when **subscription lock** occurs and also **get the DeviceAPI** from the subscription.

* [x] `DATACORE.SaveDeviceSub()` is what returned dAPI object.
* [x] This dAPI is returned by `UR.SubscribeDevice()`, and this is called by `Tracker.jsx`  during componentDidMount. 

We are not returning ALL the markers for some reason...that's because we need to iterate over all the devices.

* [ ] a subscription has  `dcache (udid=>udev)`
* [ ] and also has `cobjs controlName=>diffcache` 
* [ ] when processing a controlFrame, subscription d.cache is used to look up a device, and **also** it needs to update cobjs as well with ingest.
* [ ] that means **controlFrame** has to be careful about not erasing cobjs
* [ ] need to add an "additiveIngest" somehow. **The differenceCache in cObjects has to be a map.**

What is happening is that the ingest is happening one after the other. We need to keep a map of the incoming objects instead, I think.

`--- Intermission ---`

1. write a new ingestAdditive method for DifferenceCache
2. add Tracker update to FakeTrackDevices and also CurrentEntities
3. fix deviceDirectory sync on Tracker first load

**Fixing DifferenceCache** - the issue starts in the controlFrame parser in client-netdevices `m_ProcessControlFrame(cFrame)`

the ingest algorithm:

* input: the array of `{ id }` objec `arr`
* the "last mapped collection" is stored in `sobjs` ("seen objects"), which is a ref to `this.cMap`
* a "new mapped collection" is stored in `nobjs` ("new objects")
* pass1: use `sobj` as "objects we've seen before", and compare against the incoming `arr`.  If arrElement is not in the `sobj`, it's **added** since last time. If it's already in `sobj`, then is **updated** since last time `ingest()` was called
* pass2: scan the incoming `arr` now against the seen objects `sobj` from last run through, and delete anything that is seen now. Any remaining keys in `sobj` are for objects that have disappeared and are considered **removed**

How to fix this???

well, ingest() has the effect of essentially resetting the "seen objects" cache in this.cMap, so maybe we just make a version that doesn't? Maybe with an **explict reset** version. Let's rename ingest to somethat that implies that it differences. Maybe **`diff()`**  is the replacement for `ingest`

ingest now means "take in inputs without performing the difference", so we want to buffer inputs now.

* [x] add `buffer()` and `diffBuffer()` equivalents 
* [x] in `m_ProcessControlFrame()` change `diff()` to `buffer()`
* [x] in `DATACORE.SaveDeviceSub()` make `getInputs()` perform `diffBuffer()` 

**adding Tracker FakeTrackDeviceFound**

* [ ] `this.state.devices` needs to be set.
  * [ ] `Tracker.updateDeviceList()`  tries to update that display
  * [ ] `UR_DEVICES_CHANGED` handler in constructor should be calling it

**why is deviceDirectory not read on startup?**

if Tracker starts after CharControllers are already running, the devices come online, but the **device comm does not**. If Tracker already running and CharController starts, **device comm happens**.

* [x] when a device pops online, offline, it sends `NET:UR_DEVICES` which is handled by `m_ProcessDeviceMap()`. It happens pretty early, before any subs are registered.
* [x] Tracker does `UR.SubscribeDevices()` during `UR/APP_READY`, so it also needs to process the device list at that time.

This is **good enough to merge**!

