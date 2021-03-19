/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WORK IN PROGRESS "Role Manager" for handling connections between devices

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const log = console.log;

/** hardware+capabilities descriptors to determine what machines can
 *  handle which roles */
const DEVICE_CAPS = {
  speed: [],
  os: [],
  arch: [],
  hasKeyboard: [],
  hasPointer: [],
  hasDragSelect: [],
  hasHTTPS: [],
  isWAN: []
};

/** each of these capabilities might apply to the same machine */
const GEM_ROLES = {
  'URSYS_HOST_MASTER': {},
  'URSYS_HOST': {},
  'GEM_SIM_HOST': {},
  'GEM_INPUT_HOST': {},
  'GEM_DISPLAY_HOST': {},
  'GEM_INPUT_CLIENT': {},
  'GEM_DISPLAY_CLIENT': {},
  'GEM_SIM_CLIENT': {}
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** message switchboard */
const AVAILABLE_ROLES = [];
const SWITCH = new Map();
SWITCH.set('availableRoles', data => {});
SWITCH.set('modeStateMachine', data => {});
SWITCH.set('modeChangeState', data => {});
SWITCH.set('roleAssigned', data => {});
SWITCH.set('roleChanged', data => {});
SWITCH.set('roleRevoked', data => {});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** before connecting to the role manager, collect information about this
 *  local system, which will determine what roles will be offered */
export function GetDeviceCaps() {
  log('benchmarking system');
  log('gathering input features');
  log('gathering network info');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** when a client connects to the GEM_SIM_HOST, it provides its logical name
 *  and any authorization conditions (json web token) with every command */
export function ConnectToState(logicalName) {
  const deviceCaps = GetDeviceCaps();
  log('connecting to host with', deviceCaps, 'and', logicalName);
  log('wait for json web token');
  log('save json web token');
  log('subscribe to NET:SIM_STATE events');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SelectRole(roleSelector) {
  log('student picks the roles that are offered');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function OnSimState(packet) {
  const { message, data } = packet;
  const status = SWITCH.get(message)(data);
  console.log('SimState:', status);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function
