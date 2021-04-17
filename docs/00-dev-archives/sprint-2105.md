2-Apr[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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

---

# SPRINT 2105 / MAR 08 - MAR 21

## MAR 08 - Debugging URSYS

#### debugging URSYS calls between remotes infinite loop

**issue**: when two instances of URSYS each implementing`NET:HELLO` exist, the `call()` should only call one of them and receive data back. **what happens**: infinite loop. **what works:** using `send()` and `raise()` seem to work.

### Debug Tracing

* [ ] class-messager: 
  * [ ] callMessage logic for determining 'a remote call' versus 'a local call' with the same message name seems to cause problems. This breaks local calls with a thrown error...
  * [x] ...removing the `if (!channel.LOCAL && !fromNet)` seems to help local calls work but unknown if it breaks other things
* [ ] server-urnet:
  * [ ] it looks like the transaction never resolves correctly
  * [x] hm, when the call is initiated from just one side, the other side seems to **initiate its own send**of the same message **instead** of just returning it
  * [ ] this suggest a bug in class-messager **mishandling** a transaction packet as a **new message**

**Q. What are the routing modes for `class-netpacket` ?**

These are the properties in NetPacket that message handlers on the server and clients use to determine how to route and respond to a NetPacket.

```
type    - tells the broker how to handle (msend, msig, mcall, state)
rmode   - transation direction (req, res)
seqnum  - number of hops (set to 0 at originator)
seqlog  - starting with originator's uaddr, addded each hop
          push transactionStart, transactionReturn
          
s_uaddr - set by message broker on first receive, because only it knows
          what the definitive UADDR is from its socket map
s_group - this is a 'token' that is sent with each packet (jwtoken someday)
s_uid   - unused?
```

**Q. How is a transaction handled?**

The core implementation details is in `class-netpacket` and `class-messager` 

```
ORIGINATOR
transactionStart( socket )
* push our UADDR onto seqlog
* return a promise that 
		is hashed into transaction table
		that stores function data=>resolve(data)
		and calls socketSend on itself

REMOTE message handler
isTransaction() checks 
* that this.rmode isn't a request (should be res)
* that the seqnum is > 0, meaning it's at least hopped once
* the originating address is not the same as us
-- the USE is for the SERVER to see if it's a reflected transation response
-- from a remote caller

REMOTE
transactionReturn( socket )
* received packet by remote
* remote adds its uaddr
* sets rmode to 'res'
* sends it back to the message broker

ORIGINATOR message handler
isTransaction() ?

ORIGINATOR RETURN
transactionComplete()
* generates the hash key and looks up the resolver function
* calls the resolver function with the contents of packet data

The resolver function is created by class-messager and looks like this:
function MakeResolverFunction( handlerFunc, inData) {
  return new Promise(resolve=> {
    let retval = handlerFunc(inData);
    resolve(retval);
  }
}

The way callMessage( mesg, inData, option ) works is:
* look up handler by mesg
* if it's a local call, then make a resolver function and add to promise list
* if it's a net call, make a netpacket and use transactionStart() to get promise to add to primise list.
* finally, Promise.all() all promises, returning a res array of results.
* return the resObj (a composite)

```

**Q. How does message handling distinguish between remote calls and returning transactions?** 

On the **client-side**,  `client-urnet`  implements message handling in  `m_HandleMessage( pkt )` 

1. if `pkt.rmode==='res'`  then calls `pkt.transactionComplete()` (this checks if the packet is a **response to our own call**. 
2. ottherwise this is an **incoming request** to handle:
   * if `pkt.type==='msend'`  - call `sendMessage( msg, data, { fromNet: true } )`, then `pkt.transactionReturn()` to signal that the send was received (with no data)
   * `pkt.type==='msig'` - Similar to `msend` but uses `raiseMessage( msg, data, { fromNet: true} )` instead 
   * `pkt.type==='mcall'` - Use `callMessage( msg, data, { fromNet: true } )` which returns a promise. Invoke `then(result=>{}` on promise, which will `pkt.setData(result)` before calling `transactionReturn()` 

On the **server-side**, `server-urnet` implements the message broker logic in `m_RouteMessage(sock, pkt)`

1. if `pkt.mode==='res'` it's a **response to a remote call**, which was initiated as a new packet from THIS SERVER. Call `transactionComplete()` to call the resolver function **where???**

2. otherwise its a **new message to broker** on behalf of a client, so fetch handlers related to it.

   * Is it a **server-implemented** or a **remote** message? Only can be one
   * The handlers are promises, so `pktArray = await Promise.all(promises).catch(err)` 
   * `pkt.type` of `msend` and `msig` require no additional return processing, *otherwise*...
     * assemble aggregate data (should make this part of NetPacket)
     * `pkt.setData(data)` and `pkt.transactionReturn(sock)`

3. the **magic** part is in the returned promises from `m_PromiseServerHandlers(pkt)` and `m_PromiseRemoteHandlers(pkt)`. 

   1. For **server handlers**:

      ```js
      let promises = [];
      handlers.forEach(hFunc => { 
      	let p = new Promise( (resolve, reject) => {
          let retval = hFunc(pkt);
          if (typeof retval!=='object') reject(retval)
          else resolve(retval)
        });
        promises.push(p);
      });
      return promises;
      ```

      

   2. for **remote handlers**, the packet has to be forwarded to possibly multiple remotes:

      ```js 
      let promises = []
      remotes.forEach(remote => {
        ...
        let r_sock = SocketLookup(remote);
        let newpkt = new NetPacket(pkt)
        newpkt.makeNewId();
        newPkt.copySourceAddress(pkt); 
        promises.push(newpkt.transactionStart(r_sock));
      }
      return promises
      ```

      Recall that `NetPacket.transactionStart()` returns a Promise that looks something like this:

      ```js
      transactionStart( socket ) {
        seqlog.push(NetPacket.uaddr)
        let p = new Promise( (resolve, reject) => {
          let hash = m_GetHashKey(this);
          m_transaction.set(hash, data -> {
            let json = JSON.stringify(data);
          	resolve(data);
      	  	this.socketSend(socket)    	
        });
        return p;
      }
      ```

   3. The general **pattern behind Promise use** here is that they're used to package code that performs **asynch execution** of functions with *different* uses. 

      * for **ServerHandlers**: The message map points to arrays of **handler functions** of the form `hFunc(pkt)`. The promise wraps the call to `hFunc()` which returns a **data object** that is used to `resolve()` the promise. 

      * for **RemoteHandlers**: The message map points to arrays of **remote addresses**. Each address in the array is used to begets a Promise that:

        1. **clones** the original incoming packet into `newpkt`
        2. **forwards the data** using `newpkt.transactionStart(r_sock)`, which returns a **promise** that is then `await`ed in the main ``m_RouteMessage()` server function

      * for **Transaction chains**

        1. for **client local calls**: `messager` provides the `callMessage(msg,data)` interface and uses `m_MakeResolverFunction(handlerFunc, inData)` to return a promise that just resolves the return value returned by `handlerFunc`, which is defined by the `UR.callMessage('MESG',hFunc()=>{})` invocation

        2. for **clientnet calls**: `messager` gets the promise from `transactionStart(sock)` in `class-netpacket`. 

           * the transaction map points a **computed hash of a netpacket** to a **resolver function** that contains the `resolve()` call to complete a Promise. 
           * The transaction map contains all the outgoing network packets, and can be rematched to incoming packets that are completely different JS objects through the hash key. 
           * On transaction start, a Promise is created to start the network send. Before it does that, it creates a **function object** (the "resolver function") that does two things: (1) it saves a reference to the original callback specified by `UR.CallMessage(MESG,func)` and (2) it passes the return value of the callback to the promise's `resolve()` function.
           * Incoming packets are checked to see if they are associated with a transaction. This is done by **computing** the netpacket hash and looking for an associated resolver function. If it exists, `pkt.completeTracaction()`  calls the found resolver function is called, which (1) calls the original callback and (2) passes the result of the callback to the `resolve()` . This closes out the transaction, so the entry is deleted. 

        3. for **server message brokering**: the `m_RouteMessage(sock, pkt)` is the main handlers. When the broker receives a packet from a remote, it can either be (1) a new message request or (2) a returning message request. 

           > The non-obvious magic of `m_RouteMessage(sock,pkt)` is that **the entire function makes use of closures** to "remember" what socket to return the transaction. The entire function **pauses** in `(3C) Magical Async/Await block` , and continues AFTER the network promises have resolved in a *SUBSEQUENT* return of a transaction! It's fizzying.

           * In the case of a **new message request**, the broker ***clones*** the original packet and initiates a ***new transaction*** to the remote. There can be many such clones.

             * the list of promises is created from the list of remote handler addresses for the message, and each promise looks like this: 

               ```js
               let newpkt = netNetPacket(pkt); // clone data
               // override ownership/source to point to server
               newpkt.makeNewId(); 
               newpkt.copySourceAddress(pkt)
               // transactionStart() returns a Prommise
               // here's what it looks like sorta
               let p = new Promise((resolve,reject)=>{
                 let hash = m_GetHashKey(newpkt);
                 m_transactions.set(hash, data=>{
                   resolve(data);
                 });
                	newpkt.socketSend(sock)
               })
               ```

           * In the case of a **returning** packet

             *  it is distinguished from a new message request by checking its `rmode` property; it will be set to `res` if it's returning from the brokered message, otherwise it will be `req`. 
             *  See the special excerpt about `MAGICAL ASYNC/AWAIT BLOCK` above to understand how it works.


### New Insights, Debug Transaction Time!

It's much clearer now how this works. The critical bits that pertain to network calls (which are the only type that return data)

* originator sends a packet of type `mcall` and rmode `req` via `transactionStart()` which also sets `seqlog` to have a first value of the originator's uaddr
* broker server  `m_RouteMessage(socket,pkt)`  receives the socket and packet. This entire method has `socket` and `pkt` in its closure which helps it work like an asynchronous sleeping thread. In this method:
  * broker clones original packet and creates a Promise for each remote implementor that uses `transactionStart()` for each one. 
  * **still in the same call invocation**, `let retval = await Promise.all(promises)`  suspends the thread until all promises are resolved. Those promises are resolved by *subsequent* calls to`m_RouteMessage()` that are detected as 'returning transactions'.
  * **after Promise.all() in the same call invocation** the returned values are in an array of objects that are the returned values from remotes. These are all merged into a single return object currently.
  * **at the end of the call invocation** the original packet has its data payload updated and`returnTransaction()` sends the packet back to its originator.

## MAR 09 TUE - Short Day of Debugging

To clean up the logic in the server, I split out the server-side URNET client API into its own module `server-message-api` . Also added ur_handle and ur_unhandle to the dbg interface for ursys.

**Bugs** known with **Call**

* [ ] if an implementor of a NET:MESSAGE also tries to call it on remotes (like a common service channel) the server never returns the transaction to the client and instead goes into a loop
* [ ] local call does not seem to return data
* [ ] defining a net:message after urconnect has happened doesn't update the list. Should add this provision in the updated protocol

## MAR 10 WED - Known Call Bugs

### Immediate Testing Goals

```
01 [ ] R1 and R2 have NET:MESSAGE, R1 call NET:MESSAGE
02 [ ] Just R2 has NET:MESSAGE, R1 call NET:MESSAGE
03 [ ] Check that * works as expected
04 [ ] Check why raising NET:UPDATE will also trigger the handler, when both are on the same app instance (it shouldn't happen). 
```

Checking `02`:

* implement `NET:GEM_COMPILER_PING` and `NET:GEM_INDEX_PING` 
* is it possible to **`UR.RegisterMessages()`** at any time? **yes**
  * `class-endpoint ursysRegisterMessages()` sends the message
  * `svc-reg-handlers NET:SRV_REG_HANDLERS` receives the message
* When are first messages registered? `UR/APP_CONFIGURE` just before `APP_READY` and after `LOAD_ASSETS`
* When does a lazy-loaded application get loaded? It should catch `APP_CONFIGURE` because that's when all the messages are registered, and `APP_CONFIGURE` runs *AFTER* the SystemInit wrapper has completely rendered.
* So there is **a bug in registering messages** on the server side???

There is something weird going on in the message router on the server!

> **RemoteHandlerPromise() seems unable to propertly look-up net:messages**
>
> not only that, but the call handler on the server side seems to be calling the originator as well, which is wrong, or the returning packet is somehow malformed. But it can't even find the remote. 
>
> **Need to check the entire call chain!!!**

* [x] `NET_HANDLERS` has Map `mesg => Set<uaddr>`
* [x] check for remotes length is incorrect (should be `size` for a Set)
* [ ] it seems that `server-urnet` line 191 is triggering for some reason, I suspect on the RESPONSE side of things instead of completing the transaction
* [ ] note: changing `Netpacket.isResponse()` to use more bulletproof check creates the infinite loop here too

**Q. So what seems to be happening?**
A. since SEND works but CALL does not, that implies that the Call Transaction Chain is broken. The message gets to the remote just fine, but gets misprocessed on return. So **how is a return packet understood by the server?** And why is it breaking?



## MAR 11 THU - Debugging Continued

Return packets are not being returned from the server for calls, but sends/raises work. This implies that the transaction return detection on the server is broken. 

* [x] **find** the transaction processing code
* [x] redo debug messages to uncover issue
  * [x] fix bug introduced in server-datacore RemoteHandlerPromises()
* [x] confirm: non-shared messages **send** works between apps
* [ ] confirm: non-shared messages **call** works between apps
  * [ ] checking NetCreate/MEME, I am not seeing a difference in the server code
  * [ ] Check each part of the chain
    * [ ] does the packet reach the server? YES
    * [ ] does the packet find the matching handler on server? YES
    * [ ] does server receive a transaction back 

Here's the [debug investigation](https://docs.google.com/document/d/1g4GqpDHR4hfOVBs_Xdyl6BOUTSGnqIoF_3cn8JMT_tY/edit?usp=sharing) (I'm spending way too much time trying to figure this out). The two main issues are:

* A mystery clone of the outgoing message packet that returns from the remote...what is initiating it?
* The original packet that gets returned has bad data in it, but where does it come from? 
  * `m_urlink.callMessage()` is returning the bad data
  * is `m_urlink` the same endpoint as what registered the message?
  * `m_urlink.callMessage()` is called with the `fromNet` option set.
  * `class-endpoint` passes the `callMessage()` on to the MESSAGER singleton defined in the endpoint. There's only one and it's shared by all EndPoint instances.
  * WEIRD: The "can't find 'NET:GEM_HOMEAPP'" message comes from the SERVER, which means that the call is returning not found?

A little lost. It may be that remote-to-remote calls have been broken for a while, since neither NetCreate or MEME use them (they seem to be all server calls or broadcasts)

* The originating call to NET:GEM_HOMEAPP has `ch:Net toNet:true toLocal:false isNet:true fromNet: false`
* The reciever recieves `ch:Net toNet:true toNet:true isNet:true fromNet:true`

we don't seem to be processing `fromNet` correctly on the receiver.

**it looks like this has always been broken**

* remote-to-remote call has been broken for a while...it might have worked in PLAE
* same message signal calls also broken, creating infinite loop

The last time this worked, maybe, was in netcreate. 

* PLAE/ISTEP had an early version of UNISYS, but looking at the calls it seems only the server ones were used to get information. The ones that did return data used a SIGNAL/SIGNAL_ACK pattern!
* NetCreate doesn't have peer-to-peer calling



## MAR 15 MON - Back to Input Routing

Ok, it's time to implement something from FakeTrack into the input system. In essence, we have a **list of input devices** available in the `sim-inputs` module, and these input devices are **updated as they come online and offline**. The input **device definition** is a bundle with the **input type** (vector, discrete, number), and the **student id, group, and device logical name**. It is up to sim-inputs and the GUI to give these things **application roles** depending on who's using it. 

Where we last left off:

* [x] defining the client-server messages for handshake
* [x] sketching-in server and client modules

What comes next

* [ ] Adding the client module to FakeTrack
* [ ] Filling-out the client module so FakeTrack instances register with the server
* [ ] When the client module recieves an input update, tells sim-inputs that it happened
* [ ] sim-inputs defines a mapping algorithm for mapping inputs to agents

**Question: what module "owns" the input-driven agents?**
The input manager `sim-inputs` will "own" its input objects (IOBs) and make them available for mapping. It's up to `sim-agent` to determine what is done with those input objects. An IOB->AGENT SyncMap could be created by `sim-agent` , and the blueprints decide how to use the input object as either CURSOR or EMBODIMENT. 

**Question: how do we associate an IOB with a visual in the case of a tracked element?**
IOBS can also be mapped independently, but maybe it is easier to just pull the "active" IOBs out of the agents themselves during the AGENT->DOBJ syncmapping.

## MAR 17 WED - Continuing Input Routing

* Where is **client-module** initiating the input stuff? **in `client-netdevices`**
* Where is **server-module** handling requests? **in `svc-netdevices`**

Step by step:

* [x] can client-module reuest something from server-module?
  * `NET:SRV_PROTOCOLS` should return a data structure
  * `NET:SRV_DEVICES` should return a data structure

* [x] hook app ready to test calls through NetNode?

What's next? Let's load `client-netdevices` into `FakeTrack` and figure out what needs to happen for registration

* [ ] `FakeTrack.jsx` loads UR. What does it really need to do with it?
* [ ] The device directory should automatically be populated by the module, which receives data from the server.
  * [ ] Has to register as a device with a list of named input types (trigger, vector, xyz)
  * [ ] When registered, it starts emitting its output periodically when told to.
  * [ ] Has to respond to an input control language

* [ ] The input server has to talk to FakeTrack

  * [ ] receives input frames, and redistributes them
  * [ ] receives input control modifiers (start, stop, reset, disable, rename, group, transforms) and tells devices
  * [ ] don't worry about encoding efficiency yet

* [ ] where do TRANSFORMS live? Adjustments are made on sending device, and these transforms can be overridden by another contorller that resets it, whatever

* [ ] `sim-input`  has to subscribe to all these input frames and do something with them

  * [ ] all input is mapped to a device which produces "frames" that are an array of InputObjects
  * [ ] The device logical id is managed by URSYS, and is not synched to the agent id
  * [ ] sim-input reads all the device state
    * [ ] Saves each InputObject into a buffer
    * [ ] Groups by shared groupname
    * [ ] Returns pertinent inputs by request (logical name, group name, type) as InputObjects, which are returned as object references

* [ ] `sim-agent` has to request inputs and map them to a set of agents that are input-controlled. 

  * [ ] The number of a group input type needs to produce a corresponding agent with an agentID.
  * [ ] These agents are assigned Ids from the input, since they are the defining instancer in this case. These ids will be distinct from other agents; the `MappedPool` class doesn't care if the ids are numeric or alphanumeric because it just uses `Map` to check fo uniqueness. However, the `Pool` class maps numbers; we'll have to **update** this and make sure it still works.
  * [ ] As inputs appear/disappear, the agents also have to be added/removed or maybe deadened
  * [ ] inputs objects are assigned to an agent, and it's up to the agent to figure out how to use it.
  * [ ] input objects may make use of a particle effect to show where they are


## MAR 18 THU - Continuing from yesterday's list

First things first:

### FakeTrack and NetDevices

The design of `client-netdevices` is that

* it receives `NET:UR_PROTOCOLS`  and `NET:UR_DEVICES` messages for updates
* it lets an app register itself via `NET:UR_REG_INPUT` and receives back data that's the same as what would be received by `NET:UR_PROTOCOLS` etc

* [ ] The device directory should automatically be populated by the module, which receives data from the server.
  * this is handled in `client-netdevices` hooking into
* [ ] Has to register as a device with a list of named input types (trigger, vector, xyz)
* [ ] When registered, it starts emitting its output periodically when told to.
* [ ] Has to respond to an input control language

```markdown
## SERVER INPUTS

NET:SRV_PROTOCOLS    - returns a protocols table
NET:SRV_DEVICES      - returns a device table
NET:SRV_REG_INPUTS   - accepts a protocols definition. This is called to register an input,
NET:UR_PROTOCOLS     - broadcast device list
NET:UR_DEVICES       - boradcast device list
```

Currently here's what I'm doing:

* **FakeTrack** calls the new `UR.RegisterInputs()` and passes a device definition to it.
* **RegisterInputs()** calls `NET:SRV_REG_INPUTS` with the device definition (a `udevice` structure), and receives `status` back whether it was successful along with useful data TBD. 
* On the server, **PKT_RegisterInputs()** handles the registration call, and processes the `udevice`, storing it in a table. This table is then broadcast to the entire URNET as a `NET:UR_DEVICES` message
* Back on the client, **client-netdevices** is listening  for `NET:UR_DEVICES` and maintains its internal list.

That takes care of the rudimentary registration messaging. Let's consider how we **use** those device definitions to find our inputs.

In the case of the Simulation, we might be in certain modes:

* look at list of available input devices by **type** and by **uapp** to screen for particular kinds of devices
* tag available inputs list to assign inputs with **groups** and **roles**. As this happens, the devices should updated group roles so it can display them on the device as a helpful prompt.
* When inputs are told to activate, they start sending their data as a collection of **InputObjects**
* The specific **input modules** are handled by `modules/step/` for STEP specific inputs or `modules/input` (this is a major module like sim and render) for the generic types. These modules are what handle the InputObjects and maintain their synched collection. The **api-input** is where queries can be made for current input state. 
* The **sim-inputs** module requests input state by group and role. It's responsible for providing a way to **bridge InputObjects with Agents** in the simulation. These InputObjects come from the input modules (PTrack and udevices)
* **sim-inputs** is in charge of managing the list of agents that should be created from a group/role pool with a certain blueprint. It also needs to de-assign these inputs in a way similar to PTrack.

## MAR 20 SAT

Picking up from Thursday after a long recovery period. We're working on getting FakeTrack to appear as inputs to the simulator. Focus **only** on **devices**, as we don't need protocols yet (this is the expansion of the network)

### Synchronizing `client-netdevices` with `svc-netdevices`

* [x] client-netdevices handles 'NET:UR_PROTOCOLS` message to maintain device directory
* [x] svc-netdevices handles `NET:SRV_PROTOCOLS` to register devices

The tricky part now is the **devices data structure**. But maybe it will be clearer if I design the API calls first, and call them from FakeTrack as a dummy thing. 

* [x] make `UDevice` class
* [x] split the PROTOCOL messages into `svc-netprotocols` and `client-netprotocols` respectively to make it easier to work
* [x] add device directory support to `class-udevice`, `svc-netdevices`
* [x] add registration code to FakeTrack and see that the server handles it and saves the information
* [x] make sure `svc-netdevices` receives the socket deletion message

So now the server is registering devices using the `UDevice` class! Now the **client** has to maintain its data structures to support querying for various things. This is what the incoming **device directory** looks like:

```
{ 
  [uaddr]: {
    udid, uapp, uname, utags[],
    groups[], roles[],
    inputs[]:[{ control, type }],
    outputs[]:[{ control, type }]
  }
}
```

The `uaddr` is most likely to be unique. We will probably want to search for:

* `control` (the name of the control) of a matching `type`) 
* `udid` is used to identity a machine that might have changed uaddr
* `uapp` is an app path, so can used to list only matching app types
* `uname` is the user-set name of the device

Here's the todo list:

* [ ] store the NET:UR_DEVICES information so it can be searched
* [ ] query by pattern shape `{ udid, uapp, uname, {control,type}, utags, groups, roles }`

Notes: in handle device list update, we need to also remove it with the differ from MappedPool. We might want to make a variation of **mapped pool** with `syncFromArray()`and `mapObjects()`

## MAR 21 - MAR 24 - SICK DAYS FOR TOOTH INFECTION

Dental emergency, severe tooth pain, unable to work