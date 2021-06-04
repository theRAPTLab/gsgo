PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY  S2107 APR 05 - APR 18**

* W1: CharControl, DeviceSub, Directory, Data Structure documentation
* W2: Device Define/Publish, Subscribe/Read Complete DR01!

**SUMMARY S2108 APR 19 - MAY 02**

* W1: GetInput API, DiffCache Buffer Mode
* W2: Notification, start break.

**SUMMARY S2109 MAY 03 - MAY 16**

* W1: Break cont'd. CodeReview of May Pilot. Meeting with Researchers
* W2: Meeting followup. Discussions on Feature and Phases.

**SUMMARY S2110 MAY 17 - MAY 30**

* W1: ifExpr bug
* W2:Fix underlying "block chaining" bug in script-parser

**SUMMARY S2111 MAY 31 - JUN 13**

* W1: Ponder GraphQL with overall server needs.

---

# SPRINT 2111 / MAY 31 - JUN 13

## August Pilot Priorities

* Tinting Feature
* Spawning Feature
* Script Wizard UI
* Line Graph Widget
* Differentiated render view
* PTrack cursor
* Creation/Spawning
* Sim on Server
* Multihost URNET
* How to measure socket backpressure

### Specific Systems

* Design the Locale System
* Vector Math
* State System
* Time Sequencing Systems and Expression in the Script Engine
* Mini Rounds
* Zero-config URNET/AppServer

### Research / Design

Review this list on Monday with Ben to make sure this is on the right track...this thinking.

* review lightweight component library thi.ng/umbrella
* how to manage mini rounds?
* how to manage timers? the `every` keyword, in particular, how to delay before start, doing things periodically

## MAY 31 - Sprint 2111 Ramp up

* **add a SRI label for project stuff** initially to show what I'm looking at/interested in.
* make sure issues I'm working on are part of the upcoming milestone (use filtering on the board to set this)
* bill exploring "what is new in the code" to the appropriate Sri Task issue; there's a catch-all Refactor/Dehackifying/Cleanup issue
* make my own dev continuity and store it somewhere,
* try to figure out a way of capturig information that is immune to underling code changes/renaming (intent?)
* instead of using issues as something to be compelted, but saying where to direct my attention and let curiousity touch whatever needs touching. 
* Ping Ben when I start looking at code he's written. I might start with an intent.

## JUN 02 - Ben's Recent Additions

Merge #100 (Foraging) - what can agents see

* Vision Feature
* Movement Feature Updates
* Costume Feature Updates

Curious how the vision stuff is implemented.

**Most immediate need** is the locale system. Current stuff is in `dc-input`, also in `step-tracker` , model data structures are stand-alone, there is some stage bounds. Normalization system. Also having some kind of dictionary to have text for specific things.

Overall application database stuff (where to store strings). 

Asset manager, access models. 

* make a simple locale system. **remember to form a question**

**Q. How is locale data made accessible to ALL modules in the appserver AND in other servers and clients?**

A. It has to be centralized somehow. It could be a module or package itself with that information in it, or a server in its own right. It might make sense that the **appserver** is responsivle for providing centralized access to locale data.

```
ptrack, pozyx are devices
the device declaration looks like
    this.udid = DATACORE.GetNewDeviceUDID(); // in DATACORE
    this.meta
    	.uapp
    	.uaddr
    	.uclass
    	.uapp_label
    	.uapp_tags
    	.uname
    this.user
    	.uident
    	.uauth
    this.student
    	.sid
    	.sname
    	.sauth

```

**Q. Will GraphQL be helpful? What the hell is it?**

```
REST
/url/location over http, authenticate from path, return data to client
fetch tables of data, and get everything that's in them, then process on client
- overfetching data
- 1-N underfetching
- REST requires awareness of endpoints for every possibility...zillions of them, and client has to know the shape

GRAPHQL
* fetch from any endpoint, typed data, stateless, cacheable
* clients request SHAPE of response it wants

GraphQL defines a 'schema' that describes what the server will accept. These are typed simply as 'String, Float, Int, [Int]' being a list type. 
The schema is connected to 'resolvers' that are an object that implement functions that handle the various things defined in the schema.

The Expression version will use middleware to initialize the server and just start listening. There's an intereactive query interface (graphiql) that can be used to inspect it.

Arguments are passed as named properties with a type. 
type Query { rollThreeDice: [Int] }
verus
type Query { rollDice: Int!, numSides: Int) : [Int] }
the resolver receives an 'args' object that can be destructured by name

when client requests data, it passes the arguments into the query string.
var query = `query RollDice($dice: Int!, $sides: Int) {
  rollDice(numDice: $dice, numSides: $sides)
}`
const dice = 3;
const sides = 6;
fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: { dice, sides },
  })
})
  .then(r => r.json())
  .then(data => console.log('data returned:', data));
  
 FANCINESS
 You can specify a CLASS to resolve your queries.
schema: type RandomDie { methods }
				type Query { getDie(numSides:Int) : RandomDie }
				
class RandomDie
	constructor(), methods
	
root: {
	getDie: ({numSides}) => new RandomDie(numSides||6)
}

We've defined the schema to have a getDie methods that returns a RandomDie object
The root is bound to our Randomdie implementation by creating a new class instance and invoking the method on it.

To fetch this in the client, the query is:
{
  getDie($numsides) {
    rollOnce
    roll($numRolls)
  }
}

to ALTER data, use the Mutation Type
type Mutation { setMessage():String }
type Query ( getMessage: String ) 
also we have input types like: 

input MessageInput {
  content: String
  author: String
}

can only be sclaras

schema language:
type: defines an object with fields
type Query and Mutation are special names: entry points inot the schema, but are otherwise the same 
enums!
special types defined: e.g. scalar Date
enums e.g. enum Episode { NEWHOP, EMPIRE, JEDI }
interfaces! similar to typescript
inputs: defining a bunch of allowed input objects with properties
subscriptions: re

The Apollo Server docs do a better job of describing this:
https://www.apollographql.com/docs/apollo-server/schema/schema/

Example LokiJS example:
https://github.com/t-fitz/GraphQL-Node-Example a basic one to study

check errors or data to determine success
  
```

## JUN 03 - GraphQL Integration

Reviewing our server architecture:

* URSYS implements ur-server, which loads...
  * NETWORK server-urnet
  * NETINFO server-netinfo

* GEMSRV loads UR-SERVER during GEMSRV_Start() in the following sequence
  1. GEMAPP.StartAppServer(opt)
     only option is 'skipWebCompile' for old MEME standalone
     compiles app to serve with webpack
     loads up the middleware for compression, webpackdevserver
     add cookies middleware
     enables cors
     handles path /, /app, /app/* to point to index.html which is the web app entry
     setup Express_NetInfo webserver responder
     serve static files using Express.static

  2. UR.Initialize([Tracker.StartTrackerSystem])
     the inits array just invokes a list of functions, from old PLAE can be removed
  3. `UR.URNET_Start({ port, name, path })` to start netbroker
     NETWORK.StartNetwork(options)
       options shared with startup
     NETINFO.SaveNetInfo(m_netinfo) - save network options host port urnet_version uaddr

       review 

## JUN 08 TUE - REVIEW and FOCUS

BEN: Currently, "main" has the setup. One server, one project would be easier. We do have some facility for opening different projects. You can open a script for another project and actually submit it to the main server.

"Main.jsx" is the page that decides which simulation to load. It holds the project data odule that in turn starts the simulation. 

Models are **Projects** - "activity kit" is self-contained, declares its input and output needs, and is capable of adapting its lifecycle phases to work with what it has even if that's "can't run"

* Project definition: we can look at the project files, we can derive the keys, look in **acquatic.js.**

  * scripts, instancedefs, metainfo, screenBounds, wrapping, color
  * each script defines characters and agents
  * each character has parameters about how inputs are handled

* Projects live in the context of a "Project workflow", which is the set of all "moves" that can happen.

* Projects can have multiple models and activity bundles

* how to user-select, program access

To have a Moth Activity that is the umbrella project that directs you to day 1 or day 2. It's like a box of stuff. Something as easy as giving commands to kids in realtime. 

 **ACTIVITY TO MAKE A PASS ON** - 

* State Management for Locales, 
* Mini-Rounds. 

I think I can modify a copy PhaseMachine source into a state machine that handles Mini-Rounds. Incorporate. Ben adds "in our pre-run" loop physics and update. 

### State Management for Locales

This is a collection of properties, really. Just need to know where they are, and how to access them. 

**Q. What is Locale Data?**
A. Right now, just a bunch of **system** properties that are specified by a particular installation context. Right now that is TRANSFORM and SERVER information that has to be hardcoded

**Q. How to specify a locale?**
A. I'm thinking a **pre-defined locale string** , which can include some generic setup types. On system startup, the local string is somehow specified (maybe by MAIN) and then this configures the system.

**Q. How to set a Locale property?**
A. This is ideally a **database** that's stored on a server on the Internet. For now, we cn make it a service call to the AppServer called `GET_LOCALE` and `SET_LOCALE` which will read/write the entire prop. That means we also need to have some kind of **authentication** in eventually.

**Q. Who uses Locale data?**
A. The primary user right now is the tracker system. We'll hardcode these keys into the LocaleManager.

**Q. What is the Locale Manager and where does it live?**
A. It's a database service on the backend, but the web clients will access it as a manager. In that sense it's a datacore module, but at the URSYS level. I think we'll implement it as `svc-system-props` or something like that, essentially a key-value store in a graphql module.

**Q. What about User Data?**
A. I think this will live in `svc-session`, as data related to a particular authenticated entity is retrieving data that it's allowe to retrieve based on keys. It may access the central graphql module.

```
PTRACK TRANSLATION MATRIX
width, depth, offx, offy
xscale, yscale,
xrot, yrot, zrot

POZYX TRANSLATION MATRIX
...
ROOT_SERVER: host or ip address
RESEARCH CONTACT: { }
ADMIN CONTACT: { }
```

**Q. What does the API look like?**

```js
do we set the locale system wide, or leave that up to the calling app? I say we set it globally within UR. It becomes system state.

TRACKER CONTROL sets the locale information, or can edit it.
The locale information is stored in SystemDB, our persistent data store.
SystemState can use SystemDB to initialize its initial stuff.

On AppServer launch, it pulls the locale data and serves it up, based on the 

```

