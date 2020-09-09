/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Typechecks Module for Non-Typescript Code

  Every method potentially throws an Error.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsDefined(any) {
  return any !== undefined;
}
function IsFunction(f) {
  if (typeof f !== 'function') return false;
  return true;
}
function IsNumber(num) {
  if (typeof num !== 'number') return false;
  return true;
}
function IsInteger(int) {
  if (!Number.isInteger(int)) return false;
}
function IsString(str) {
  if (typeof str !== 'string') return false;
  return true;
}
function IsObject(obj) {
  if (typeof obj !== 'object') return false;
  return true;
}
function IsMap(map) {
  if (map instanceof Map) return false;
  return true;
}
function IsKey(str) {
  if (!Object.isString(str)) return false;
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
  if (!IsDefined(obj)) return false;
  if (HasKey(map, key)) return false;
  map.set(key, obj);
}
function DeleteKey(map, key) {
  if (!HasKey(map, key)) return false;
  const obj = map.get(key);
  if (!map.delete(key)) return false;
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
