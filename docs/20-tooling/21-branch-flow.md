# Branching Conventions

Reviewing our past workflow and several other OS projects that use LERNA, here's the process:

## Branch Naming

```
dev                  - active dev branch (default)
feat-[topic]         - feature being worked on. If 
issue-[id]-[topic]   - fixes related to an issue. branch from dev, merge to dev
hotfix-[id] 	       - patch made to master, merge to dev
dev-[user]/[topic]   - experimental user branch. ds=davesri, bl=benloh.
merge-issue-[id]     - integration: issues related. branch from latest dev, merge into dev
merge-feat-[topic]   - integration: feature branch for testing, then merge into dev
master               - release branch, to be be used for deployment
release              - tagged release branches, from master as squashed merge commit
```

1. New features, bugfixes, merge requests, etc should be **entered as issues** in the repo's management interface. This gives us an **issue id** that can be used in branch naming.
2. For experimental branches, start with `dev-[user]/[topic]` and play with it. When you are ready to 
3. When ready to merge, create a new `merge-*` branch from latest `dev` and merge your branch into it somehow to test.

## Development Merge Requests

For day-to-day development, we isolate our work in `feat-*`, `issue-*`, `hotfix-*` or `dev-[user]/*` branches and merge these into temporary `merge` branches. 

* Create your `merge-*` branch locally by combining the most up-to-date `dev` with your `[topic]` or `[id]` working branch.

* Push your new `merge-*` branch to GitLab, then create a Merge Request onto  `dev` . Name the merge request title **WIP: [Type]: [Description]**, where [Type] is `feat`, `issue`, or `hotfix` and [Description] identifies what meaningful change is occuring. For example: "WIP: Feature: Add Video Streaming Prototype".

* Use this template as a guide for writing your merge request:
  ```
  Short introductory description of merge request features, listing:
  * new features
  * improvements
  * bug fixes

  ## HOW TO TEST
  Short and clear instructions for seeing the new features and testing the improvement, etc.
  cd gsgo
  npm run bootstrap
  npm run script

  Test A
  * Go to A
  * Click on B
  * You will see C
  etc

  ## BACKGROUND (OPTIONAL)
  A longer technical description of the problem
  ### High Level technical overview of challenge
  ### Mitigation/Approach 
  ### Key systems built or modified
  ### Modification / tweaking guide / Files
  ```
  
* To test, pull a new repo instance and do the installation instructions, and follow the test procedure in the merge request. 

* When you are satisfied that you are ready to proceed, remove the "WIP:" prefix from the merge request.

* Accept the merge request or have someone accept it for you. Delete the source `merge-*` branch.

## Master Branch Updates

Updating Master branch happens when we decide that significant new features have been added to warrant a **release** of a new version. This is performed on your local machine by a privileged maintained (Sri or Ben) and pushed directly to master.

* Pull the the lastest versions of `dev` and `master`  to your machine
* Merge `dev` onto `master` using fast forward (?), and test that it works
* ? do you need to commit also ?
* `lerna version prerelease` will create the next tag and push it up to `origin:master`

## [WIP] Release Branch Updates

The Release branch is for specific snapshots of the code. This is done on GitLab using **squash merges**. We retain all history in `dev` and `master`, but we don't want this in the Release branch.

* On GitLab, create a merge request of  `master` on `release`. Do this right after performing the *Master Branch Update*.







