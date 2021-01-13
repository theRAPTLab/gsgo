// geometry and coordinate system types
export type Matrix4 = [
  // row 1
  number,
  number,
  number,
  number,
  // row 2
  number,
  number,
  number,
  number,
  // row 3
  number,
  number,
  number,
  number,
  // row 4
  number,
  number,
  number,
  number
];
export type Vec4 = [number, number, number, number];
export type Vec3 = [number, number, number];

// for initializing a pool with a particular size
export type PoolInitConfig = {
  makeF: Function;
  initF: Function;
  count: number;
};

// for handling addition/loss of pool elements
export type PoolUpdateConfig = {
  addF: Function;
  lostF: Function;
};

// for ptrack entity parameters
export type FilterConfig = {
  MAX_NOP: number;
  MIN_AGE: number;
  SRADIUS: number;
};
