# Dev Environment Setup

GEM-STEP is a collection of server and client code packages developed in Javascript. The system is implemented using NodeJS for the servers and HTML5 running in the browser. If you are familiar with Javascript development using a command line interface, then you will find these tools familiar. If not, we've tried to make the installation process as simple as possible.

## 0. Installing the Development Environment

If you are installing on a clean MacOS Mojave or later system:

1. open **Terminal** app
2. enter `xcode-select --install` (accept dialog box, then wait for install to complete)
3. enter `cd ~; mkdir dev` (creates a 'dev' directory in your user folder)

Now download the repo:

1. enter `cd ~/dev`
2. enter `git clone https://gitlab.com/stepsys/gem-step/gsgo`
3. enter `cd gsgo`

At this point you can run our **install script** to set everything up. This script detect what version of a (supported) operating system you're running, and then emits the commands for you to type. Copy and paste them into the terminal window. 

1. enter `scripts/install-mac.sh`
2. read the output to see what to do!

## 1. (Optional) Install Recommended Code Editor

If you are planning to edit any source files in GEM-STEP, then you should also install [Visual Studio Code](https://code.visualstudio.com/Download) (VSCode). This is our official code editor that supports our development requirements, and is available on all major platforms.

After you've installed VSCode, use the FILE menu to open the workspace named `gsgo/gsgo.code-workspace`. This workspace has project-specific settings in it.
After you open the workspace, you should use this for all future editing within the project. 

The first time you open the gsgo workspace, you will be prompted on what RECOMMENDED EXTENSIONS to install. You will have to install these manually by going to the EXTENSIONS tab on the left-side vertical panel.

For more information about what these extensions are doing, see [`20-tooling/20-vscode-qol.md`](20-vscode-qol.md). 

## 2. Running GEM-STEP

GEM-STEP is a collection of code packages in a single Git repository. To run a particular package, you use the `npm run` command in Terminal from the 'gsgo' directory. If you have renamed your directory please substitute the appropriate name in the examples below, which assume that the repo is located at `~/projects/gsgo`

### After first time install
```
cd ~/projects/gsgo
npm run bootstrap
``` 
Type `npm start` to run the full system. Use `CTRL-C` to stop system.

### Run a named system
```
npm run <subsystem>
```
Use `CTRL-C` to stop system. Valid subsystem names are listed using `npm run list` (e.g. 'gem').

## 3. Updating GEM-STEP

We release frequent updates to GEM-STEP throughout the project cycle. To make sure your version is up to date, you will have to pull the latest code changes from our source code repository.

```
git pull
npm run bootstrap
```
Afterwards use the `npm start` or `npm run <subsystem>` command to run per usual.

*You may be prompted to enter a password after `git pull`. This is your GitLab password.*

## 4. Test a Development Branch

We also release alternative development versions of the software in "branches". 
```
git pull                # get latest version of the repo
git checkout <branch>   # change to named branch (e.g. "dev")
npm run bootstrap       # install all dependencies
```
Then run the system with `npm start` or `npm run <subsystem>`. Use `CTRL-C` to stop the system.

After you checkout a branch, you'll probably want to switch back to the "master release" branch which is named `master`.
```
git checkout master
npm run bootstrap
```
## TIPS
* If you are not sure what branch you are currently on, use the `git status` command.
* If you have accidentally edited any files, changing branches may not be possible because Git wants you to save them. You probably DON'T want to save them back to the repo, as this would disrupt our development workflow. Use the command `git reset --hard HEAD` to restore the current branch to the way it was, which will lose all your changes.


