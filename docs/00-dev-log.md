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

* W1:
* W2:

---

# SPRINT 2108 / APR 19 - MAY 02

## APR 20 TUE - Look at DifferenceCache Aging

* [x] set char controller to 2 FPS (500ms)
* [x] set tracker to read 4 FPS (250ms)
* [x] confirm that this breaks

**HOW TO FIX**

I think we need a custom remove function for our inputs diffcache that is based on **aging**. But how to we age stuff?

A lot of today was answering random tech questions.

## APR 21 WED - DiffCache

* Figuring out **when to clear the buffer** is tricky, because different devices that can be grouped together  may have **different update rates**
* Also, there is a **fixed sim tick** that may be *FASTER* than the input rates.
* Not to mention that the devices are running on different start times. 

It could be that Sim registers as a device and has its SimRate as one of the shared values, so inputs can adjust themselves to it.

Some trigger possibilities:

* frame aging per entity probably works best
* remembering last value of getInput() might help too

Let's try the latter first.

How does FrameAging work? Well, I think it menas that everytime we are about to remove an entity, we check its age first. 

* [x] add `ageMax` to DifferenceCache
* [x] add ageMax check in `diffArray()` step 2
* [x] confirm it still works in Tracker

After several hours, the solution that works is:

* check that buffer is full during `diffBuffer`
* if full, then do normal diff
* if empty, then scan cMap for aged items and remove

There is an issue when **two controllers** are going, and they will merge into one ping-pong...one disappearsa and the other is valid, then vice versa. 

* [ ] the age is getting reset to 0 instead of being incremented

I'm not sure where my logic is messing up, but it's not working as expected. 

If there are TWO cFrames possible:

* what happens only one is available every other frame

  * cframe1 -> diffBuffer
  * cframe2 -> diffBuffer

  

## APR 22 THU - Buffering Again

It occurred to me last night that maybe **clearing the buffer** is something that can just never be done. We have to use the careful check every time. But no...

It turns out the solution was **make buffer its own class** because it really has nothing to do with the way DifferenceCache works. The new class is **StickyCache**.

### Debugging URSYS Calls to Remotes

I'm seeing that the calls are not being returned properly, and create an infinite loop.

```
ur_send("NET:GEM_TRACKERAPP",{sender:'controller'}).then(data=>data)
-- this works fine

ur_call(): default to 'NET:HELLO' which is built-into client-urnet
-- addConsoleDebugTools implements NET:HELLO
-- infinite loop
 
ur_call("NET:GEM_TRACKERAPP",{}).then(data=>data) from DevController
-- DevController(98): runs promise
   UADDR_99:PKT00004 can't find 'NET:GEM_TRACKERAPP'
-- DevTracker(99): receives call
   got data sender:controller (DevTracker 226)
   transaction NET:GEM_TRACKERAPP UADDR_98:PKT187957 returned 
   "UADDR_99:PKT00003 can't find 'NET:GEM_TRACKERAPP'"(client-urnet 159)
   sender:controller error: UADDR_99:PKT00003 can't find 'NET:GEM_TRACKERAPP
   original sent data sender:controller (client-urnet 160)
   incoming CallMessage: toLocal:false fromNet:true isNet:true (mesager 240)
   1 calling func (messager 252)
   got data sender:controller (DevTracker 226)
   transaction NET:GEM_TRACKERAPP UADDR_98:PKT188617 returned
   "UADDR_99:PKT00004 can't find 'NET:GEM_TRACKERAPP'"(client-urnet 159)
   original sent data sender:controller (client-urnet 160)
```

In the latter case, calling `NET:GEM_TRACKERAPP` is weird.

* from the caller side, it just gets `UADDR_99:PKT00004 can't find...`. 
* from the callee side, this messaggoes out the SECOND time the thing is run.

I think what's happening is that the handler is immediately executing (so the data reached it) but the return transaction is failing.

So let's trace what happens 

**There is a regression to client-urnet** from merging the old dev in!!! See commit `a34f1346b7e54fa78cb6e8dfc5653c9c75e9cc5c`

Repairing this didn't change much though.

* even though an error is coming back that it couldn't find the message, it's clearly receiving it. So that means **the return transaction** is messing up. So let's see what happens after the dispatch.

* `client-urnet:156` has the call and calls messager, which calls the one matching function
* the fnuction happens
* `client-urnet:157` then handles the return of the transaction *which already has the error code in it*
* `server-urnet:201` is checking after calling RemoteHandlerPromises() to do this...this should be handling the **transaction** packet though. This tells me that maybe the initial call recipient is re-forwarding the message somehow.

So let's instrument that...

* it looks like the call is actually working; it's just that the return packet is being decorated with the error message
* It looks like the returned packet is **not recognized as a response packet** and thus it gets reforwarded

Why is `isResponse()` failing? There are three packets being routed:

1. initial packet from caller, rmode = req
2. packet from callee, rmode = req (???)
3. packet from caller, rmode = res, complete transaction

first packet is routed to remote. It should fire-off a new packet to the remote. There seems to be an **extra packet** being created, and it is of the wrong type.

So what SHOULD happen?

* caller creates mcall packet
* server receives packet
  * clones packet and pushes transaction start to promises for each remote through direct websocket
  * 
* callee receives packet, should call it's local thinking

CALLEE seems to be getting the correct packets: original call and response packet

SERVER receives 3 packets. The first one is the routing one. The second is another request from callee (?) which is also a request. The final packet is the actual return, but it's picked up bad data from the bogus request. 

The bogus rquest is from callee to itself, so it skips everything and handles nothing.

**SO...WHAT IS TRIGGERING THE NEW PACKET?**

```
--- CALLER 02 starsTransaction and socket.sends a PACKET CLONE

 URNET        >>> NEW ROUTE: NET:GEM_TRACKERAPP UADDR_02:PKT00061
							*** packet isResponse: rmode req
 URNET        >>> ROUTE: server found 0 promises
 DCORE        *** datacore: looking for NET:GEM_TRACKERAPP UADDR_02
 DCORE        *** datacore: checking NET_HANDLERS 6 UADDR_02
 DCORE        *** datacore: found NET:GEM_TRACKERAPP 6 UADDR_02 remotes= 1
 DCORE        T0111 fwd  packet UADDR_02:PKT00050 'NET:GEM_TRACKERAPP' to UADDR_01
 DCORE        T0111      data {"sender":"controller"}
 DCORE        T0111      seqlog UADDR_02>SVR_01
 DCORE        *** datacore: returning 1 promises
 URNET        >>> ROUTE: remotes found 1 promises
 URNET        T0111 sleeping 'NET:GEM_TRACKERAPP' UADDR_02:PKT00061
--- the promise sleeps until woken up by a closed transaction 
--- startTransaction stores the hash function that will be called on return to resolve

--- CALLEE 01 receives request packet and receives data
--- it should return the data somehow, which would generate the next packet back
--- to the server as a response to the cloned packet


--- THIS IS THE PACKET GOING TO THE REMOTE, but is RECEIVED from CALLEE
--- as another request...or is it?
--- 

 URNET        >>> NEW ROUTE: NET:GEM_TRACKERAPP UADDR_01:PKT00003
							*** packet isResponse: rmode req
 URNET        >>> ROUTE: server found 0 promises
 DCORE        *** datacore: looking for NET:GEM_TRACKERAPP UADDR_01
 DCORE        *** datacore: checking NET_HANDLERS 6 UADDR_01
 DCORE        *** datacore: found NET:GEM_TRACKERAPP 6 UADDR_01 remotes= 1
 DCORE        T0112 skip packet UADDR_01:PKT00003 NET:GEM_TRACKERAPP to UADDR_01
 DCORE        T0112 skip packet UADDR_01:PKT00003 UADDR_01
 DCORE        T0112 {"sender":"controller"}
 DCORE        *** datacore: returning 0 promises
 URNET        >>> ROUTE: remotes found 0 promises

--- THIS IS THE ORIGINAL REQUEST WOKEN UP

 URNET        >>> NEW ROUTE: NET:GEM_TRACKERAPP UADDR_02:PKT00050
							*** packet isResponse: rmode res
 URNET        T0113 'NET:GEM_TRACKERAPP' completing transaction UADDR_02:PKT00050 UADDR_02>SVR_01>UADDR_01
 URNET        T0111 waking up 'NET:GEM_TRACKERAPP' UADDR_02:PKT00061
 URNET        <<< ROUTE: return transaction UADDR_02
```

OMG the error was in here

```
/// toNetwork (initiated from app)
if (toNet) {
  if (!isNet) throw Error('net calls must use NET: message prefix');
  type = type || 'mcall';
  if (mesgName === 'NET:GEM_TRACKERAPP') console.log(`TO NET NEW PACKET ***`);
  let pkt = new NetPacket(mesgName, inData, type);
  let p = pkt.transactionStart();
  promises.push(p);
} // end toNetwork
```

The `toNet` variable is derived from the `NET:` prefix, but if it's also `fromNet` (an incoming remote) then this shouldn't be run because that is _NEW_ call. This is here the phantom call was coming from.

Changing the line to

```
if (toNet && !fromNet) {
```

Fixes everything.

## APR 24 SAT - Adding Notification to Device Manager

Ben's testing the device system as a way to check asynchronously for the existence of certain client apps. Right now he's polling, but the `notify()` function provided by a Device Subscription should take care of that more seamlessly. Just need to implement it.

* [x] insert a call to `notify()` in `client-netdevices.LinkSubsToDevices()` that has `{ selected:udevice[], quantified:udevice[], valid:boolean }` 
* [x] make sure the **lack** of `selectify` and `quantify` functions just passes everything

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

