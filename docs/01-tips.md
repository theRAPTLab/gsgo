## Useful Tips

### Useful npm commands

* `npm list -g --depth=0` to see what GLOBAL PACKAGES are installed

### ESLINT gotchyas

If you have multiple `.eslintrc` in any open folders, they may cause mysterious conflicts to display. This can happen if you have a file open from another project with its own `.eslintrc` config. To work around it, try this:

* close the file from the other project (close all files maybe)
* under VSC's git panel, close the associated git repo
* quit vsc, then restart with the workspace

