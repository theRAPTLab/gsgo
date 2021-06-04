export function Deg2Rad(degree) {
  return (degree * Math.PI) / 180;
}
export function Rad2Deg(radians) {
  return (radians * 180) / Math.PI;
}
/**
 * @param {number} start
 * @param {number} end
 * @param amount 0 - 1
 */
export function Lerp(start, end, amount) {
  return (1 - amount) * start + amount * end;
}
/**
 *
 * @param {x: number, y: number} pos1
 * @param {x: number, y: number} pos2
 * @returns number
 */
export function DistanceTo(pos1, pos2) {
  return Math.hypot(pos2.x - pos1.x, pos2.y - pos1.y);
}
/**
 *
 * @param {x: number, y: number} pos1
 * @param {x: number, y: number} pos2
 * @returns
 */
export function AngleTo(pos1, pos2) {
  const dy = pos2.y - pos1.y;
  const dx = pos2.x - pos1.x;
  return Math.atan2(dy, dx);
}
/**
 *
 * @param {x: number, y: number} position
 * @param {number} radians -- Angle
 * @param {number} distance
 * @returns {x: number, y: number}
 */
export function ProjectPoint(position, radians, distance) {
  const x = position.x + Math.cos(radians) * distance;
  const y = position.y - Math.sin(radians) * distance;
  return { x, y };
}
/**
 *
 * @param {x: number, y: number} position
 * @param {number} degrees
 * @returns {x: number, y: number}
 */
export function Rotate(position, degrees) {
  let tx = Number(position.x);
  let ty = Number(position.y);
  const rad = (degrees * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  tx = tx * c - ty * s;
  ty = tx * s + ty * c;
  return { x: tx, y: ty };
}
