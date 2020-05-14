*warning: work in progress. parts of this is becoming obsolete as we refactor bits of it as a library*

# UR-EXEC Design

UR-EXEC is the system that guarantees that one group of **operations** finish before the next is run. You can think of it as a state machine.

* Modules subscribe to named **Operations**.  Operations are guaranteed to finish before the next operation executes. Operations have a type such as `SYS`, `UR`, `APP` and `DOM`. 
* Operations belong to sets called **Phases**. The order of phase execution is guaranteed as listed, and it is guaranteed to complete in its entirety before the next phase is entered. The order of Operations is guaranteed by type, not between types. In other words, all `APP` states will execute in order, but whether they finish before `DOM` states is unpredictable.
* **Phase Transitions** are triggered by the completion of all operations within the phase. 

The UR EXEC lifecycle predates our use of React, and provides the framework for our simulation engines. It is very loosely inspired by XNA game components and Unix runlevels.

## Public API (PORTING)

#### `SubscribeHook( op, callback, scope )`

Used by **modules** to subscribe to the lifecycle system. Use one of the **named operations** from a **Phase Group**. You can also subscribe to a Phase Group and receive 'enter' and 'exit' status.

The optional `scope` parameter specified which application routes to ignore; this is used in SPAs that implement separate spaces inside of a single instance (e.g. iSTEP presentation, teacher, and student views are all bundled in the same app bundle). 

#### `useSubscribeHook( op, callback )`

For **functional React components** that want to subscribe to our hooks, use the custom effect. It will automatically unsubscribe when the component goes out of scope/unmounts, so the `scope` parameter isn't necessary as it is in `SubscribeHook()`. 

For **React class components**, you can use the module version of  `SubscribeHook()`. 

## Private API (PORTING)

#### Execute( op )

This is the main execution loop for the lifecycle manager. 

#### ExecuteGroup( phaseGroup )

This is a convenience method for executing all the operations in a Phase Group, paralellized by type.



# UR-EXEC REFERENCE

## Phases & Operations (WIP)

NOTE: Not all implementations of URSYS implement every operation. In particular, we don't worry about implementing unloading/shutdown for browser-based clients.

* **PHASE_BOOT**
  * `SYS_TESTCONF`
  * `SYS_BOOT`
* **PHASE_INIT**
  * `UR_INIT`
  * `DOM_READY`
* **PHASE_CONNECT**
  * `UR_CONNECT`
  * `UR_REGISTER`
  * `UR_READY`
* **PHASE_LOAD**
  * `APP_LOAD`
  * `APP_CONFIGURE`
* **PHASE_RUN**
  * `APP_RESET`
  * `APP_START`
  * `APP_RUN`
  * `APP_UPDATE`
  * `DOM_ANIMFRAME`
  * `APP_STOP`
  * `APP_PAUSE`
* **PHASE_UNLOAD**
  * `APP_UNLOAD`
  * `APP_SHUTDOWN`

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

