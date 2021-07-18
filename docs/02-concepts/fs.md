```
NODE FS 
[...document.querySelectorAll('h4 code').values()].map(e=>e.innerHTML).forEach(s=>console.log(s))

PROMISES

fsPromises.access(path[, mode])
fsPromises.appendFile(path, data[, options])
fsPromises.chmod(path, mode)
fsPromises.chown(path, uid, gid)
fsPromises.copyFile(src, dest[, mode])
fsPromises.lchmod(path, mode)
fsPromises.lchown(path, uid, gid)
fsPromises.lutimes(path, atime, mtime)
fsPromises.link(existingPath, newPath)
fsPromises.lstat(path[, options])
fsPromises.mkdir(path[, options])
fsPromises.mkdtemp(prefix[, options])
fsPromises.open(path, flags[, mode])
fsPromises.opendir(path[, options])
fsPromises.readdir(path[, options])
fsPromises.readFile(path[, options])
fsPromises.readlink(path[, options])
fsPromises.realpath(path[, options])
fsPromises.rename(oldPath, newPath)
fsPromises.rmdir(path[, options])
fsPromises.rm(path[, options])
fsPromises.stat(path[, options])
fsPromises.symlink(target, path[, type])
fsPromises.truncate(path[, len])
fsPromises.unlink(path)
fsPromises.utimes(path, atime, mtime)
fsPromises.watch(filename[, options])
fsPromises.writeFile(file, data[, options])

SYNCHRONOUS 
fs.access(path[, mode], callback)
fs.appendFile(path, data[, options], callback)
fs.chmod(path, mode, callback)
fs.chown(path, uid, gid, callback)
fs.close(fd[, callback])
fs.copyFile(src, dest[, mode], callback)
fs.createReadStream(path[, options])
fs.createWriteStream(path[, options])
fs.exists(path, callback)
fs.fchmod(fd, mode, callback)
fs.fchown(fd, uid, gid, callback)
fs.fdatasync(fd, callback)
fs.fstat(fd[, options], callback)
fs.fsync(fd, callback)
fs.ftruncate(fd[, len], callback)
fs.futimes(fd, atime, mtime, callback)
fs.lchmod(path, mode, callback)
fs.lchown(path, uid, gid, callback)
fs.lutimes(path, atime, mtime, callback)
fs.link(existingPath, newPath, callback)
fs.lstat(path[, options], callback)
fs.mkdir(path[, options], callback)
fs.mkdtemp(prefix[, options], callback)
fs.open(path[, flags[, mode]], callback)
fs.opendir(path[, options], callback)
fs.read(fd, buffer, offset, length, position, callback)
fs.read(fd, [options,] callback)
fs.readdir(path[, options], callback)
fs.readFile(path[, options], callback)
fs.readlink(path[, options], callback)
fs.readv(fd, buffers[, position], callback)
fs.realpath(path[, options], callback)
fs.realpath.native(path[, options], callback)
fs.rename(oldPath, newPath, callback)
fs.rmdir(path[, options], callback)
fs.rm(path[, options], callback)
fs.stat(path[, options], callback)
fs.symlink(target, path[, type], callback)
fs.truncate(path[, len], callback)
fs.unlink(path, callback)
fs.unwatchFile(filename[, listener])
fs.utimes(path, atime, mtime, callback)
fs.watch(filename[, options][, listener])
fs.watchFile(filename[, options], listener)
fs.write(fd, buffer[, offset[, length[, position]]], callback)
fs.write(fd, string[, position[, encoding]], callback)
fs.writeFile(file, data[, options], callback)
fs.writev(fd, buffers[, position], callback)
fs.accessSync(path[, mode])
fs.appendFileSync(path, data[, options])
fs.chmodSync(path, mode)
fs.chownSync(path, uid, gid)
fs.closeSync(fd)
fs.copyFileSync(src, dest[, mode])
fs.existsSync(path)
fs.fchmodSync(fd, mode)
fs.fchownSync(fd, uid, gid)
fs.fdatasyncSync(fd)
fs.fstatSync(fd[, options])
fs.fsyncSync(fd)
fs.ftruncateSync(fd[, len])
fs.futimesSync(fd, atime, mtime)
fs.lchmodSync(path, mode)
fs.lchownSync(path, uid, gid)
fs.lutimesSync(path, atime, mtime)
fs.linkSync(existingPath, newPath)
fs.lstatSync(path[, options])
fs.mkdirSync(path[, options])
fs.mkdtempSync(prefix[, options])
fs.opendirSync(path[, options])
fs.openSync(path[, flags[, mode]])
fs.readdirSync(path[, options])
fs.readFileSync(path[, options])
fs.readlinkSync(path[, options])
fs.readSync(fd, buffer, offset, length, position)
fs.readSync(fd, buffer, [options])
fs.readvSync(fd, buffers[, position])
fs.realpathSync(path[, options])
fs.realpathSync.native(path[, options])
fs.renameSync(oldPath, newPath)
fs.rmdirSync(path[, options])
fs.rmSync(path[, options])
fs.statSync(path[, options])
fs.symlinkSync(target, path[, type])
fs.truncateSync(path[, len])
fs.unlinkSync(path)
fs.utimesSync(path, atime, mtime)
fs.writeFileSync(file, data[, options])
fs.writeSync(fd, buffer[, offset[, length[, position]]])
fs.writeSync(fd, string[, position[, encoding]])
fs.writevSync(fd, buffers[, position])

fs.Dir
fs.Dirent
fs.FSWatcher
fs.StatWatcher
fs.ReadStream
fs.Stats
fs.WriteStream
fs.constants


```

FS-EXTRA

```
ASYNCHRONOUS (callback, also promise version)

copy
emptyDir
ensureFile
ensureDir
ensureLink
ensureSymlink
mkdirp
mkdirs
move
outputFile
outputJson
pathExists
readJson
remove
writeJson

SYNCHRONOUS

copySync
emptyDirSync
ensureFileSync
ensureDirSync
ensureLinkSync
ensureSymlinkSync
mkdirpSync
mkdirsSync
moveSync
outputFileSync
outputJsonSync
pathExistsSync
readJsonSync
removeSync
writeJsonSync
```

