*warning: parts of this is becoming obsolete as we refactor bits of it as a library*

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

## Integrating into GEMSTEP

### Where do our non-React methods initialize?

In the past, we had these key lifecycle events. I've reorganized them slightly here.

Application lifecycle

* INIT - define/allocate storage for the app 
* NET_INIT - connect to URNET socket server
* LOAD - load external media assets and data
* CONFIG - configure/populate data structures
* DOM_READY - dom is stable and rendered (should be disabled)
* RESET - clear data structures for runtime
* NET_APP_INIT - time to register initial subscribers and peer conditions
* START - prepare to run, check for initial conditions, set initial values and state
* RUN - activate ui elements
* UPDATE - periodic update timer with elapsedMS and step 0|increment.
* STOP - application stopped
* UNLOAD - deallocate resources
* SHUTDOWN - close application

UR Application lifecycle

* NET_APP_ONLINE - received after successful UR registration
* NET_APP_QUEUED - received if queued data was received
* NET_APP_EXCEPTION - received when connection drops, restored, times out
* NET_PEER_UPDATE - received when change in peer conditions occur
* NET_APP_UPDATE - received when UR changes an app 

Internal socket connection status

* OFFLINE - socket connection not yet initialized
* CONNECTING - socket connection attempted
* CONNECTED - socket connection connected
* RECONNECTING - socket connection is attempting to reconnect
* LOST - lost connection; stop trying

Application Runtime Interrupts

* PAUSE - request to suspend UPDATE lifecycle events

* UNPAUSE - request to resume UPDATE lifecycle events

  

Internal URSYS application status

* uaddr connecting
* uaddr connected
* uaddr register messages (call again to change list)
* uaddr setstatus (lifecycle)
* uaddr disconnected
* uaddr reconnecting
* uaddr reconnected



