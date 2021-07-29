[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

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
* W2: Locale system design

**SUMMARY S2112 JUN 14 - JUN 27**

* W1: Mini Rounds Discussion. URDB+GraphQL+Loki design
* W2: Matrix Math Review. Data structures for Locale.

**SUMMARY S2113 JUN 28 - JUL 11**

*  W1: Pozyx review, GraphQL client, State Change Proto
*  W2: Appstate-React, AppCore definition and conventions

---

# SPRINT S2113 - JUN 28 - JUL 11

## JUN 28 MON - Gathering Thoughts

* [x] add graphql-tools: schema, merge, load-files
* [ ] decide how to organize schema files

in GEM-APP, there is a config directory where we can put our graphql-related schema things. Here's how it looks now:

```js
  UseURDB(app, {
    dbPath: 'runtime/db.loki',
    importPath: 'config/gql/db-default-data.json',
    schemaPath: 'config/gql/db-schema.gql',
    root: db_resolver
  });  
```

With `graphql-tools`, we have `schema` to create an "executable schema". 

``` js
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
type Query {}
type Mutation {}
type Post {}
`;

const resolvers = {
  Query: {},
  Mutation: {},
  Post: {}
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
```

We can use this to create modules that handle specific bits of the schema. The `loadFilesSync` method will merge scehm

``` js
const path = require('path');const { loadFilesSync } = require('@graphql-tools/load-files');const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');const loadedDefs = loadFilesSync(  path.join(__dirname, './types'),   {     recursive:true,     ignoreIndex:true  });});const loadedResolvers = loadFilesSync(  path.join(__dirname, './resolvers'),  {  	recursive:true,    ignoreIndex:true  });)};const typeDefs = mergeTypeDefs(loadedDefs);const resolvers = mergeResolvers(loadedResolvers);const schema = makeExecutableSchema({  typeDefs,  resolvers});module.exports = schema;
```

I think we will have separate files for schema and resolver. 

Naming conventions:

* `[label]-resolver.js`
* `[label]-schema.graphql`

### Ok let's try to make this multi-load work

* [x] add dynamic collection loading from init/db.json
* [x] add `gqlPath` to `gem-app-srv.UseURDB()` setup
* [ ] rewrite `UseURDB()` to use graphql-tools to load globs

**FAIL**

Stuck loading resolvers. It appears that there is a critical error when loading `@graphql-tools/load-files`... webpack is trying to find the module and it is failing. But why is webpack trying to do this at all??? It's because URSYS is using webpack to compile its stuff...**it can't find the files** at runtime within the library itself. So this might have to get moved to `gem-srv`

`Critical dependency: require function is used in a way in which dependencies cannot be statically extracted` is the error that webpack is throwing, because we're trying to do a dynamic load through `graphql-tools/load-files` `loadFilesSync()`, and webpack has rewritten `require` to look for modules that are defined in URSYS, not in GEMAPP that's calling it.

After farting around with it for a while, dropped the feature until NEXT TIME. It would be difficult to refactor this now and risk breaking things.

### Jumping Forward: Adding the New Schema for Complete Locale Info

I have that code above (which needed modifcation):

* [x] add new `config/graphql/schema.graphql`
* [x] add new `config/graphql/resolvers.js`
* [x] update `config/init/db-test.json` to initialize database

## JUN 29 TUE - Tracker UI

* [x] is PTrack subsystem working? YES, right up to `m_ForwardTrackerData()` in `step-tracker.js`
* [x] so we just need to plot the coordinates on the screen itself within my Tracker utility

Aside: The challenge of nested components is:

* subcomponent can handle its own state changes
* subcomponent can send changes to a central dispatching logic thing
* changes to central dispatching logic are also reflected in the subcomponent

This suggest that there is a single source of truth for state, which is what Redux is useful for once it's connected to React via React-Redux. But it is a somewhat awkward mechanism because of the amount of indirection.

In the FakeTrack code, the **single source of truth** is `elements/dev-faketrack-ui`, which

*  exports `Initialize( rootComponent )`, assuming that the rootComponent is never unmounted. 
*  exports `HandleStateChange(name, value)` so this module can maintain its state. It expected to receive UI element state, NOT application logic. This module just holds UI state

It also adds **non-react events** to the base canvas in `container`, and 

* [ ] want the UI from CharController moved to Tracker
* [ ] add the dropdowns for locale and system (ptrack or pozyx)
* [ ] write change handlers

DETOUR...have to deal with POZYX code and new CONTROLLER code which seems to have gotten mixed-up in `api-input`. POZYX code is not following the conventions for PTRACK as a module template.

```
NOTES on dc-inputsPOZYX_TRANSFORM is in dc-inputsPOZYX_TO_COBJ creates InputDef COBJs from entityGetTrackerMap() returns POZYX_TO_COBJNOTES on api-input* in StartTrackerVisuals(), the entities are being pulled from PTRACK.GetInputs() and then synced to control objects.WHY IS THIS IN PTRACK?* PTRACK has been hacked to also send pozyx data??? I guess this is similar to FakeTrackNOTES on step-tracker.js* This has new mtrack_ss which is "mtqq", which is pozyx* The MTQQ address is handled by library connecting to a particular port in `m_BindPozyListener()`* The key routine is `ConvertMQTTtoTrackerData()`
```

I've documented the issues with the weirdnesses of pozyx in a [Gitlab issue](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/230)

---

Ok, what do I need to fix in this pile of stuff? Argh. 

**Q. Is FakeTrack data even coming through?**
A. It should come in through in-ptrack, which provides `GetInputs()` to return all the entities. However, `api-input` is actively blocking anything that isn't pozyx by seeing if the blueprint is attached to the input. **I do see it coming**/

**Q. How do I fix this POZYX mess?**
A: Decouple the pozyx stuff from ptrack. 

**Q. Why are blueprint names coupled to control objects? How is `bpname` used?**
A. Control Objects are converted into 'InputDef' as they come in from the tracker. 



## INPUT SYSTEM SYNOPSIS (WIP)

The INPUT system should be independent of SIM and RENDER, as one of the three major function tpes in the GEMSTEP system. Currently, it has hacked-in SIM data. The pattern I'm seeing is that control objects have SIM-related logic injected data at the INPUT stage, rather than INPUT groups being tagged by SIM, which is what is creating the coupling problem.

The injected SIM data is primarily **blueprint name**, which is assigned by an originating Character Controller that presumably is setting the blueprint name itself. The list of valid blueprint names is created by scanning the `model.scripts` entries for a `isPozyxControllable` property flag. 

### REDIRECT to TRACKER

Let's just get the UI to update state, and then I'll talk to Ben about using this thing. 

* [x] hook state change module into dev-tracker-ui module
* [x] read locale from graphql
* [x] add ui-state as single source of truth
* [x] hook ui-state into constructors of state-based form elements
* [x] hook HandleStateChange into form element change handlers

### Reading Transform from Selected Locale

* [x] Given the Selected Locale, we want to 
  * get the locale list
  * read the transform data for that locale
  * write to the UI
* [x] When using dropdown, do the above!

> We need to make some changes for how to handle state and state rewriting. It's a bit convoluted right now but the list is updating now; clean it up tomorrow.

### Writing Transform on Edit

Right now what happens? We loop our own state manager into React.

* when you type into a text field, the event is routed to our state handler to update its state. 
* The state manager then notifies any subscribers of that state change, and another handler in the component translates that to local state (the ui state)
* React components whose `render()` function refers to its internal state then update based on its state

We might have better luck intercepting through:

```js
// Happens before the component updatecomponentWillUpdate(object nextProps, object nextState)// Happens after the component updatecomponentDidUpdate(object prevProps, object prevState)
```

To **write the transform**, we want to check for changes to the transform, and autowrite it back if there are no changes.

* [x] in dev-tracker-ui, `HandleStateChange(section,name,value)` might be the trigger. This is the state write, so now it's called **`WriteState(`**`section, name, value`**`)`**
* [ ] It both does `STATE.SetState()` and `PublishState()` 

We need the concept of a STATE BACKING STORE?

## JUL 3 SAT - Taking a Step Back

I have a rudimentary setup working, but I need to consider the **difference** between "transient state" and "persistent data" once and for all. 

* document [modularity.md](02-concepts/modularity.md) complete

### Resuming State Design

I've moved a lot of stuff in dev-tracker-ui into `client-appstate` in URSYS. 

* [x] update `InitializeState()` to accept either a query or an object, and then return the state
* [x] New UR `client-appstate` implements the state stuff that was in `mod-devtracker-ui` but the logic for updating is still a little convoluted to follow.
* [x] commit current refactoring of DevTracker

There's a convention to follow:

* each component inspects incoming URState changes and converts to its flat object hierarchy. 

## JUL 5 MON - Working UI, Now Write Transform to DB

The transform is updating, but can we **write changes**?

* [x] write a hook intercepter
* [x] write mutation code through `UR.Query`
* [x] update logic for updates to React

This is a bit terrible because updating state is so finicky and there is a lot of "keeping in sync". I should update the SetState functions so the mapping is a bit better 1:1 with React and My own state.

However **the database round trip** works at least. Next step: *REFINEMENT* and *SIMPLIFICATION*

## JUL 6 TUE - Reviewing Store->Database->React

Let's start by writing documentation

#### CLIENT-APPSTATE

```
Part of URSYS

The APPSTATE is divided into "state groups" that are intended to be used by multiple components. APPSTATE is a form of "intermediate data" that's used to feed the GUI with either derived data sources or switches that affect how the GUI is rendered (e.g. "modes")

Before the root React component loads, you should call InitializeState() with either a GraphQL query string or a state object with the various "state groups" in it. The initial set of state groups determines what is allowed to be changed later as a naive error checking feature. There is no error checking within the state groups themselves.

If any of these state groups are updated, components that have registered interest with that group through SubscribeState() will receive those group changes with a { [group]:data } format, which gives the component(s) an opportunity to translate it into local React state to effect a refresh through React.Component.setState()

Likewise, to synchronize intermediate data from React to APPSTATE, the HandleStateChange() receives group, prop, value. This also has the effect of Publishing the state back out, after it hs been saved to APPSTATE. 

IMPORTANT: If a component is the SOURCE of changing data through its UI (i.e. it's handling UI events through a change handler), your changeHandler should set up the UI element as CONTROLLED and NOT call setState directly. Instead, shoot it to HandleState() from your change handler, which will then call to the Subscriber handler you registered which will invoke setState();

If you need to updated multiple groups, called HandleStateChange() multiple times. If you need to provide specific logic to rewrite the data before it goes out (perhaps you have some local implementation of state that is not shared) then use HookStateChange() in your Component to provide a function that reads the [group,prop,value] signature and returns modified values.

* InitializeState( queryString | obj )
* HookStateChange( hookFunction )
* UnhookStateChange( hookFunction )

* UpdateStateGroup( group, data ) 
* UpdateStateGroupProp( group, prop, data )
 
* ReadState()
* ReadStateGroup( group )

* HandleStateChange( group, name, value )

* PublishState( change=undefined )
* SubscribeState( handlerFunction )
* UnsubscribeState( handlerFunction )

```

#### CLIENT-URDB

```
part of URSYS

Implements the GraphQL client interface. The query is in GraphQL Schema Definition Language (SDL), and can refer to $vars that are defined a variables object. If an error occurs, the module attempts to emit them to the console, otherwise it returns a response object of the form { data: {...} }

* Query( query, variables )
```

#### SERVER-URDB

````
part of URSYS server

To enable GraphQL services, your Express server can use our "LokiGQL Middleware" with the following call
​``` js
// app is an Express app
// UR is @gemstep/ursys/server
UR.UseLokiGQL_Middleware( app, {
  dbFile,
  dbImportFile,
  doReset,
  schemaFile,
  root
});
​```
* dbFile - path to loki file to use for persistance (e.g. runtime/dn.loki)
* dbImportFile - path to a json collection to initialize an empty database
* doReset - if set, the DB is erased and importFile is loaded if specified
* schemaFile - path to GraphQL Schema Definition file
* root - a resolver object (see ExpressGraphQL docs)

NOTE: the GraphQL endpoint is defined in ur-common and defaults to domain://urnet/urdb
NOTE: the live query interface is enabled; browse to GraphQL endpoint to use it
````

#### Model Data Format Reference

```
MODEL: {
  label: 'string'
  bounds: {
    top: right: bottom: left: 
    wrap:[bool,bool]
    bounce: bool
    bgcolor: 24-bit integer
  }
  scripts: [
    {
      id: 
      label:
      isControllable: bool
      script: 'ScriptText'
    }
  ]
}
```

### NEW APPROACH: AppCore Modules and StateGroup manager

I've made a new `appcore` directory in the same level of `datacore`, which contains various `ac-name.js` modules that are loaded by `appcore/index.js` 

#### Anatomy of an Appcore Module

Like datacore modules, appcore modules provide an **Access API** for key information that is relevant to an application. Appcore modules can make use of datacore modules AND provide glue between different modules; it's a way of providing a certain kind of implementation-specific operation that can be shared across multiple apps. The intent is to replace the cloned `dev-tracker-ui` modules which wer handling everything. 

Appcore modules are scoped to perform a particular kind of operation to keep code size small. In addition to creating derived data from DATACORE and synthesizing other data between modules, Appcore can include **StateGroup** objects to maintain "state information" that might be of interest to other apps or components using this module. 

**StateGroup Manager Class**

```
STATE VALUES

* new StateGroup( queryOrStateObj )
* async initializeState( queryOrStateObj )
* updateKey( name,groupObj | stateObj ) - sets entire groups by key
* updateKeyProp( name, prop, value ) - sets specific prop within group
* stateObj(...args) - return a stateObj with specified keys, or entire state

STATE CHANGE REQUESTS

* handleChange( key,prop,value ) - incoming changes written to state and published
* addChangeHook( filterFunc ) - func receives key,prop,value

STATE CHANGE NOTIFICATIONS

* subscribe( stateHandler ) - handler receives stateObj, optional callback
* publishState( stateObj ) - outgoing send stateObj to subscribers

```



## JUL 9-10 SAT - Consolidating Continued

The general pattern for **creating** appcore modules, which are comprised of (1) State Management and (2) Data Manipulation / Mixing API methods for the specific module. 

### Using Appcore Modules Documentation (Draft)

#### create new ac-module

* create an `ac-function` module and import into `appcore/index.js`
* *NOTE: appcore modules are factored so they completely manage a particular application data+operation need. They are our ViewModel and Controller in one.*
* in new `ac-function` module: create a new `StateGroupMgr` instance initialized with the data this instance will manage in the global STATE object.  
* *NOTE: the STATE instance should be initialized BEFORE React renders, so it is available to draw the UI.* 
  * currently the root appcore module is imported in `SystemInit`, which should make hooking any phase possible in individual appcore modules 
* use `{ initializeState, stateObj, updateKey }` to access state. It will check that you are only modifying keys 
* Provide **additional API methods** you need. They do not need to use state, but can maintain other data structures based on any accessible module. If you are consolidating or joining data from multiple modules, you can put them in here instead of DATACORE and violating our separation of concerns.
* import the module in `appcore/index.js` 

The general pattern for **using** appcore modules with **React**:

* If you need to share any kind of state between components and non-React modules
  * in each Component, import the appcore module that has the information you need. It will initialize the state for you if it's written correctly.
  * in the constructor, set `this.state = UR.GetState('group1','group2',...)`which will return  an object with the contents of each stateGroup as **top level** properties (i.e. the props for group1 aren't in an object prop named group1). You can retrieve ALL the state if you don't pass arguments

### Updating

Got it generally working for:

* AUTOSAVE writes to Transform
* changes to localeID
* more consistent state management