# Asynchronous Concepts

## Hooks vs Events vs Messages vs Direct Calls

In URSYS parlance, a Hook is different from an Event in the following way:

* **Hooks** tell user code WHEN to do something. We use them to customize the URSYS lifecycle to our program environment and needs.
  * **PhaseHooks** are lifecycle events you can connect to have a particular piece of code run at a particular time in a lifecycle.
  * **FilterHooks** can intercept an operation and get a chance to change data before the system resumes using it.
  * **ActionHooks** are called directly when a particular code operation runs. They are a primitive form of our PhaseHooks.
* **Events** tell you that WHAT HAPPENED asynchronously. We only receive Events from the operating system and underlying HTML5/Javascript features

URSYS Hooks look similar to URSYS Messages, but are different in the following way:

* **Hooks** are initiated by URSYS internal operations. You write hook functions to **do something required** at the right time to make URSYS work the way it is supposed to. 
* **Messages** are initiated by user code. It's a general purpose way to initate a send-receive-respond data transaction between URSYS endpoints. They can be used to implement an Event-like sender/handler, distribute data across the network, and implement asynchronous transactions. They can also be used as a bridge between URSYS modules and other code systems. 