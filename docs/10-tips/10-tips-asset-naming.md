A naming convention I use for asset sets is to create working folders with a pattern like: activity-subsystem-spec-DR01 , where:

* activity might be something like the name of a level, a self-contained project, or something. For GEMSTEP it probably is the name of the trial you are preparing for?

* subsystem refers to what kind of assets they are, so we know where to put them. We have a single 'assets' folder, so this could be set to just assets

* name is an optional specifier, maybe something like 'sprites' if the contents of the folder is just the sprites in the assets folders. We probably want a FULL asset directory, so we don't need to use this.

* DR01 is an incremental version number for "Draft Release". Start with 01, and this refers to the set. If we change specs we increment to 02, etc. You can change stuff in the current working forlder, and then just tell us which one to look at.

* When we have something that we think is ready for final testing, use RC (release candidate) and use the SAME number as the DR it is based on. For example, if DR02 is the set that we've decided to use, then the RC that is derived from it is RC02 (not RC01).

* When we have something that is DEFINITELY final, then the RC is replaced with FINAL-RC02 .

* If changes need to be made, then you need to go back to increment RC. If you find you are bouncing back between RC and FINAL a lot, you should just not use FINAL at all.

The point of the naming convention is to make it possible to see the history of the data sets at particular stages, and also see what CHANGED between them.  These are complete sets of files, not partial ones, so there is no question that anything is missing.
By adhering to the naming convention, we can easily ZIP the folder and deploy them by a specific name.

A nice extra touch is to include a 00-INFO.MD file in each directory with some background notes on what's in it, what's changed, and other notes that are helpful to integrators and data archeologists from the future (like future versions of us that have forgotten what it was we did and why)

If we anticipate a lot of datasets that change, we can include the year and month of the testing period (like 2107-) as a prefix. This will help us see the order of creation without cluttering the filename up too much. If revisions are updating on a daily basis, then we probably need a different system to avoid massive data duplication; this asset management scheme is for managing change over a week or more until a significant organization-wide build is released. In our case it's when we freeze a build for testing.
