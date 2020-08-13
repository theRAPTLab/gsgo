## Shift in GEM-STEP Thinking

See [this issue](https://gitlab.com/stepsys/gem-step/gsgo/-/issues/1) for original discussion.

### SUMMARY OF SHIFT

This affects the functionality of the annotation system. Instead of having a separate annotation tool on the iPad with various controls, make it instead into two modes: "Active Mode" for interacting with model agents, "Annotation Mode" for non-model annotation (display information) agents.

### ORIGINAL THINKING

Two roles: laptop and ipad:

1. laptop: hosts "modeling interface" - setup model, edit code, and project
2. ipads: hosts "agent interface" - login via token, control one or more agents within the model running on (1). It was assumed that ipad app has "tabs" or some control to switch between annotations. This seems awkward.

### THE NEW IDEA

Instead of multimodal tabs, student selects either "ACTIVE" or "ANNOTATION" mode.

* **ACTIVE** MODE: control an agent that appears in the shared model hosted by the laptop, projected onto the screen. They are affecting the model.
* **ANNOTATION** MODE: control an agent that is only running on their ipad, ON TOP of the shared model. 

Furthermore:

* The laptop operator has the ability to select annotations from other logged-in students, then make them visible on the projection. 
* All annotations are recorded as part of the run regardless.
* Both laptop and ipad interfaces share UI for setting properties of an agents, be they model agents or annotation agents.
* All agents are shared across the system and the group using import/export library, so they are available to everyone.

### EXAMPLES of ANNOTATION AGENTS

* annotation: a sticker of a star that moves around the screen
* an annotation agent that counts other agents and displays it
* simple pen agent
* complex pen agent to set color shape

### QUESTIONS:

* do ipads also have ability to turn on/off annotation layers from other students?
* is annotation mode limited to SINGLE AGENT?
* modeling as verb: doing things, seeing reactions, being embodied in it?
* modeling as noun: a diagram you look at passively, not reason/act with?
* aside: Drawing lines in model mode? 
* aside: we will have to prioritize list of "high powered" agents because each of them are potentially difficult to develop, but I think the list will wait until we have initial feedback from an interface.

### GOALS

A few key goals of this idea were:

1. simplify the interface
2. leverage high-powered widgets/primitives, and agent templates can be shared with library / import / export function
3. **modeling as a verb, not as a noun.** "We want kids to be thinking constantly about **showing information** and having it **relate** to other ideas they have incorporated in their model along with their along with their own **embodiment**, and then **modify** both. In other words, treat this as **agents all the way down** to increase the change of them getting into the mindset.
4. if anything complicated needed, teachers ask dev team for a custom "widget" to provide for script use.
