* Agents themselves have a simple lifecycle. They perform computation periodically based on whatever observable event stream is driving them. These computed values can be used either to change internal state or send a message. They are essentially actors.
* implement and assign simple declaration, computation, invocation, and conditional invocation to a lifecycle phase
* implement simple blocks with `then` continuation for serial operation (`pipe`)
* Implement parallel blocks that become observers