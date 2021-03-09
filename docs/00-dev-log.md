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
* W2: multinet design, start implement of directory. URSYS call bug found.


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
             * See the special excerpt about `MAGICAL ASYNC/AWAIT BLOCK` above to understand how it works.


### New Insights, Debug Transaction Time!

It's much clearer now how this works. The critical bits that pertain to network calls (which are the only type that return data)

* originator sends a packet of type `mcall` and rmode `req` via `transactionStart()` which also sets `seqlog` to have a first value of the originator's uaddr
* broker server  `m_RouteMessage(socket,pkt)`  receives the socket and packet. This entire method has `socket` and `pkt` in its closure which helps it work like an asynchronous sleeping thread. In this method:
  * broker clones original packet and creates a Promise for each remote implementor that uses `transactionStart()` for each one. 
  * **still in the same call invocation**, `let retval = await Promise.all(promises)`  suspends the thread until all promises are resolved. Those promises are resolved by *subsequent* calls to`m_RouteMessage()` that are detected as 'returning transactions'.
  * **after Promise.all() in the same call invocation** the returned values are in an array of objects that are the returned values from remotes. These are all merged into a single return object currently.
  * **at the end of the call invocation** the original packet has its data payload updated and`returnTransaction()` sends the packet back to its originator.




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

