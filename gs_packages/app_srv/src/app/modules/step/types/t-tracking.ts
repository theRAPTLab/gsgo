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

export type PoolInitConfig = {
  makeF: Function;
  initF: Function;
  count: number;
};

export type PoolUpdateConfig = {
  addF: Function;
  lostF: Function;
};

export type FilterConfig = {
  MAX_NOP: number;
  MIN_AGE: number;
  SRADIUS: number;
};
