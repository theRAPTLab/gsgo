# Dev Environment Setup

## Installing the Development Environment

If you are installing on a clean MacOS Mojave or later system:

1. open **Terminal** app
2. enter `xcode-select --install` (accept dialog box, then wait for install to complete)
3. enter `cd ~; mkdir dev` (creates a 'dev' directory in your user folder)

Now download the repo:

1. enter `cd ~/dev`
2. enter `git clone https://gitlab.com/stepsys/gem-step/gsgo`
3. enter `cd gsgo`

At this point you can run the script to set everything up. It currently doesn't actually do the commands for you, but it lists all the things you should do.

1. enter `scripts/install-mac.sh`
2. read the output to see what to do!

