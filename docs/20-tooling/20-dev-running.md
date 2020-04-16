# Daily Operations with GEM-STEP

This presumes you have successfully [installed and initialized](20-dev-install.md) the development environment.

## 1. Running GEM-STEP

GEM-STEP is a collection of code packages in a single Git repository. 

To run a particular package, you use the `npm run` command in Terminal from the 'gsgo' directory. Substitute the location of your local repo for `~/projects/gsgo` in the following instructions.

### After first time install
```
cd ~/projects/gsgo
npm run bootstrap
``` 
Type `npm start` to run the full system. Use `CTRL-C` to stop system.

### Run a particular system by name
```
npm run <subsystem>
```
Use `CTRL-C` to stop system. Valid subsystem names are listed using `npm run list` (e.g. 'gem').

## 2. Update GEM-STEP to latest code

We release frequent updates to GEM-STEP throughout the project cycle. To make sure your version is up to date, you will have to pull the latest code changes from our source code repository.

```
git pull
npm run bootstrap
```
Afterwards use the `npm start` or `npm run <subsystem>` command to run per usual.

*You may be prompted to enter a password after `git pull`. This is your GitLab password.*

## 3. Test a Development Branch

We also release alternative development versions of the software in "branches", often in response to one of your requests. In these situations, you'll need to run the following commands:
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


