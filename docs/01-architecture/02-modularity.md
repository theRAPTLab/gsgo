## Modular Thinking in URSYS Apps

These are the underlying rules about data encapsulation and code modularity that we should make explicit! There is a **hierarchy** and **dataflow**  of what kinds of data/code can connect to.

### The System Data Hierarchy

* **Transient State** consists of flags, selectors, modal options...anything that is not related to Persistent Data. In other words, the contents of Transient State are variables that are used by running code to decide WHAT to do. Everything else is Persistent Data of some kind.
* **Persistent Data** is the "pure model" of data that isn't related to implementation of the application logic, user interface, or its runtime behavior. This is the source data in well-defined data structures.
* **Derived Data** is derived from Persistent Data. For example, the result of a SQL query is derived data from the underlying database model. Because it is derived, there is no need to store it except in the case of Working Data
* **Working Data** are temporary variables, caches, retained results of a database query, etc, that's used to feed the user interfaces and algorithms that drive the application. **Transient State** is a form of Working Data.

### The System Module Hierarchy

* **Datacore Modules** implement "pure model data" as our single source of truth, with zero conflicting dependences with non-data modules.
* **Major Modules** are independent systems that use Datacore modules. The key idea is that they can be used independently of other major modules, and are imported at the Application root level.
* **Helper Modules** are helpers imported by another module to reduce lines of code while also exposing architectural operational concepts of the software design. 
* **Shared Object Classes** are a form of module that concentrate related functions/data together so they can be **instanced** at will. They are similar to Helper Modules in that they encapsulated architecture concepts at the "object/data level" instead of at the "application/operations level". 
* **Shared Components** are modules that are shared at the "application/user interface" level (e.g. React components). 

### The Application Module Hierarchy

* An **Application Module** implements the root entry point of the application. 
* The Application Module is the **only place**  where data sources from multiple major modules can be mixed together, because it is where we can **safely make assumptions** about which modules will be used. 
* Application Modules can have their own **Application Helper**. **Object Classes**, and **Derived Data** modules; this source code is saved using derivative names of the main Application Module or its subsystems. These code modules are stored next to the location of the Application main file. 
* **Shared Components** are potentially also part of the Application Hierarchy, as they can be application-specific to implement a custom user interface. 
* In GEMSTEP, there are **multiple application entry points** (e.g. our page routes) that may share components or applciation helpers that each would be considered its own module and own implementation rules. The System Data and Module structure System consists of shared functionality between multiple applications (e.g. `INPUT`, `SIM`, `RENDER` and related data structures). There are multiple applications that make use 

### The Message Hierarchy

We have two kinds of message invocations that can be sent to either `LOCAL` message handlers or `NET` remote message handlers.

One-way messages like Signal and Send do not return data. Signal sends to everyone, but Send does not reflect back to the calling module. 
NOTE: we should probably **deprecate** Send because the use case it's designed for (message handler that calls other message handlers to synchronize) is generally not used. Maybe **rename** it Sync)

* [Signal | Send] LOCAL:MESSAGE, data -> local message handlers -> void
* [Signal | Send] NET:MESSAGE, data -> remote message handlers -> void

Round-trip messages like Call:

* async [Call] LOCAL:MESSAGE, data -> local message handlers -> each returns data to caller in an array
* async [Call] NET:MESSAGE, data -> remote message handlers -> each returns data to caller in an array

### The Event Hierarchy

GUI events are asynchronous and can be fired at any time. The GUI event code has to interpret changes and call the correct module methods or issues the right message.

* GUI Events -> GUI Event Handlers -> Data Update -> GUI Render Update



---

## Kinds of State and Data

I need to describe the **difference** between "transient state" and "persistent data" once and for all. 

What is **Transient State**? 

* State is used represent a **selection** between multiple possibilities. These are flags, selectors, modal options, etc.
* State is **inspected at runtime** to determine how code should behave, for example where in a screenflow something is, what is selected in a list, etc.
* There are **two kinds of state**: (1) application-wide state and (2) component-local state
* State is explicitly **not used to store persistent data**
* Everything else is **persistent data** which should be retrieved from a **data store**, perhaps using information stored in transient state to select what is loaded.

Transient state is used to draw the GUI. The GUI relies on transient state to know what persistent data to display. 

What is **Persistent Data**?

* The pure **data representation** of something in the application or system, *existing independently* of the GUI and other implementation details. The data representation is defined by your **data structures**. 
* You should be able to use a pure data representation without reference to anything else other than the **data model** 
* For persistent data n GEMSTEP, we use the **datacore** convention.

What is the **Datacore Convention**?

* A module that follows this is the **single source of truth** for a particular kind of data. The main one is called `datacore` fwhich also implements `dc-name` as submodules. 
* The module hold the **persistent data structures and tables**. Again, this is stuff related to the data model only, not transient state.
* The module provides **data model operations** that work purely with the data, with no coupling or reliance on external data. These follow the `modulename-api` naming convention
* There is an expected order for **data dependencies**
  * the **pure data** modules have (1) zero direct dependencies on other data modules and (2) no dependencies on modules that also rely on pure data. This allows them to be imported by *ANY* module in the system.
    * Our **object class modules** are also pure modules; anyone can import them, including p may manage their own pool of instances. 
    * The datacore `dc-name` submodules can also be imported directly
  * **Major modules** may operate on the pure data to create **derivative data structures**. This is a module that stands alone, and does not import other major modules. The behavior of an application is determined by which major modules are loaded and initialized. In GEMSTEP, the major modules are INPUT, SIM, and RENDER. Importing one module does not import or rely on the operation of the other modules. 
    * the main `datacore` module can also potentially create derivative data structures because it loads everything in the `dc-` modules
  * **Helper modules** are used by major modules to package functionality that is specific to a module's need. They can be intended for use *ONLY* by a particular module (which is reflected in the naming convention `module-subfeature`), These help keep the line count of a major module to a manageable level.  They also help make the **architecture** of key module concepts more visible and therefore the overall module is more human-readable.

What **isn't handled** by Datacore?

* Anything related to the **implementation of the application** is outside the purview of datacore. An application _knows_ what major modules are loaded, and therefore can **safely make assumptions** about what is available. 
* Like the datacore convention, you can make derived data from multiple pure modules you are loading that depend on multiple major modules. **This is the *ONLY PLACE* you should be doing that.** 
* Like the datacore convention, the use of **application helper modules** is encouraged to help keep the line count of the main application lower while exposing architectural concepts. There are several kinds:
  * React components are reusable helpers, stored in a `components` directory
  * Some object classes are also application specific, stored in the `lib` directory. 
  * Helper modules are stored in `elements` or `helpers` directory
*  These modules are located under whatever directory has the **application entry point** (usually the root view for the app) exists in. 

What is **Working Data**?

* If it's not persistent data or transient state, it is probably **localized data**. Examples are temporary variables and **derived data structures** that are built from the persistant  that is either temporary variablesused inside a function or module to keep track of stuff. They are not saved as part of persistent data because they can be regenerated on next load.
* One form of derived data that *CAN* be thought of as persistent is the **application state** 

---

## Handling Application-specific Logic

*This is an **EVOLVING SPECIFICATION** as we make sure the pattern makes sense to everyone*

Components and modules access state through the limited  `UR` interface for reading, writing, and subscribing to state changes. Appcore module authors can access additional methods to do the behind-the-scenes data manipulation that needs doing, and provide application-specific methods to do the work of a controller/viewmodel.

### Background

Originally our major modules **SIM**, **RENDER**, and **INPUT** were designed to run completely independently of each other so they could be moved easily to the server. Unfortunately this is no longer the case, as there was no clear pattern established for doing this cleanly without polluting DATACORE with cross-module dependencies.

This is what APPCORE helps with. In addition to providing a home for groups of application state, an APPCORE module can also hold derivative cross-module logic and data structures because they are *SPECIFIC TO AN IMPLEMENTATION* (the application with its required features). 

**Rules of Thumb:**

* An APPCORE module can freely import a DATACORE module that follows the strict "no dependency" criteria. 

* APPCORE modules can only be imported by the application itself, not by other modules. This can either be a `jsx` component file or an application helper module that has the program logic that is unrelated to GUI event and update handling.

* APPCORE modules can make full use of UR PHASES and MESSAGING. It can also leverage the StateGroupMgr class to manage application-wide state that can be accessed from any other module in the system.

### Managing State

The `StateGroupMgr` class maintains a global `GSTATE` objects with a number of **keys** in it. When you create an instance of the class, you specify which keys you will be managing under a **group**. For example, the `ac-locales` appcore module manages a group called `locales` that contains keys like `localeId` and `locales`. 

The StateGroupMgr class can be used to maintain both **GUI state** (intended for direct mapping to your GUI framework) and **Application state** (intended to affect the operation of code, enabling features, etc). 

> It is important to remember that **data is not state** so **don't use state as a source of data truth** just because it seems handy. Use the `DATACORE` modules as the source of data truth; you will be *EXPLICITLY* converting GUI state TO data truth in your input processing routines and vice versa, but don't conflate them. You will confuse other developers and likely introduce dependencies that are difficult to debug. 

### Appcore Methods

In addition to **state**, you can add methods related to **application logic**, **data transformation** and other **operations** that are specific to your application. 

You can safely import **major modules** such as **SIM**, **INPUT**, and **RENDER** as well as relevant **DATACORE** modules to create **derived data structures** that link these operations in whatever way needs doing. APPCORE is the _ONLY PLACE_  you should be be putting your module dependencies; if you add such dependencies to the DATACORE and MAJOR modules, you are making it difficult to cleanly port our code to the server. 

### Change Hooks

Your appcore module can add a **data filter** function to inspect pending state changes coming through the UR public API. This is used to ensure that incoming data is in the right format before saving it. They are executed from the `UR.WriteState()` public method before data is written to state. A change hook is used to convert "string numbers" received from React to regular numbers in `ac-locales`.

### Effect Hooks

Your appcore module can add a **side effect** function to perform something after the state has been written. For example, you might need to update related state keys. An effect hook is used to handle autosaving to the database in `ac-locales`.

### StateGroupMgr Methods

These are for exclusive use by modules that create the instances of StateGroupMgr. The public interface is in `UR`. 

* `constructor( groupName )`
* `initializeState( gql | obj )`
* `hasKey( keyName )`
* `updateKey( objOrKey, value )`
* `  updateKeyProp(key, prop, value)` 
* `newStateObj( a, b, c )` - util to create a stateObj from passed values
* `stateObj( ...keys )` return stateObj with specified group keys
* `flatStateValue(key)` - return the value of a key (not wrapped in a stateObj)
* `subscribe(stateHandler)`
* `addChangeHook(filterFunc)`
* `addEffectHook(effectFunc)`

### Private StateGroupMgr Methods

* `_getKey( key )`  - return the specified **raw** state key for *direct mutation* 
* `_handleChange(key, propOrValue, propValue)` - called from `UR.WriteState()` 
* `_smartUpdate(key, a, b)` - Main state update method. figures out which `updateKey` or `updateKeyProp` to use, also applies changeHooks
* `_publishState(stateObj)` - send the stateObj to subscribers. This isn't automatically done by `_smartUpdate()` but it is when using `UR.WriteState()` 
