/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const GAP = 15;
/**
 * @property {object} VPROP - props
 * @property {number} VPROP.MIN_WIDTH - minimum width
 * @property {number} VPROP.MIN_HEIGHT - minimum height
 * @property {object} VMECH - mechs
 * @property {number} VMECH.STROKE - width in pixels
 * @property {number} VMECH.UP - used to construct an "up" vector for endpoints
 * @property {number} VMECH.BLEN - used to offset the textlabel
 * @property {object} PAD - padding
 * @property {number} PAD.MIN - minimum spacing used for vprops, vmechs
 * @property {number} PAD.MIN2 - double min spacing
 * @property {object} SVGDEFS - defs
 * @property {object} SVGSYMBOLS - svg symbols
 * @property {object} UTIL - utility functions for debugging (availble from console)
 * @property {object} COLOR - colors
 * @property {string} COLOR.MECH - VMECH line color
 * @property {string} COLOR.PROP - VPROP background
 */
const DEFAULTS = {
  VPROP: {
    MIN_WIDTH: 200,
    MIN_HEIGHT: 30
  },
  VMECH: {
    STROKE: 5,
    UP: 150,
    BLEN: 55
  },
  PAD: {
    MIN: GAP,
    MIN2: GAP * 2
  },
  SVGDEFS: new Map(),
  SVGSYMBOLS: new Map(),
  UTIL: {
    DumpObj
  },
  COLOR: {
    MECH: 'orange',
    MECH_SEL: '#44F',
    MECH_HOV: '#FFC78F',
    MECH_LABEL: '#FF6600',
    MECH_LABEL_BG: 'rgba(240,240,255,0.9)', // match background of svg
    PROP: '#44F',
    PROP_SEL: '#44F',
    PROP_HOV: '#FFA244',
    STICKY_BUTTON: '#ffdd11'
  }
};

/**
 * Returns a pathId string from non-pathId edge selectors. The pathId
 * string used by MEME as a key for storing VMech instances in a Map.
 * Accepts one of three forms:
 * * `sourceNodeId, targetNodeId`
 * * `{ w: sourceNodeId, v: targetNodeId }`
 * * a string of form 'w:v' (just is returned as is without validation)
 * @param {string|object} vso - a PMC pathId, edgeObj, or source nodeId
 * @param {string} ws - the targetNodeId, if `vso` is also a string
 * @returns {string} pathId of form 'w:v', where `w` and `v` are nodeIds.
 */
DEFAULTS.CoerceToPathId = (vso, ws) => {
  // assume this is an edgeObj
  const vtype = typeof vso;
  const wtype = typeof ws;
  if (vtype === 'object') {
    const { v, w } = vso;
    if (!(v && w)) {
      console.warn('error edgeObj', vso);
      throw Error(`missing v and w prop_set in arg`);
    }
    return `${v}:${w}`;
  }
  // Maybe a string was passed in and its a pathId already?
  if (vtype === 'string' && ws === undefined) return vso;

  //
  if (wtype !== 'string') throw Error(`arg2 '${ws}' must be string id (arg1 was '${vso}')`);
  return `${vso}:${ws}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Given one of the following forms...
 * * `sourceNodeId, targetNodeId`
 * * `{ w: sourceNodeId, v: targetNodeId }`
 * * a string of form 'w:v' (just is returned as is without validation)
 *
 *  ...always return an EdgeObject suitable for use by `dagres/graphlib`.
 * @param {string|object} vso - a PMC pathId, edgeObj, or source nodeId
 * @param {string} ws - the targetNodeId, if `vso` is also a string
 * @returns {object} - object of shape { w, v } where w and v are strings
 */
DEFAULTS.CoerceToEdgeObj = (vso, ws) => {
  const ptype = typeof vso;
  const wtype = typeof ws;
  if (ptype === 'string') {
    if (ws === undefined) {
      // this is probably a regular pathid
      let bits = vso.split(':');
      if (bits.length !== 2) throw Error(`pathId parse error. Check delimiter char`);
      const v = bits[0];
      const w = bits[1];
      return { v, w };
    }
    // this might be v,w
    return { v: vso, w: ws };
  }
  if (ptype === 'object' && vso.v && vso.w) {
    return vso; // this is already an edgeobj
  }
  if (ptype === 'number' && wtype === 'number') {
    // convert to strings because outside of db, all ids are strings to match m_graph
    return { v: String(vso), w: String(ws) };
  }

  throw Error('can not conform');
};
// deeconstruct either int,int or object with keys into array
// const [ a, b] = ArrayFromABO(x,y) or ArrayFromABO(obj)
// used by code for move() that could get a point x,y or x,y
/**
 * Used to convert { x, y } to [ x, y ] for destructoring point
 * objects
 * @deprecated not very reliable when multiple keys exist, order is suspect too
 * @param {number|object} ano - object with keys, or a value (e.g. `x`)
 * @param {number} bn - second value (e.g. `y`) if `ano` is not an object
 * @example
 * const [a,b] = ArrayFromABO({x:10,y:20});
 * // returns [10,20]
 */
DEFAULTS.ArrayFromABO = (ano, bn) => {
  if (typeof ano === 'object') {
    if (bn === undefined) return Object.values(ano);
    throw Error(`can't normalize ano ${ano}, bn ${bn}`);
  }
  return [ano, bn];
};

// return methods and properties of object
function DumpObj(obj) {
  const found_props = [];
  const found_methods = [];
  const prop_set = new Set();
  getProps(obj);
  prop_set.forEach(key => {
    switch (typeof key) {
      case 'string':
      case 'number':
      case 'object':
        found_props.push(`${key}`);
        break;
      case 'function':
        found_methods.push(`${key.name}()`);
        break;
      default:
        console.log(`unknown keytype ${key}`);
    }
  });
  return { props: found_props, methods: found_methods };
  //
  function getProps(o) {
    if (!o) return;
    const props = Object.values(o);
    props.forEach(item => {
      prop_set.add(item);
    });
    getProps(Object.getPrototypeOf(o));
  }
}

/// DEBUGGING CONSOLE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.reflect = DumpObj;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default DEFAULTS;
