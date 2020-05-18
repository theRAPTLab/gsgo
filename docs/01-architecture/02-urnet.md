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

