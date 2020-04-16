# Useful Tips

##  What npm packages are installed GLOBALLY?

* `npm list -g --depth=0` to see what GLOBAL PACKAGES are installed

## Configuration Debugging in VSCode

If you have multiple `.eslintrc` or `tsconfig.json` files in any open folders, they may cause mysterious conflicts to display. This can happen if you have a file open from another project with its own `.eslintrc` config. To work around it, try this:

* close the file from the other project (close all files maybe)
* under VSC's git panel, close the associated git repo
* quit vsc, then restart with the workspace

There is a VSCode extension `natqe.reload` that will **reload the entire editor** for you from the status par. Good to use anytime you mess with an internal setting.

## Directory Listing of Only Directories

`find * -type d -print` will output starting from the current directory

