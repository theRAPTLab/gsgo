**SUMMARY S17 AUG 17-AUG 30**

* W1: Wireframing from Joshua, placeholder components
* W2: Port PTRack, issues with PixiJS and React and SSR.

---

## S17 W1

With the scripting engine implemented, it is time to turn our attention to UX/UI. There has not been a lot of work on it since I started the script engine, so we are still starting from scratch. I am building out a sacrificial wireframe, based on Joshua's work!

Meeting with Joshua and Ben about the vision. Joshua reminded us of a lot of cool ideas (my paraphrasing):

>  GEMSTEP is not intended to be a replacement for Scratch and NetLogo, which are highly refined tools with their own strengths. 

> GEMSTEP's emphasis is on powerful foreground collaboration, using "modelling as a verb". Rather than create a simulation and turn it in, GEMSTEP models exist more in the moment of embodiment. The reasoning between students is done while they act things out, using GEMSTEP as the facilitator. Ideally, it enables fast iteration in a group over slow and deliberate coding in solitude.

> For example: A group consists of two kids acting as agents in the simulated space making other agents react to them. At the same time, two other kids are making annotations on what they're doing on top of that. And then they can play back what happens. The "Model Run is the first class citizen", from 1-2 minutes in length. The interface should allow kids to "run it again" to try different things, and choose when to save them. The Play/Rewind/Pause/Record interface is envisioned to allow that (it could be something else). This reminds me of "live replay" recording in game streaming; recording is always happening, and you can choose to save the replay buffer if you have done something cool.

NEXT STEPS from MEETING:

* Joshua is going to produce a "stable" version of the thought document for us.
* I am going to throw something together independently while Ben and Joshua work through it.
* I am hoping to make significant progress this week in getting more interactive up and running.

### WEDNESDAY - BURST 1/3

Let's review Joshua's document and start fleshing out more controls.

* I don't like the way I am overiding CSS in the components. There is a better way to do this but I forgot how MUI handles it. 

Fleshed out V1 with notes from Joshua's wireframe. Next to make components from the common elements. 

### THURSDAY - BURST 2/3

* Here are some [IOS Design Cheatsheets](https://kapeli.com/cheat_sheets/iOS_Design.docset/Contents/Resources/Documents/index) showing the resolutions of various ipads. The smallest legacy size is **1024x768.**
* And here are some [Chromebook Resolutions]([https://www.starryhope.com/chromebooks/chromebook-comparison-chart/#:~:text=Chromebooks%20come%20with%20a%20variety,usually%201366x768%20or%201920x1080%20resolution.](https://www.starryhope.com/chromebooks/chromebook-comparison-chart/#:~:text=Chromebooks come with a variety,usually 1366x768 or 1920x1080 resolution.)). **1366x768** seems to be the minimum size.

I made a diagram of the [data sources and interconnects](https://whimsical.com/XsQrYE226NbeAZoEqQjxYe).

* laptop architecture pure group: make a first pass assuming this is the model
* push back on that
* Design display engine to minimum space: position, timestamp, id of what (visual independent transmission, but connectable) (AgentTemplateID systemwide). 

PixiJS is our new graphics engine. It looks really fast, thanks to GPU smart caching and batch drawing. ThreeJS has changed a lot and most of the API surface area is related to 3D stuff. I liked at Ben's pozyx example and also flipped through the PixiJS demos. We can use the react fiber plugin to add it.

NEXT STEP:

* We could review our old system, but I don't think it's really necessary
* We do want to port the tracker tool and faketrack right away
* Use the React Pixi Fiber integration to add dummy mode on new path
* **Use PixiJS to make FakeTrack**

## S17 W2

### MONDAY

Ok, the thing I'm doing today is starting FAKETRACK. So what is faketrack?

* It's a module that reads PTRACK data and converts it into positional data
* I need to design the positional data system. 
* So we might as well do that.

#### About PTRACK

There are two kinds of entities: **PTRACK** and **INPUTS** from other devices (what was called "FakeTrack" before)

```
PTRACK - OpenPTRACK entities

  Read UDP from port 21234 on multicast group 224.0.0.1
  convert PTRACK frame data into entity data
  - read tracks
  - retrieve track ENTITIES and EVENTS
  - filter and map entities to produce pieces with trackerobject
  - transform entity positions to logical normalized coordinates space
  Forward transformed entities to registered connections on port 3030

INPUT - other inputs creating logical data entities

	INPUT devices register on TCP port 21212 of server (socket server)
	- read track
	- retrieve track ENTITEIS and EVENTS
	- filter and map entities to produce pieces with trackerobject
	- skip transform step: INPUT entities should already be using normalized coordinates
	Forward transformed entities to registered connections on port 3030
```

The data structures and data structures for **Pieces**

```
TrackerObject(entityId)
	id: number
	pos: Vector3
	valid: boolean
	isNew: boolean
	isOutside: boolean
	mode: enum = jump, lerp, seek
	type: enum = ?, object, people, pose, faketrack

TrackablePiece extends InqPiece
	has TrackerObject
	has Movement types to seek TrackObject using TrackerObject mode
	
InqPiece extends Piece
	implements message calls (!)
	implements subscriptions to event
	implements behaviors
	impements pieces in range
	
Piece extends ProtoPiece
	position, rotation, heading
	position0, position1, position2
	visual
	body
	state
	ai
	updateFunc, thinkFunc, executeFunc
	implements setters
	
ProtoPiece 
	id
	name
	roles
	tags
	factions
	groups
	implements saving of piece into dictionary
```

Now the **algorithm** for transforming entities to pieces

```
m_inputs = the list of Pieces that are mapped, via TrackerObject, to an Entity
m_pieces = the subset of m_inputs that are visible in the play space

unassigned = m_MapEntities(m_inputs, add, remove)
- retrieve EntityDict from PTRACK module, computed in ProcessFrame(frameData)
- steps through every entity in the EntityDict to build updated, lost, new piece lists
- - increment nop count (increment every frame by milliseconds if entity not found)
- - increment age (only objects that have min age are considered valid)
- - remove old entities that are within error radius
- - remove entities that have expired, reclaim used pieced into pool
- - assign new entities to available pieces, expanding piece pool as necessary

Transforms normalize coordinates in TrackerSpace to +/- 1, and then expand them to the size of the logical space (in piecels).

- m_transform.matrix_align orientes PTRACK first
- is normalized to extents of the PTRACK area

Note that m_transform is computed from other values saved in it:

  var m = new THREE.Matrix4();
  m.multiplyMatrices ( scale, rotatex );
  m.multiply ( rotatey );
  m.multiply ( rotatez );
  m.multiply ( translate );

  /* finally! */
  m_transform.matrix_align = m;
```

#### Next Steps!

* [ ] port server UDP and TrackData server
* [ ] port client TrackData subscriber
* [ ] insert ProcessFrame into server
* [ ] insert transform normalization
* [ ] implement PTRACK visualizer on localhost **calibrate** + **transform** with PixiJS
* [ ] insert Entity management into server (add, remove, update)

The clients need to receive DisplayList information for the actual pieces, but not much else. I think for inspection, we'll do a round-trip request rather than actually ship the data on every frame.

### WEDNESDAY 26

Looking at the playback code in PLAE to use for a datastream reader

I'm not quite sure where to start on this. I'm feeling a bit unsure about what to do. I guess **port the step tracker**

* [ ] new module `step-ptrack` needs to launch in `_start.js` of gem_srv
* [ ] faketrack module...

Look at PixiJS: https://medium.com/@mikkanthrope/react-with-pixijs-c8fc4c50facd

### THURSDAY 27

The day was spent largely fighting NextJS and React-Pixi-Fiber. Resolution is:

* wrap page tabs with a call to `next/dynamic`

### SUNDAY 30

Integrating PixiJS into React is proving more confusing than expected due to confusion between hooks and class components and asynchronous stuff. I'm trying to put everything into a render.

Right now, the problem is that PixiJS isn't initializing or drawing into React's rendering scheme reliably using React-Pixi-Fiber. AND the server-side implementation in NextJS also complicates things alot.

ALTERNATIVES:

* **Drop React as much as possible?** That means going back to our own server architecture. 
* **Continue to try to use NextJS+React?** it is a matter of working-out the integration and startup runtime.

Right now, to ensure that our app doesn't load in the server, we have to wrap page tab components in Next/dynamic with noSSR option set. This makes it load entirely on the client side. 

FakeTrack has the URSYS system boot in it, and we run it after FakeTrack. However, we also need module persistence for our renderer module to work. I think this means we really need to go back to the old app server that spawns React under our own control. 

In PLAE, that's **GameRun.jsx** that controls modules outside of React, spawning it inside the index structure that we provide. We should be able to connect the renderer in PixiJS to it. PixiJS looks like this:

```js
// http://pixijs.download/release/docs/PIXI.Application.html
// Create the application
const app = new PIXI.Application();
// Add the view to the DOM
document.body.appendChild(app.view);
// ex, add display objects
app.stage.addChild(PIXI.Sprite.from('something.png'));
// resize to parent window
app.resizeTo(document.body);
```

#### Application Server Needs

To make this work, the new app server still has to create bundles and send them to the app. We have the old appserver. Maybe I'll just port the FakeTrack part to that.

* So that might be the way to go. Update AppServer
* The clever parts of NextJS we like are the page-tabs and pages structure. But I think we can maintain that
* The other clever part is the build system. 

I think the way to go will be to duplicate as much as possible from GEMSRV into the old hull of APPSRV. I will just do the following:

1. See if I can load PixiJS into a view
2. Add PTRACK to the server
3. Draw-out how the old AppServer works so I can figure out if it's worth porting everything over to it.