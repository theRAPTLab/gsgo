# Dev Environment Installer Helper for GEMSTEP
# Prints out recommended course of action for setting up
# the development requirements

echo
echo "GEMSTEP Dev Environment Installer Helper"
echo "This utility will determine what needs to be installed so you"
echo "can run GEMSTEP, then print a list of commands."

# output buffering utilities
OUT=()
CLI=()
pr() {
    OUT+=( "$1" )
}
prOut() {
    for t in "${OUT[@]}"; do
        echo $t
    done
}
cli() {
    CLI+=( "$1" )
}
cliOut() {
    for t in "${CLI[@]}"; do
        echo $t
    done    
}

# The absolute, canonical ( no ".." ) path to this script
# https://unix.stackexchange.com/a/76604
# But we're doing something a little different...
# the -P option means "avoid symbolic links"
scriptpath=$(cd -P -- "$(dirname -- "$0")" && printf '%s\n' "$(pwd -P)/$(basename -- "$0")")
scriptdir=$(cd -P -- "$(dirname -- "$0")" && printf '%s\n' "$(pwd -P)")

# this script is running from the repo dir "scripts" directory, so bump up a level
node_version=`cat $scriptdir/../.nvmrc`
# get absolute path of repo
cd $scriptdir
cd ..
repodir=$(printf '%s\n' "$(pwd -P)")

# NOTE! cwd is now running at the repo top level!
cli "cd $repodir"

pr
pr "CHECKING PREREQUISITES:"
pr

# what kind of machine are we running on?
# abort if it's not a supported machine
case "$(uname -s)" in
    Linux*)     MACHINE=Linux
                pr "Linux is untested with this script. Aborting."
                prOut
                exit 1
                ;;
    Darwin*)    MACHINE=Mac
                ;;
    CYGWIN*)    MACHINE=Cygwin
                pr "Cygwin is untested with this script. Aborting."
                prOut
                exit 1
                ;;
    MINGW*)     MACHINE=MinGw
                pr "MinGw is untested with this script. Aborting."
                prOut
                exit 1
                ;;
    *)          MACHINE="UNKNOWN"
                pr "Unknown machine $(uname -s)"
                prOut
                exit 1
                ;;
esac

pr "[X] supported machine: ${MACHINE}"

if [[ "$(xcode-select -p 1>/dev/null;echo $?)" -ne "0" ]]; then
    pr "[ ] XCODE-CLU installed"
    cli "xcode-select --install"
else
    pr "[X] XCODE CLU installed"
fi

# check for shell version, and create profile if necessary
# NOTE: $SHELL contains the current shell (e.g. /bin/bash)
case $SHELL in 
    /bin/bash)
        pr "[X] supported shell $SHELL"
        if [ ! -e ~/.bash_profile ]; then
            cli "touch ~/.bash_profile"
            pr "[ ] ~/.bash_profile exists"
        else
            pr "[X] $SHELL ~/.bash_profile exists"
            source ~/.bash_profile
        fi
        ;;
    /bin/zsh)
        pr "[X] supported shell $SHELL"
        if [ ! -e ~/.zshrc ]; then
            cli "touch ~/.zshrc"
            pr "[ ] $SHELL ~/.zshrc exists"
        else
            pr "[X] $SHELL ~/.zshrc exists"
            source ~/.zshrc
        fi
        ;;
    *)
        pr "ERROR: unknown shell $SHELL...aborting"
        prOut
        exit 1
        ;;
esac

# check that .nvm directory exists
if ! [ -d ~/.nvm ]; then
    cli "mkdir ~/.nvm"
    pr "[ ] ~/.nvm directory exists"
else
    pr "[X] ~/.nvm directory exists"
fi

exists() { 
    command -v "$1" >/dev/null 2>&1 
}

# check that nvm is actually installed
if ! exists nvm; then 
    pr "[ ] nvm is installed"
    cli "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash"
    cli "# after running curl, quit this terminal and reopen it, then rerun install helper"
    prOut
    cliOut
    exit 0
else
    pr "[X] nvm is installed"
fi

# final output
pr "[X] .nvmrc specifies Node $node_version"
pr
pr "RECOMMENDED INSTALLATION COMMANDS:"
pr "(copy and paste into the terminal)"
pr "vvv"
pr

# now set the correct version type
# finish generating cli output
cli "nvm install $node_version"
cli "nvm default $node_version"
cli "nvm use"

# now initialize the repo for the first time
cli "npm ci"
cli "npm run bootstrap"

prOut
cliOut

echo
echo "^^^"
echo "With luck your $MACHINE system can now run GEMSTEP! To test, type..."
echo
echo "  npm start"
echo
echo "...to launch all servers and then browse to localhost in the Chrome"
echo "browser. If you are a developer, we recommend using Visual Studio Code"
echo "to open the gsgo folder and install the suggested extensions to conform"
echo "to the dev team's code standards."
echo
echo "Enjoy! If you have questions just ask Sri!"
echo
