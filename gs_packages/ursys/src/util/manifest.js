/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manifest Read/Write Routines

  Utilities to fetch a manifest and copy related files.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const Path = require('path');
const fetch = require('node-fetch').default;
const FILE = require('./files');
const ASFILE = require('./files-assets');
const HTTP = require('./http');
const DCODE = require('./decoders');

const {
  GS_MANIFEST_FILENAME,
  GS_ASSETS_PATH,
  GS_ASSETS_ROUTE
} = require('../../../../gsgo-settings');

const PROMPTS = require('./prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = PROMPTS.makeTerminalOut('U-MFEST', 'TagGreen');
const ASSET_ID_START = 100;
const DBG = true;
let m_assetPath = GS_ASSETS_PATH;
let m_remoteAssetUrl;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns true if the url resource exists on the specified URL
 *  @example const exists = await m_ResourceExists(url)
 */
async function m_ResourceExists(url) {
  try {
    const { ok } = await fetch(url, { method: 'HEAD' });
    return ok;
  } catch (e) {
    return false;
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** filter the filelist for valid sprite-related image files */
function f_SpriteAssets(subdirpath, files) {
  // scan for sprite files in json assets
  const jsonfiles = files.filter(f => Path.extname(f).toLowerCase() === '.json');

  // this should be moved to a sprite scanner
  const internalImages = []; // contains hard image assets
  jsonfiles.forEach(f => {
    const file = FILE.ReadJSON(`${subdirpath}/${f}`);
    const { meta, frames } = file;
    if (meta && meta.image) internalImages.push(meta.image);
    if (frames && Array.isArray(frames))
      for (let frame of frames)
        if (frame.filename) internalImages.push(frame.filenam);
  });
  if (DBG) {
    TERM(`... jsonfiles contained ${internalImages.length} image references`);
  }
  // only load hard png assets that were not referenced inside a JSON file
  const imgFiles = files.filter(f => !internalImages.includes(f));
  return { mediafiles: imgFiles };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** filter the filelist for valid sprite-related image files */
function f_ProjectAssets(subdirpath, files) {
  // scan for project files in assets
  const jsfiles = files.filter(f => Path.extname(f).toLowerCase() === '.gemprj');
  if (DBG) {
    TERM(`... jsfiles contained ${jsfiles.length} project references`);
  }
  return { mediafiles: jsfiles };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a list of mediafiles for the assetype of the directory, which is
 *  determined by the terminating dirname of the path.
 */
function m_ScanAssets(subdirpath) {
  const asType = subdirpath.substring(subdirpath.lastIndexOf('/') + 1);
  if (!ASFILE.IsAssetDirname(asType)) return [`invalid asset subdir ${asType}`];
  // get all the files
  const files = FILE.GetFiles(subdirpath).filter(f =>
    ASFILE.HasValidAssetExtension({ type: asType, filename: f })
  );
  if (DBG) TERM(`... ${asType} has ${files.length} valid files`);

  let mediaObj;
  try {
    switch (asType) {
      case 'sprites':
        mediaObj = f_SpriteAssets(subdirpath, files);
        // TERM(`Sprite scanAssets mediaObj ${JSON.stringify(mediaObj)}`);
        break;
      case 'projects':
        TERM('ho ho ho');
        mediaObj = f_ProjectAssets(subdirpath, files);
        TERM(`project scanAssets mediaObj ${JSON.stringify(mediaObj)}`);
        break;
      default:
        mediaObj = { err: `unknown astype ${asType}` };
    }
    mediaObj.assetType = asType;
    // this should return { assetType, mediafiles }
    return mediaObj;
  } catch (err) {
    TERM(`mScanAssets error "${err}" mediaObj error, skipping!`);
    return undefined;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return promises that will return the hash for each file's content,
 *  which is used to generate the autogenerated manifest
 */
function m_PromiseHashes(dirpath, files) {
  const promises = [];
  for (const f of files) {
    const p = Path.join(dirpath, f);
    promises.push(ASFILE.PromiseFileHash(p));
  }
  return promises;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** scans the passed dirpath for any manifest JSON files. There can be more
 *  than one manifest file but only the first one will be used (so don't use
 *  more than one manifest file at this point). Eventually we may want to
 *  implement recursive scanning or manifest overrides.
 *  @returns array of objects read from JSON files
 */
function m_GetManifestDataArray(dirpath) {
  const allfiles = FILE.GetFiles(dirpath);
  const manifests = allfiles
    .filter(f => f.startsWith(GS_MANIFEST_FILENAME) && f.endsWith('.json'))
    .sort();

  // CASE 1: 1 OR MORE MANIFEST FILES
  if (manifests.length > 0) {
    if (DBG) TERM('... manifest files:', manifests);
    const m = [];
    for (let f of manifests) {
      const obj = FILE.ReadJSON(`${dirpath}/${f}`);
      m.push(obj);
    }
    return m;
  }
  return [];
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the current dirpath to all local assets */
function SetAssetPath(path = GS_ASSETS_PATH) {
  m_assetPath = path;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the current remote URL to proxy local assets from */
function SetRemoteAssetUrl(url) {
  m_remoteAssetUrl = url;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Attempt to read manifest at given URL. Return a single JSON object
 *  if autogenerated, or an array of JSON objects otherwise
 */
async function ReadManifest(url) {
  const i = url.indexOf('?manifest');
  // if (i === url.length - 9) {/* manifest string found */}
  if (i < 0) url = `${url}?manifest`;
  try {
    const manifestExists = await m_ResourceExists(url);
    if (!manifestExists) return undefined;
    let json = await fetch(url).then(res => res.json());
    // could be array of objs (manifest files) or obj (autogenerated manifest)
    return json;
  } catch (e) {
    return undefined;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** extract list of urls to download from a manifest, return as array of
 *  url strings
 */
function ExtractResourceUrls(manifest) {
  // just run over all entries and pull the assetUrl
  const assets = [];
  const fields = Object.entries(manifest);
  for (const [asType, asList] of fields) {
    for (const { assetUrl } of asList) {
      if (assetUrl) assets.push(assetUrl);
    }
  }
  // these paths are relative to the containing directory
  return assets;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** EXPRESS MIDDLEWARE
 *  If a ?manifest is part of the request url, then try to deliver a manifest
 *  for it if it is a directory path. There are several cases:
 *  (1) the local asset dir has a manifest file
 *  (2) the local asset dir does not have a manifest file, so autogenerate it
 *  (3) local asset dir doesn't exist, so check remote has manifest file
 *  (4) ...otherwise download manifest from remote and all referenced filed
 */
async function DeliverManifest(req, res, next) {
  const manifest = {};
  const { fullURL, pathname, searchParams } = DCODE.DecodeRequest(req);
  // (1) if has ?manifest query, do special processing
  const path = Path.join(m_assetPath, pathname); // doesn't include /assets
  const pathInfo = DCODE.DecodePath(path);

  // SKIP FOR: no manifest request
  if (!searchParams.has('manifest')) {
    // TERM('SKIP: no manifest param');
    next();
    return;
  }
  // SKIP FOR: manifest request for a file, not dir
  if (pathInfo.isFile) {
    const err = `${fullURL} appears to be a file request, not a directory`;
    TERM(err);
    res.status(400).send(err);
    return;
  }
  // if we got here, then our synthesized path is a directory
  // manifest request and directory exists
  if (FILE.DirExists(path)) {
    if (DBG) TERM('return manifest for', path, 'from local');
    // CASE 1: are there manifest files?
    const mdata = m_GetManifestDataArray(path);
    if (mdata.length > 0) {
      res.json(mdata);
      return;
    }
    // case 2: autogenerate
    let assetcounter = ASSET_ID_START;
    const assetdirs = ASFILE.GetAssetDirs(path);
    if (DBG) TERM('... assetdirs', assetdirs, `\npath`, path);
    if (assetdirs.length === 0) {
      const base = Path.basename(m_assetPath);
      const refpath = `${base}/${GS_ASSETS_ROUTE}${pathname}`;
      TERM(`WARN: ${refpath} does not seem to be an asset directory`);
    }
    // step through every found asset type in directory
    for (const subdir of assetdirs) {
      if (DBG) TERM('... scanning', subdir);
      const subdirpath = Path.join(path, subdir);
      // get valid media files & jsonfiles subsets
      const { mediafiles } = m_ScanAssets(subdirpath);
      // only load hard png assets
      const promises = m_PromiseHashes(subdirpath, mediafiles);
      // - - - - - - - -
      //
      // eslint-disable-next-line no-await-in-loop
      const filesInfo = await Promise.all(promises);
      //
      // - - - - - - - -
      const entries = [];
      for (let info of filesInfo) {
        const assetId = assetcounter++;
        const { filename, ext: assetType, hash } = info;
        const asset = {
          assetId,
          assetName: filename,
          assetUrl: `${subdir}/${filename}`,
          assetType,
          hash
        };
        entries.push(asset);
      }
      manifest[subdir] = entries;
    } // end subdir processing
    // send result of automanifest
    res.json(manifest);
    return;
  }
  // CASE 3: manifest request & directory DOES NOT exist
  // premature abort
  if (!m_remoteAssetUrl) {
    TERM('SKIP PROXY: no remote asset URL defined');
    next();
    return;
  }
  const url = `${m_remoteAssetUrl}/${GS_ASSETS_ROUTE}${pathname}`;
  const remoteDirExists = await HTTP.HTTPResourceExists(url);
  if (!remoteDirExists) {
    TERM(`SKIP PROXY: ${url} does not exist on host`);
    next();
    return;
  }
  if (pathInfo.isDir) {
    let json = await ReadManifest(url);
    if (!json) {
      TERM('manifest', url, 'could not be read');
      next();
      return;
    }

    // if we got this far, we have a manifest object!
    // was the manifest a file? then also write it to dir
    if (Array.isArray(json)) {
      // only read the first loaded manifest
      json = json.shift();
      const mpath = Path.join(path, `${GS_MANIFEST_FILENAME}.json`);
      FILE.EnsureDir(path);
      FILE.WriteJSON(mpath, json, err => {
        if (err) TERM('error:', err);
      });
    }
    TERM('cached remote manifest from', pathname);

    // Files in the manifest will be downloaded. This may NOT download all files
    // in the remote asset directory, but the MediaProxy middleware will catch
    // these cases. The important part is to load all the files references in the
    // manifest
    const assets = ExtractResourceUrls(json);
    const promises = [];
    const f_err = err => {
      if (err) TERM('err proxy dl', err);
    };
    for (const asset of assets) {
      const remoteUrl = `${url}/${asset}`; // note that when dir?manifest, there is a missing slash so we have to insert it
      const newPath = `${path}/${asset}`;
      promises.push(HTTP.DownloadUrlToPath(remoteUrl, newPath, f_err));
    }
    //
    //
    await Promise.all(promises);
    //
    //
    next();
  }
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ReadManifest,
  ExtractResourceUrls,
  DeliverManifest,
  SetRemoteAssetUrl,
  SetAssetPath
};
