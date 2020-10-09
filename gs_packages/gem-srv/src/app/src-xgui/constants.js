// TAB
const TAB = {};
TAB.HOME = "home";
TAB.EDIT = "edit";
TAB.RUN = "run";
TAB.COLLABORATOR = "collaborator";
TAB.DEV = "dev";


// DATA TYPES
const DATATYPE = {};

DATATYPE.AGENT = "agent"; // agent type
DATATYPE.INSTANCE = "instance"; // agent type

DATATYPE.ACTION = "action";
// user-inputted "value", e.g. not user-selected "agent" or "agent property".
// The "$" is to differentiate from possible source property called "value".
DATATYPE.VALUE = "$value";
DATATYPE.STRING = "string";
DATATYPE.NUMBER = "number";
DATATYPE.BOOL = "boolean";

// VIEW MODEL TYPES
const VMTYPE = {};
VMTYPE.SOURCEOBJECT = {};
VMTYPE.SOURCEOBJECT.AGENT = "agent";
VMTYPE.SOURCEOBJECT.AGENTPROPERTY = "agentProperty";
VMTYPE.SOURCEOBJECT.VALUE = "value";

export { TAB, DATATYPE, VMTYPE };
