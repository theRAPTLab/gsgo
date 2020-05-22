*warning: work in progress. parts of this is becoming obsolete as we refactor bits of it as a library*

# UR-EXEC Design

UR-EXEC is the system that guarantees that one group of **operations** finish before the next is run. You can think of it as a state machine.

* Modules subscribe to named **Operations**.  Operations are guaranteed to finish before the next operation executes. Operations have a type such as `SYS`, `UR`, `APP` and `DOM`. 
* Operations belong to sets called **Phase Groups**,. The order of Phase Group execution is guaranteed as listed, and it is guaranteed to complete in its entirety before the next phase is entered. 
* The order of operations in a Phase Group
* **Phase Transitions** are triggered by the completion of all operations within the phase. 

The UR EXEC lifecycle predates our use of React, and provides the framework for our simulation engines. It is very loosely inspired by XNA game components and Unix runlevels.



## Public API

#### `SystemBoot({autoRun})`

Start the URSYS execution engine, which will run automatically firing phase groups one-after-the-other in series. The boolean options are:

* `autoRun` - after SystemBoot, go to SystemRun if `true`, passing options forward.

  

#### `SystemRun({update, animFrame})`

Start the URSYS run loop, which includes staging and configuration before periodic updates fire.  Options when set true:

*  `update` - fire APP_UPDATE hooks if `true`
*  `animFrame`. - fire DOM_ANIMFRAME hooks if `true`



####  `SystemNext()`

When loading a "new level" or app mode, this will trigger APP_NEXT before jumping back to `SystemRun()` to restage based on whatever parameters have been set.



#### `SystemHook( op, callback, scope )`

Used by **modules** to subscribe to the lifecycle system. Use one of the **named operations** from a **Phase Group**. You can also subscribe to a Phase Group and receive 'enter' and 'exit' status.

The optional `scope` parameter specified which application routes to ignore; this is used in SPAs that implement separate spaces inside of a single instance (e.g. iSTEP presentation, teacher, and student views are all bundled in the same app bundle). 



#### `useSystemHook( op, callback )`

For **functional React components** that want to subscribe to our hooks, use the custom effect. It will automatically unsubscribe when the component goes out of scope/unmounts, so the `scope` parameter isn't necessary as it is in `SystemHook()`. 

For **React class components**, you can use the module version of  `SystemHook()`. 



## Private API

#### `Execute( op )`

This is the main execution loop for the lifecycle manager. It's used to run a single 

#### `ExecutePhase( phaseGroup )`

Executes all the operations in a Phase Group sequentially

#### `ExecutePhaseParallel( phaseGroup )`

Executes all the operations in a Phase Group in parallel.





# UR-EXEC REFERENCE

## Phases & Operations (WIP)

NOTE: Not all implementations of URSYS implement every operation. In particular, we don't worry about implementing unloading/shutdown for browser-based clients.

```js
PHASE_BOOT: [
  'TEST_INIT', // hook to set any testing parameters or modes
  'SYS_BOOTSTRAP' // grab initial props to load the rest of URSYS
],
PHASE_INIT: [
  'SYS_INIT', // initialize key runtime parameters
  'DOM_READY' // the dom is stable
],
PHASE_CONNECT: [
  'NET_CONNECT', // initiate connection
  'NET_REGISTER', // initiate registration
  'NET_READY' // the network is stable
],
PHASE_LOAD: [
  'APP_LOAD' // app modules can request asynchronous loads
],
PHASE_CONFIG: [
  'APP_CONFIGURE' // app modules can configure data structure from loaded data
],
PHASE_READY: [
  'APP_READY' // all apps have loaded and configured and are ready to run
],
PHASE_RUN: [
  'APP_STAGE', // app modules receive reset params prior to starting
  'APP_START', // app modules start execution, all modules are ready
  'APP_RUN', // app modules enter run mode
  'APP_UPDATE', // app modules execute a step
  'DOM_ANIMFRAME', // app modules animation frame
  'APP_RESTAGE' // fired at end, back to APP_STAGE
],
PHASE_PAUSED: [
  'APP_PAUSE', // app modules should enter "paused state"
  'APP_UPDATE', // app modules still receive update
  'DOM_ANIMFRAME', // app modules still receive animframe
  'APP_UNPAUSE' // app modules cleanup, then back to 'APP_LOOP'
],
PHASE_UNLOAD: [
  'APP_STOP', // app is stopping
  'APP_UNLOAD', // app is shutting down; release assets
  'APP_SHUTDOWN' // app is shut down
],
PHASE_REBOOT: [
  'SYS_REBOOT' // system is about to reboot back to PHASE_BOOT
]
```



## Phase Interrupts (WIP)

Phase Interrupts are events that impact an Operation or cause a Phase Transition. The following isn't formally part of UREXEC yet, and is handled with hardcoded logic in our old apps.

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


Internal URSYS application status changes

* uaddr connecting
* uaddr connected
* uaddr register messages (call again to change list)
* uaddr setstatus (lifecycle)
* uaddr disconnected
* uaddr reconnecting
* uaddr reconnected

