/* step-filesystem */

var DBG = false;

/**	FILESYSTEM **************************************************************\

  Implements common STEP server file-related management functions.

  OTHER LIBRARY REFERENCE

  Path.resolve( [...paths] )  returns absolute path
  Path.normalize( path )      resolves .. and . segments as well as removes extra /
  Path.dirname( path )        returns the directory name of the path (strips the last portion)
  Path.basename( path )       returns the last portion of the path (usually the filename+ext)

//////////////////////////////////////////////////////////////////////////////
/** LOAD SHARED BROWSER JAVASCRIPT ******************************************/

//////////////////////////////////////////////////////////////////////////////
/**	LOAD LIBRARIES **********************************************************/

var Path = require('path');
var FSe = require('fs-extra');

//////////////////////////////////////////////////////////////////////////////
/** ENUMS *******************************************************************/

// console output prefix definitions
var PR = require('./text-constants').PROMPTS;
var BP = PR._;
var CP = PR.NOTEC;
var WTF = PR.WTF;
var WP = PR.WARN;
var ALP = PR.NOTED;
var NP = PR.UNET;
var EP = PR.ERROR;
var ADDP = PR.ADD;
var SUBP = PR.DEL;
var AP = PR.ALERT;
var INP = PR.IN;
var OUTP = PR.OUT;

//////////////////////////////////////////////////////////////////////////////
/**	MODULE VARIABLES ********************************************************/

const m_rec_ext = '.rec';

//////////////////////////////////////////////////////////////////////////////
/**	API MAIN METHODS ********************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns TRUE if the passed path file actually exists
/*/ function API_FileExists(
  path
) {
  try {
    // accessSync only throws an error; doesn't return a value
    FSe.accessSync(path);
    return true;
  } catch (e) {
    return false;
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns TRUE if the passed file is a directory
/*/ function API_DirectoryExists(
  path
) {
  try {
    var stat = FSe.statSync(path);
    if (stat.isFile()) {
      console.warn(
        EP,
        'STEP-FS.DirectoryExists: Passed path is a file, not a directory',
        path
      );
      return false;
    }
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return the basepath (plus subpath) of the sessions directory, which
  stores any saved data files from a webapp via the server
/*/ function API_GetAppStorageDirectory(/* args */) {
  var path = __dirname + '/../app_storage/';
  var c = arguments.length;
  if (c) {
    for (var i = 0; i < c; i++) {
      path += arguments[i] + '/';
    }
  }
  return path;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Given a path, make sure that it exists
/*/ function API_EnsureDirectory(path) {
  try {
    FSe.ensureDirSync(path);
    return true;
  } catch (err) {
    var errmsg = 'STEPFS: EnsureDir <' + path + '> failed w/ error ' + err;
    console.error(errmsg);
    throw new Error(errmsg);
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Make a session recording path from sessionInfo
/*/ function API_GetUniqueRecPathBits(
  sessionInfo
) {
  var errp = 'STEPFS.API_GetUniqueRecPath:';
  /** check for valid object data **/
  if (!sessionInfo) {
    console.error(EP, errp, 'sessionInfo object must be passed');
    return;
  }
  if (!sessionInfo.unit_id) {
    console.error(EP, errp, 'sessionInfo missing unit_id');
    return;
  }
  /** hardcoded check for valid units **/
  if (
    !(
      sessionInfo.unit_id === 'StatesOfMatter' || sessionInfo.unit_id === 'BeeSim'
    )
  ) {
    console.error(EP, errp, 'unit_id must be StatesOfMatter or BeeSim');
    return;
  }
  if (!sessionInfo.game_id) {
    console.error(EP, errp, 'sessionInfo missing game_id. Must be string.');
    return;
  }

  var pathBits = API_GetSessionDirectoryBits(sessionInfo);
  var recfile_path = pathBits.session_dir;
  API_EnsureDirectory(recfile_path);

  /** count .rec files in the session path **/
  var test = API_GetRecFilesInDirectory(recfile_path);
  var highest = test.highest;
  var count = test.count;

  /** generate the complete filepath **/
  var newrecfilename = ZeroPad(highest + 1, 3) + '-';
  newrecfilename += sessionInfo.game_id;
  // console.log('generating filename',newrecfilename);

  return {
    full_file_path_base: Path.join(recfile_path, newrecfilename),
    full_session_path: recfile_path,
    session_path: pathBits.activity_subdir,
    file_path_base: newrecfilename
  };
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return a nanosecond timestamp for recording / playback
/*/ function API_GetNanoTimestamp() {
  return GetNanoTimeNow().nsec_now;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return useful path strings related to sessionInfo
  { unit_id, game_id }
/*/ function API_GetSessionDirectoryBits(
  sessionInfo
) {
  // unitpath: [..]server/sessions/StatesOfMatter
  var unitpath = API_GetAppStorageDirectory(sessionInfo.unit_id, 'sessions');
  var timeStrings = API_GetTimeNowStrings();
  var date_subdir = timeStrings.yyyy + '-' + timeStrings.mm + timeStrings.dd;
  // session_dir: [..]server/sessions/StatesOfMatter + /20170224
  var session_dir = Path.join(unitpath, date_subdir);
  // activity_subdir: StatesOfMatter/20170224
  var activity_subdir = Path.join(sessionInfo.unit_id, 'sessions', date_subdir);

  return { session_dir, activity_subdir, date_subdir };
}

//////////////////////////////////////////////////////////////////////////////
/**	UTILTIY FUNCTIONS *******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return an object with time strings based on passed date, or current time
  if date object isn't passed in
/*/ function API_GetTimeNowStrings(
  date
) {
  date = date || new Date();
  var dd = ('0' + date.getDate()).slice(-2);
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var hms = ('0' + date.getHours()).slice(-2);
  hms += ('0' + date.getMinutes()).slice(-2);
  hms += ('0' + date.getSeconds()).slice(-2);
  var yy = date.getFullYear().toString();

  return {
    dd: dd,
    mm: mm,
    hms: hms,
    yyyy: yy,
    dateval: date.valueOf()
  };
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DEPRECATED: Return a SessionPath that points to TODAY'S DATE; this will
  be used to request a directory listing of all .REC files inside it.
/*/ function API_GetTodaySessionPath(
  selector
) {
  // generate session files
  var errp = 'STEPFS.API_GetTodaySessionPath:';
  var ts = API_GetTimeNowStrings();
  var subdir = ts.yyyy + '-' + ts.mm + ts.dd;
  var path = API_GetAppStorageDirectory();
  var unit_id = selector.unit_id || '[UnitID]';
  path = Path.join(path, unit_id, subdir);
  //
  if (API_DirectoryExists(path)) {
    return path;
  } else {
    console.log(
      'STEPFS.API_GetTodaySessionPath:',
      'no current session path exists:',
      path
    );
    return null;
  }
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return a high resolution time object
/*/ function GetNanoTimeNow() {
  var hrt = process.hrtime();
  var nsecs = Math.floor(hrt[0] * 1e9 + hrt[1]);
  return {
    time_sec: hrt[0],
    time_nsec: hrt[1],
    nsec_now: nsecs
  };
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return an object with time strings suitable for timestamping a recorded
  event to nanosecond accuracy
/*/ function GetNanoTimeNowStrings() {
  // get high resolution time

  var hrt = process.hrtime();
  var now_ns = hrt[0] * 1e9 + hrt[1];
  // truncate the time to integer nanoseconds
  now_ns = Math.floor(now_ns);
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return object with highest recfile, count, and highest-numbered file with list of
  all files as well. (Format NNN-D1A1-ActName.rec)
  Based on http://stackoverflow.com/questions/25460574/
/*/ function API_GetRecFilesInDirectory(
  startPath
) {
  var errp = 'STEPFS.API_GetRecFilesInDirectory:';
  if (!FSe.existsSync(startPath)) {
    console.log(errp, 'no dir', startPath);
    return 0;
  }

  var files = FSe.readdirSync(startPath);
  if (DBG) console.log(errp, 'found', files.length, 'files');

  var count = 0;
  var highest = 0;

  for (var i = 0; i < files.length; i++) {
    var filepath = Path.join(startPath, files[i]);
    var stat = FSe.lstatSync(filepath);
    if (stat.isDirectory()) continue;
    var test = IsRecorderFilepath(filepath);
    if (test) {
      count++;
      highest = Math.max(test.num, highest);
    }
  }

  return {
    count: count,
    highest: highest,
    files: files
  };
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ passed a filepath, checks that the basename is a .rec file with the
  appropriate naming convention. returns object with filename properties
  that might be of interest (for counting highest num for example)
/*/ function IsRecorderFilepath(
  filepath
) {
  var errp = 'STEPFS.IsRecorderFilepath:';
  if (DBG) console.log(errp, 'test', Path.basename(filepath));
  // does it end in the right .ext?
  var success = true;
  success &= Path.extname(filepath) === m_rec_ext;
  // if (!success) console.log(errp,'exttest fail, got:',Path.extname(filepath));

  // are the first three chars an integer?
  var filename = Path.basename(filepath);
  var num = filename.substr(0, 3); // first three chars
  success &= !isNaN(num);
  // if (!success) console.log('.. numtest fail, got:',filename,num);

  // is there a dash following the integer?
  success &= filename.charAt(3) === '-';
  // if (!success) console.log('.. dashtest fail, got:',filename.charAt(3));

  // return info parsed out of the filename
  if (success)
    return {
      num: Number.parseInt(num)
    };
  return false;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Pad an integer with leading zeros (handles negative integers too)
  Copied from 1401/js-extend.js.
/*/ function ZeroPad(
  num,
  numDigits
) {
  numDigits = numDigits || 5;
  var n = Math.abs(num);
  var zeros = Math.max(0, numDigits - Math.floor(n).toString().length);
  var zeroString = Math.pow(10, zeros).toString().substr(1);
  if (num < 0) {
    zeroString = '-' + zeroString;
  }
  return zeroString + n;
}

//////////////////////////////////////////////////////////////////////////////
/**	EXPORTS *****************************************************************/
exports.FileExists = API_FileExists;
exports.DirectoryExists = API_DirectoryExists;
exports.GetAppStorageDirectory = API_GetAppStorageDirectory;
exports.GetRecFilesInDirectory = API_GetRecFilesInDirectory;
exports.GetSessionDirectoryBits = API_GetSessionDirectoryBits;
exports.EnsureDirectoryExists = API_EnsureDirectory;
//	exports.MakeSessionLogPath      = API_MakeSessionLogPath; // deprecated
exports.GetUniqueRecPathBits = API_GetUniqueRecPathBits;
exports.GetNanoTimestamp = API_GetNanoTimestamp;
exports.GetTimeNowStrings = API_GetTimeNowStrings;
//	exports.GetTodaySessionPath = API_GetTodaySessionPath; // deprecated

/*

  FileExists( path )
    return true (synchronous) if file exists
    : not used anywhere
    : consider replace step-webserver app.use('/media')

  DirectoryExists( path )
    return true (synchronous) if path is a directory
    <- API_GetTodaySessionPath (3)

  EnsureDirectoryExists
    return true if directory exists/made to exist
    <- API_GetUniqueRecPath (4)

*	GetSessionDirectoryBits()
    returns session directory, activity subdir, and date-subdir
    <- API_GetUniqueRecPath (4)
    <- step-recorder.API_OpenRecording (4)

  GetAppStorageDirectory( args )
    return the path to storage directory, + args
    <- class-recfilereader.open
    <- API_GetSessionDirectoryBits (2)
    <- API_GetTodaySessionPath (3)
    <- step-recorder.API_OpenPlayback

  GetRecFilesInDirectory()
    returns list of REC files
    <- API_GetUniqueRecPath (4)

*	GetUniqueRecPath( sessionInfo )
    given unit_id, game_id, return next numbered REC path
    <- step-recorder.API_OpenRecording (4)

  GetNanoTimestamp()
    return nanosecond timestap
    <- step-recorder.API_OpenRecording (4)
    <- step-recorder.API_RecordPacket
    <- step-unisys.pr()

  GetTimeNowStrings()
    return { dd,mm,hmy,yy,dateval }
    <- API_GetSessionDirectoryBits (2)
    <- API_GetTodaySessionPath (3)
    <- step-recorder.API_OpenRecording (4)
    <- step-recorder.API_GetSessions

  IsRecorderFilepath( filepath )
    checks that path basename conforms to recfile standard
    <- API_GetRecFilesInDirectory

  ZeroPad( num, numDigits )
    adds leading digits padded out to numDigits
    <- API_GetUniqueRecPath (4)

*/
