# "Portable" dev environment installer for GEMSTEP
# based on
# https://github.com/netcreateorg/netcreate-2018/wiki/Installation-Guide

# what kind of machine are we running on?
# abort if it's not a supported machine
case "$(uname -s)" in
    Linux*)     MACHINE=Linux
                echo "Linux is untested with this script. Aborting."
                exit 1
                ;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin
                echo "Cygwin is untested with this script. Aborting."
                exit 1
                ;;
    MINGW*)     MACHINE=MinGw
                echo "MinGw is untested with this script. Aborting."
                exit 1
                ;;
    *)          MACHINE="UNKNOWN"
                echo "Unknown machine $(uname -s)"
                exit 1
                ;;
esac
echo 
echo "*** DETECTED MACHINE: ${MACHINE} ***"
echo
echo "--- CHECKING PREREQUISITES ---"
echo
if [[ "$(xcode-select -p 1>/dev/null;echo $?)" -ne "0" ]]; then
    echo "xcode-select --install"
else
    echo "OK: xcode cli already installed"
fi

if ! [ -d ~/dev ]; then
    echo "... creating ~/dev/ directory..."
    echo "... cd ~ && mkdir dev"
else
    echo "OK: ~/dev directory already exists"
fi

# check for shell version, and create profile if necessary
# NOTE: $SHELL contains the current shell (e.g. /bin/bash)
case $SHELL in 
    /bin/bash)
        if [ ! -e ~/.bash_profile ]; then
            echo "... touch ~/.bash_profile"
        else
            echo "OK: sourcing ~/.bash_profile..."
            source ~/.bash_profile
        fi
        ;;
    /bin/zsh)
        if [ ! -e ~/.zshrc ]; then
            echo "... touch ~/.zshrc"
        else
            echo "OK: sourcing ~/.zshrc..."
            source ~/.zshrc
        fi
        ;;
    *)
        echo "ERROR: unknown shell $SHELL...aborting"
        exit 1
        ;;
esac

# check that .nvm directory exists
if ! [ -d ~/.nvm ]; then
    echo ".. mkdir ~/.nvm"
else
    echo "OK: ~/.nvm directory already exists"
fi

exists() { 
    command -v "$1" >/dev/null 2>&1 
}

# check that nvm is actually installed
if ! exists nvm; then 
    echo "... mkdir ~/.nvm"
    echo "... curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash"
    echo
    echo "*** QUIT THIS TERMINAL and REOPEN"
    echo "*** rerun this script to continue"
    echo
    exit 0
else
    echo "OK: nvm is already installed"
fi

# this is just cool...we're not using it though
# The absolute, canonical ( no ".." ) path to this script
# https://unix.stackexchange.com/a/76604
scriptpath=$(cd -P -- "$(dirname -- "$0")" && printf '%s\n' "$(pwd -P)/$(basename -- "$0")")
scriptdir=$(cd -P -- "$(dirname -- "$0")" && printf '%s\n' "$(pwd -P)")

# now set the correct version type
# this script is running from the repo dir "scripts" directory, so bump up a level
node_version=`cat $scriptdir/../.nvmrc`
echo
echo "--- NODE VERSION TO INSTALL: $node_version ---"
echo
echo "... nvm install $node_version"
echo "... nvm default $node_version"
echo "... cd $scriptdir/.."
echo "... nvm use"

# now initialize the repo for the first time
echo
echo "--- INITIALIZING MONOREPO ---"
echo
echo "... npm ci"
echo "... npm run bootstrap"
echo
echo "--- SETUP COMPLETE ---"
echo "you do not need to run this script again"
echo
echo "*** COMMANDS TO TRY ***"
echo "    npm start     - start all available servers"
echo "    npm run app   - run just the app server"
echo "    npm run gem   - run just the gemstep wireframe"
echo "    npm run admin - run just the admin server"
echo