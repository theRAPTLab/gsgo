*warning: work in progress. parts of this is becoming obsolete as we refactor bits of it as a library*

# URNET

This is a socket server that handles the URSYS messaging, launched at the same time that the entire constellation of servers start up. 

## Concepts

The central dispatcher is URNET. 

URNET doesn't have the concept of "device addresses"; instead, clients send messsages to URNET and it will figure out where they are supposed to go. 

Internally, URNET maintains a list of connected client sockets and assigns them a unique `uaddr` id. 

The URNET server has a unique `uaddr` 

Whenever a client connects to URNET, the socket is assigned a new `uaddr` and added to an internal NETLIST. Expectedly, when the socket connection is lost the `uaddr` is removed from the NETLIST.

The client connection lifecycle is comprised of:

* `connect` - connect to the websocket, receive uaddr and other URNET info
* `authenticate ` - send authentication data, receive authentication token
* `subscribe` - request subscription to named messages
* `publish` - request receipt of named messages
* `update` - inform URNET of client changes
* `message` - send a message, optionally receive return data
* `disconnect` - leave URNET

The socket data is sent in `NetMessage` objects, which implement:

* a` message` string of the form `CHANNEL:MESSAGE_NAME`
* a shallow `data` object that contains keyed values
* a `type` indicating the type of message (signal, 
* transport props: `rdir` `seqnum` `seqlog`
* identity props: `id` `s_uid` `s_uaddr` `s_group`

The `NetMessage` class also provides the API for keeping track of asynchronous transactions across the network and returning the result to the original caller. 

## URNET Server API

implemented in `ursys/server/urnet.js`

### `InitializeNetwork( options )`

* Configure the URNET server's  `port` and `uaddr` 

### `StartNetwork()`

* create new Web Socket Server
* on 'connection' add socket and handshake with client via a registration object.
* on 'message' handle the socket message by decoding the packet
* on 'close' delete socket

### `Promise NetCall(mesgName, data)`

Server-side method to invoke a transaction on the URNET. Returns a Promise containing an array of all returned data objects. *it might be cool if this returned a NetMessage object that handled resolution itself*

### `NetPublish(mesgName, data)`

Server-side fire a one-way message to the URNET. There is no return value. Use this for signaling changes. *it might be cool if this returned the constructed NetMessage object for conceptual symmetry with NetCall*

### `NetSubscribe(mesgName, handlerFunc)`

Server-side subscribe to a message on the URNET, and route the returning packet to provide handler function. The handler will receive a well-formed NetMessage object. Return mesgName if successful, falsey if failure.

### `NetUnsubscribe(mesgName, [handlerFunc])`

Server-side unsubscribe to a message on URNET. The handler function to unsubscribe must be present to disable a particular handler, otherwise all handlers are unsubscribed. Returns an array of successfully registered function references.

### `LocalPublish(mesgName, data)`

Server-side registration of handlers for a message on URNET. It is used to signal internal server messages only (e.g. "SRV_SOCKET_DELETED" when a socket goes away)

## URNET Client API

implemented in `ursys/client/connect.js`

### `Connect(datalink,options)`

Called during client-side network initialization and handles handshake to connect to URNET. A client can maintain multiple endpoints for URNET messages, so a `datalink` object is used to identify who is making the connection. 

* retrieve URNET host and port from stored session values (injected into the client webapp on load)
* create a websocket
* on 'open' set status to "connected"
* on 'message' redirect to `m_HandleRegistrationMessage`
* on 'close' go to "offline" mode

 `m_HandleRegistationMessage` does the following:

* convert the raw message into a NetMessage object
* extract registration data received from URNET and configure its messaging infrastructure
* sets defaults for NetMessage objects created by the client
* reset 'message' handler to `m_HandleMessage`

`m_HandleMessage` takes over communication with URNET, and routes incoming messages using the utilities contained in the NetMessage objects received over the network.

* convert the raw message into a NetMessage object packet
* if the packet is the returning values for an outgoing NetCall, complete the transaction callback
* otherwise this is message from the network to handle, so handle through the `datalink` dispatcher.

`ULINK` is the datalink module, and it is assigned to the `datalink` parameter received by `Connect()`.  

## Channel Architecture

May 13 2020

I've renamed URLINK (formerly URDATA) to URCHAN, as these are "channels" currently consisting of a local origin id. There is a name parameter also that isn't used for routing, merely for identification, but this should probably be used for the upcoming **channel support** where we have `SIGNAL`, `SERVER`, `NET` and `LOCAL`.  Currently this is implemented in a rather adhoc way and it could be a lot clearer.

* SIGNAL - used for raising events that everyone should respond to.
* LOCAL - used for messages that only non-callers respond to
* NET - used for messages sent/received from remote devices
* SERVER - used for messages between the server. May be multiple server channels.

Call Publish Subscribe

require: s_uid for object using UR, unique to application, used to check for reflecting messages back in the case where the caller/publisher is sending and receiving on the same message channel. This is like a NOTIFICATION PARTY LINE message, maybe like a token ring?

There's also a SIGNAL LINE that works like an interrupt that all subscribes need to respond to. These are more system level events, when the signal is used to initate a change or update data. It's a 1-way broad of data. 

CALLS are used to implement remote methods. 

There's only one SUBSCRIBE feature, and it's used to implement all three things. Maybe this is not a good idea, because it's not exactly one-size fits all.

## Examples

This was added to `pages/index.jsx` during testing to print a counting tick handler.

``` jsx
import UR from '@gemstep/ursys';
import { useURSubscribe, useInterval } from '../hooks/use-ursys';

function Page() {
const counter = useRef();
  counter.current = 0;

  // TEST 1
  function handleTick(data) {
    const { tick = '', source = '', route = '' } = data;
    console.log(`TICK ${tick} ${source} ${route}`);
  }
  useURSubscribe('APPSTATE_TICK', handleTick);
  //
  useInterval(() => {
    UR.Signal('APPSTATE_TICK', {
      source: 'src:1000ms timer',
      tick: counter.current++
    });
  }, 1000);

  // TEST 2
  function handleHello(data) {
    console.log('RESPONSE "HELLO_URSYS"');
    // I'm sure you don't really want this, just being thorough
    let out = '. got';
    Object.keys(data).forEach(key => {
      out += ` [${key}]:${data[key]}`;
    });
    data.fish = 'mackerel';
    out += ` ret [fish]:${data.fish}`;
    console.log(out);
    return data;
  }
  useURSubscribe('HELLO_URSYS', handleHello);
}


```

## Module Design Notes - based on MEME version of URSYS

### 1. URNET.StartNetwork()

```
URNET.StartNetwork
  m_SocketOnMessage() handles everything
  implements 
  	LocalPublish, 
  	NetCall,NetPublish,NetSignal,NetSubscribe,NetUnsubscribe
		* remember publish/subscribe and call/signal are competing standards
		* so have to PICK ONE
	PKT_RegisterRemoteHandlers
  ServiceList()
  StartNetwork()
```

### Messager Class - implement a network-aware message send/receive

This is implements the low-level message dispatch and message receive protocols. 

* defining message reciever: can be flagged to ACCEPT network calls
  * maintains the map of messages and their receiver functions
* using message senders: can selectively invoke local or remote (or both) messages under three protocols
  * if program invokes locally-defined message, calls the function in that map
  * if program invokes remote message, send a NetMeessage
  * the invoked function that eventually runs (either local or on remote machine) returns data to either acknowledge receipt internally or return data asynchronously for the 'mcall' protocol
* stores all message definitions

```
MESSAGER
handlerMap = Map<message,Set>

Subscribe(mesgName, handlerFunc, options)
- registers a handlerFunc to a mesgName
  options: handlerUID, syntax, fromNet
  . options are attached to the handlerFunc if they exist
  . handlerUID is used for routing an incoming message to the correct instance
  . handlerUID is generated by ULINK, which is the user of MESSAGER
  . fromNet marks a function whether it accepts network calls or not (local vs net handlers)

Unsubscribe(mesgName, handlerFunc) 
- removes all handlers for (a) everything or (b)a specific message, or (c) a specific message handler

Publish(mesgName, inData, options)
- provided with opt.srcUID, will figure out what to send where, local or network
	options: srcUID, type, toLocal, toNet
	. for local calls (toLocal), invoke handlerFunction (but not to srcUID)
	. for net calls (toNet), make a new NetMessage packet and send with pkt.SocketSend()

Signal(mesgName, data, options)
- Signal can trigger itself, unlike Publish()
	options: srcUID + Publish options
	. sets options.srcUID to null
	
CallAsync(mesgName, inData, options)
- handles any incoming message, local or network, stubs for channel-awareness
	options: srcUID, type, toLocal, toNet
	extracts channel from split ':' as "channel:message"
	creates promises for local or network calls
	IF TOLOCAL
    foreach handler:
      CHECK: toLocal and channel.LOCAL and !fromNet -> error "local calls should not have prefix LOCAL"
      CHECK: fromNet and !handlerFunc.fromNet -> error "receive netcall for non-netcall handler
      CHECK: srcUID===handlerFunc.ulink_id -> error "calls can not call its own node"
      CHECK: no handlers for mesg -> promises.push({error local message handler not found})
      promises.push(promise with handlerFunc via f_MakeResolverFunction(handlerFunc)
  IF TONET
  	CHECK: channel is NET (begins with "NET:")
  	ensure type is set to 'mcall' if not overriden by options
  	create new NetMessage(mesgName, inData, type)
  	promises.push(pkt.PromiseTransaction())
```

### ULINK Class - Implement Endpoint for Local Code

* ULINK instance wrap MESSAGER send/receive functions with a unique ID (UID)
* wrap Subscribe/Unsubscribe
* wrap Publish, Signal, Call
* send list of MESSAGES to server `NET:SRV_REG_HANDLERS`

```
URLINK CLASS - create endpoint in the URNET
class static properties:
- UNODE_MAP<uid,instance>
- MESSAGER instance (shared for all UNODEs)
class instance:
- props: uid, name

// setting up handlers: have a home UNODE, and optionally can listen to network messages
Subscribe(mesg, handlerFunc) 
- attaches handlerUID option for MESSAGER.Subscribe (implicitly both local)
NetSubscribe(mesg, handlerFunc)
- attachs fromNet:true, handlerUID options for MESSAGER.Subscribe
Unsubscribe(mesg, handlerFunc)
- call MESSAGER.Unsubscribe

// three kinds of message invocations
Call(mesg, outData, opt)
- set opts type:mcall, srcUID for MESSAGER.Call
Publish(mesg, outData, opt) 
- set opts type:msend, srcUID for MESSAGER.Publish
Signal(mesg, outData, opt)
- set opt type:msig, srcUID for MESSAGER.Signal

// variations
LocalCall(mesg,outData,opt) - toLocal true, toNet false -> this.Call
NetCall(mesg,outData,opt) - toLocal false, toNet true -> this.Call

// handler registration
RegisterSubscribers(messages=[])
- either send message list after validation, or sends current message names in MESSAGER
- then special NetCall('NET:SRV_REG_HANDLERS')
- return result, which is a Promise
```

### NetMessage Class - Message Transport

A common data class that is used both by server and browser code.

```
NETMESSAGE CLASS
class static properties:
- enum mode: INIT, ONLINE, OFFLINE, STANDALONE, CLOSED, ERROR
- enum channels: LOCAL, NET, STATE (local is never broadcast)
- transactions: Map<hashkey,Promise resolver>
- netsocket: the global netsocket (set in browser only)
- group_id: session key/token
class instance:
- payload props: msg, data
- protocol props: type, rmode, 
- routing props: id, seqnum, seqlog, s_uid, s_uaddr
- special props: s_group
- debugging props: memo

SocketSend(sock=netsocket)
- send JSON serialized version of NetMessage on socket

// used to lookup a transaction by packet signature
m_GetHashKey(packet)
- return hash of SourceAddress and packetID
- used as a hash key into the "active transactions" table

// to initiate a transaction, the originating caller uses:
PromiseTransaction(sock=netsocket) 
- rmode defaults to 'request'
- seqlog.push(local UADDR) to keep a log of visited sockets
- make Promise that stores its resolve function in transactions map
- this.SocketSend()

  >> MESSAGE BROKER ON SERVER
     implemented in server-network
     
     m_OnSocketMessage()
     - redirects packets of type msig, msig, mcall to m_HandleMessage
     - redirects packets of type state to m_HandleState
  
    async m_HandleMessage(socket, pkt)
>   - if pkt.IsResponse() - this is server's own initiated transaction and CompleteTransaction() to REMOTE, which can ALSO be forwarded message!!!
      note that response packets are only for REFLECTED remote handlers. 
    - otherwise it's a new message
      - first check if server has handlers for this message, and invoke them, returning a resolved promise for each
      - if no promises were returned, then see if there are remotes that have implemented this message
>    		for a handled message, return pkt.PromiseTransaction() for every remote socket implementing message
        this forwards the packet to the remote, which will come back 
      - if no promises, then error "no handler"
  	
  	*** MAGICAL pktArray = await Promise.all(promises) ***
  	
  		// EXECUTE PROMISED SUBSCRIBER ON REMOTE
  		   implemented in ur-network
  		   
  		   if pkt.IsResponse() pkt.CompleteTransaction()
  		   handle protocols:
>  		   - msig: ULINK.LocalSignal, then pkt.ReturnTransaction() 
				 - msend: ULINK.LocalPublish, then pkt.ReturnTransaction()
  		   - mcall: ULINK.LocalCall({fromNet:true})
  		   	then get return data, put in pkt.data
>  		   	pkt.ReturnTransaction()
  		
  		// back to server
 
 		... time passess while promises resolve across network ...
 		
  	- pktArray contains all returned data from Promises, if any
>  	- check protocol !mcall, return void
  	- for protocol mcall:
  		merge retvals into aggregate data object
      put aggregate data object into pkt.data
>     pkt.ReturnTransaction() - sends it to originator
      
   << MESSAGE BROKER END

// the recipient caller of a transaction
ReturnTransaction(socket)
- seqlog.push(local UADDR) which is the RECIPIENT
- set rmode to 'response'
- this.SocketSend()

// the originating caller receives the response
CompleteTransaction()
- recreate the hash key from the received object
- see if it is in the transactions table
- call the resolver function with the received packet data, which resolves the Promise
- remove hash from transactions table
```

### Sockets - Connection Management

```
app configuration (in MEME...it's different from GEMSTEP)
- window.URSESSION contains
	CLIENT_IP, UADDR
	USRV_Host, Ip, MsgPort, UADDR

server-network
on connection
	m_SocketAdd(socket, req)
	- assign new UADDR
	- attach UADDR, ULOCAL to socket object
	- save socket by UADDR in mu_sockets map
	m_SocketClientAck(socket)
	- on a new socket connection return data
	- data: HELLO, UADDR, SERVER_UADDR, PEERS, ULOCAL
	- data: anything extra (possibly JTW)



```

