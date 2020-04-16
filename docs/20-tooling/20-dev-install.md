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

1. enter `./scripts/install-helper.sh`
2. read the output to see what to do!

## 1. (Optional) Install Recommended Code Editor

If you are planning to edit any source files in GEM-STEP, then you should also install [Visual Studio Code](https://code.visualstudio.com/Download) (VSCode). This is our official code editor that supports our development requirements, and is available on all major platforms.

After you've installed VSCode, use the FILE menu to open the workspace named `gsgo/gsgo.code-workspace`. This workspace has project-specific settings in it.
After you open the workspace, you should use this for all future editing within the project. 

The first time you open the gsgo workspace, you will be prompted on what RECOMMENDED EXTENSIONS to install. You will have to install these manually by going to the EXTENSIONS tab on the left-side vertical panel.

For more information about what these extensions are doing, see [`20-tooling/20-vscode-qol.md`](20-vscode-qol.md). 

## **NEXT:** [RUNNING GEM-STEP](20-dev-running.md)



