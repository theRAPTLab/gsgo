export function GetEnsuredObjectPath(obj, dotaddress) {
  if (typeof obj !== 'object') {
    throw Error('err: arg1 must be an object');
  }
  if (typeof dotaddress !== 'string') {
    throw Error('err: arg2 must be a string using dot object notation');
  }
  const bits = dotaddress.split('.');
  let walker = obj;
  bits.forEach(bit => {
    if (walker[bit] === undefined) walker[bit] = {};
    walker = walker[bit];
  });
  return walker;
}
