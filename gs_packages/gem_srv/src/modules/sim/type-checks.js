/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Typechecks Module

  Every method potentially throws an Error.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsDefined(any) {
  return any !== undefined;
}
function IsFunction(f) {
  if (typeof f !== 'function') throw Error(`${f} is not a function`);
  return true;
}
function IsNumber(num) {
  if (typeof num !== 'number') throw Error(`${num} is not a number`);
  return true;
}
function IsInteger(int) {
  if (!Number.isInteger()) throw Error(`${int} is not an integer number`);
}
function IsString(str) {
  if (typeof str !== 'string') throw Error(`${str} is not a string`);
  return true;
}
function IsObject(obj) {
  if (!Object.isObject(obj)) throw Error(`${obj} is not an object`);
  return true;
}
function IsMap(map) {
  if (map instanceof Map) throw Error(`${map} is not a Map`);
  return true;
}
function IsKey(str) {
  if (!Object.isString(str)) throw Error(`${str} is not a key (must be string)`);
  return true;
}
function HasMeta(obj) {
  return IsObject(obj) && IsObject(obj.meta);
}
function HasKey(map, key) {
  return IsMap(map) && IsKey(key) && map.has(key);
}
function GetKey(map, key) {
  return HasKey(map) ? map(key) : undefined;
}
function SaveKey(map, key, obj) {
  if (!IsDefined(obj)) throw Error('obj to save is undefined; use DeleteKey');
  if (HasKey(map, key)) throw Error(`key ${key} already in map ${map}`);
  map.set(key, obj);
}
function DeleteKey(map, key) {
  if (!HasKey(map, key)) throw Error(`map doesn't have key ${key} to delete`);
  const obj = map.get(key);
  if (!map.delete(key)) throw Error(`unexpected map delete error for ${key}`);
  return obj;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  IsString,
  IsObject,
  IsFunction,
  IsNumber,
  IsInteger,
  IsMap,
  IsKey,
  HasMeta,
  HasKey,
  GetKey,
  SaveKey,
  DeleteKey
};
