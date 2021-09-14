# UR-FILE
*WORKING DRAFT*

The UR File module helps the appserver to:

* serve **static** files that are part of the repo through the appserver via HTTP
* create **runtime** files for 'group sessions' that need storage of screenshots, run data, etc via URNET
* create **manifests** for files in a directory
* file and directory **utilities** for time stamping, filename generation, path hash/dehash, directory contents, etc
* remote directory file pass-though caching into runtime directory
* download **versioned zip archives** of the static asset directory
* **create versioned zip archives** of the UR File System (both static and runtime)
* provide **system config overrides** for value that are otherwise hardcoded

Additionally, the UR File module integrates with other elements of the URSYS universe:
* provide **json file saving** of **GraphQL** queries to UR DB
* provide access to **config information** to UR COMMON for overriding settings there
* respect **ident/auth** system (TBD) to control file access
* provide **file streaming** and **stream control** for serving video files/recorded event data (this might be moved into its own module UR-RTC, but am listing it here so we don't forget about this)

## STATIC FILES

The `static/` directory is accessed via http, served by Express.static middleware on the route `/static/*`. The static directory is CORS enabled by default and is partially included in the GEMSTEP repository.

```
gsgo/
  static/           files served via Express as static files
  ... _import/      zipped binary asset(s) to be unpacked into static
  ... bin/          binary assets (NOT IN REPO)
        spr/
        bg/
        mp3/
        png/
  ... data/         hardcoded non-model data (in repo)
  ... model/        hardcoded model data (in repo)
```
### BINARY FILES

We **do not allow binary assets** in our repo due to their size, uncompressibility, and inefficiency in Git repos. The only exception are small assets like `favicon.ico` are allowable if they are essential to the proper operation of the system. Application-related binary assets should not be included. 

* Text-based assets that are not representations of graphics (e.g. JSON, Markdown) are OK to include in the repo.
* Text-encoded graphics assets **ARE NOT** OK. This includes formats like BASE64-encoded graphic files, SVG, LottieFiles, and so forth.

To handle binary assets, we instead using a combination of **ZIP archives** and **remote http CORS directories** to populate the `static/bin` directory. URFILE is designed to handle this behind the scenes; all you need to do is provide the **AssetVersionId** and where to get it from in the `runtime/config/sources.json` file. If the AssetVersionID is not provided, the hardcoded default asset set will be loaded with a warning.

### ASSET DISTRIBUTION

UR-FILE is designed to fetch static sources from remote directories on the web via HTTP if required. Additionally:

* It will also be able to pull zip archives via HTTP and unpack them into the static directory
* If the network is not available and you have already pulled the assets in a previous session on your appserver, the files will be cached and still available.
* If you don't have the cached files and can't access the network, you can download the zip archive onto a thumb drive and copy it into the `_import` directory. They will be unzipped in sorted order.
* If you need to copy the working set of assets for a particular installation, UR-FILE will be able to generate the archive for you by requesting a special URL like `http://localhost/urfile/archive/static` (not including the contents of `_import` which is for manual install only.)

## ASSET VERSIONING

The challenge with managing binary assets for games is having a "known good set" of assets that can be trusted as a whole to be complete, which makes distributing and cloning this data very simple. The convention we are using is a **working set** that has a particular AssetVersionId that is tied to a particular milestone of development. Should the contents and format of required binary assets change, the AssetAversionId is either incremented or changed. Artists are responsible for managing what's in the current working directory on their network shared assets drive, keeping track of what the current AssetVersionId is. If this convention is followed, it becomes easy to refer to WHICH set of assets we are working with at a given time.

The AssetVersionId has a form like this: `activity-subdir-specifier-version`. The only required parts are `activity` and `version`.

* **activity** is a scope identifier that accurately describes the type of assets inside it. For example, if the asset package has level-related data structures and sprites, this could be `level01`. For GEMSTEP, it will probably is the name of the trial you are preparing for, but it is up to you.
* **subdir** refers to what kind of assets they are. For example, if an archive pack only contains level sprites, the AssetVersionId would start with `level01-sprite`. The Asset Manager will use the second as a subdirectory; the complete URL to these assets would be `http://static/bin/level01/sprite`. 
* **specifier** is an additional specifier, essentially a subdirectory beneath subsystem. 
* **version** is a code that describes the state of these assets. In general, we use the code `DR` to indicate a 'draft release' or work-in-progress set, `RC` for 'release candidate' indicating a set that is being prepared for a final delivery, and `FINAL` for a set that is considered final. There is also a **two digit** code after the code to indicate what set it is. See **Examples of Version Numbers** for more details

If **many datasets and revisions** are expected:

* **prefix** is a DATE CODE of the form `yyyymm_vv-`, where `yyyy` can be any numeric 2-4 digit year, `mm` is the month, and `vv` is a two digit version number starting from 00. The version number is used if more than one data set is being recorded on a particular day; it is automatically incremented through a mechanism to be determined. We use this instead of `MMDD:H:M:S` just to keep the directory names shorter, and since the contents of these directories change infrequently this is an adequate granularity. 

**Meta information** can be included in each directory:

* A `00-README.MD` or `00-INFO.MD` file is a Markdown document that contains notes for future data archeologists trying to figure out what these files were used for. This is primarily good for creating binary assets and can include trial information, changes made, and other important contextual information helpful for reconstructing what it was used for.
* A `00-MANIFEST.JSON` file that lists the file contents that are to be made available to UR-FILE's directory synching system. This way, you can specific exactly what files should be served and keep old versions in it. The manifest file format is TBD, but it will essentially be a directory listing with an "info" field describing what is in there.
* Additional `00-MANIFEST-NN.JSON` files, where `NN` is a version number. It can be used to selectively add/remove elements that were present in the master file without rewriting it completely. This is useful when you want to 'patch' the master asset file and keep track of what's changed; changes that survive this milestone can then be merged into the next AssetVersionId directory

#### EXAMPLES OF VERSION NUMBERS

```
decomp-DR01             the entire contents of /static/ will be replaced by this asset set
decomp-DR02             the entire contents of /static/ will be replaced by this asset set
decomp-bin-DR01         the subdirectory /static/bin/ will be replaced
2021-decomp-moth-DR01   the subdirectory /static/moth/ will be replaced
202107_01-decomp-DR01   the entire contents of /static/ is replaced
```
In general, you should pick **one prefix format** and **stick with it**. The prefix format is provided to help sort datasets by chronological order, which is useful for reconstructing history and changes to data over time. 

There are also **stages of finality** for asset sets. Here are some examples:
```
decomp-DR01             draft release version 01
decomp-DR02             draft release version 02
decomp-RC02             release candidate based on draft release version 02
decomp-RC02A            release candidate changed from RC02 without going back to DR
decomp-02A-FINAL        final candidate based on RC02A
decomp-03-FINAL         02A wasn't actually final; THIS ONE should be final
```
These codes are chosen to sort in a useful order, which would be this:
```
decomp-02A-FINAL        all the "final" sets are at the top of the directory
decomp-03-FINAL         the last file in the FINAL category is the latest
decomp-DR01             all the draft releases
decomp-DR02
decomp-RC02             all the release candidates
decomp-RC02A
```
When you use prefixes, the same ordering is retained by grouped by date of milestone
```
2107_00-decomp-03-FINAL
2107_00-decomp-DR01        all the draft releases for July 2021, set 00
2107_00-decomp-DR02
2107_00-decomp-RC02        all the release candidates for July 2021, set 00
2107_01-decomp-DR01        NEW SET 01 draft release 01...
2107_01-decomp-DR02        ...02
2107_01-decomp-DR03        ...03
```

If your "final" ends up not actually being final, then increment the last RC version. However, as GEMSTEP is continually in development just stick with `DR`; just saying which asset set should be used for a particular purpose is adequate. The use of `RC` and `FINAL` codes are for shipping polished software intended for public consumption, where quality control is of supreme importance. 

## SUMMARY OF TECHNICAL FEATURES

Integrations
* graphql-to-jsonfile integration
* session auth/identity integration

File Services
* serve static files
* serve static files CORS enabled
* ensure path exists
* directory listing generation
* create directory manifest
* diff directory with manifest
* filename timestamp utilities
* filename hashkey generation
* file load/save to runtime/

Deployment Services
* initialize from zip archive
* create zip archive
* sync from remote directory
* passthrough cache

Express Middleware
* define routename
* define routedirectory
* store route info in UR COMMON
* route relative to APP ROOT (duh)
