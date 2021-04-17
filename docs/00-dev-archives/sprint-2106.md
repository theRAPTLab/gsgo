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