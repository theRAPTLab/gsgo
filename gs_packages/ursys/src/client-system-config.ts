/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT SYSTEM CONFIG UTILILITIE
  used for storing/modifying configuration information that persists from
  server startup to start

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PROMPTS = require('./util/prompts');
const DBG = require('./ur-dbg-settings');

/// TYPES /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ValidLocaleSettings = ['PTrack'];
interface ILocale {
  localeKey: string;
  setting: {
    PTrack?: {
      width: number;
      depth: number;
      offx: number;
      offy: number;
      xscale: number;
      yscale: number;
      xrot: number;
      yrot: number;
      zrot: number;
    };
  };
}
interface LocaleSetting {
  currentLocale: string;
}

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('CONFIG', 'TagDkRed');
const LOCALE_DATA = new Map<string, ILocale>(); // this will be backed by DB
const LOCALE_CONFIG: LocaleSetting = { currentLocale: 'none' };

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetLocale(key: string) {
  if (!ValidLocaleSettings.includes(key)) return;
  console.log(`retrieve locale:${key}`);
}

export function SelectLocale(key: string) {}
export function UpdateLocale(key: string, obj: ILocale) {}
