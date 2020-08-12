# Setting up Sourcetree

We have been using Sourcetree as our graphical user interface for Git instead of the command line. While it's not the most intuitive GUI out there, it's free and maps well to Git command-line use. It was good for us to learn how to use Git.

Here's a quick primer on how to set it up on the Macintosh running macos 10.14.x or later.

## 1. Install Sourcetree

Search for it in google and download it. You'll have to make an Atlassian account (the publisher of Sourcetree) to download it. 

## 2. Clone to the Repo

To find the URL to clone from, browse to [gsgo repo](https://gitlab.com/stepsys/gem-step/gsgo) and click the CLONE button to grab the "clone with https" link: `https://gitlab.com/stepsys/gem-step/gsgo.git`

#### In Sourcetree:

* click "New" at the upper left and choose "Clone from URL"
* Enter Source URL: `https://gitlab.com/stepsys/gem-step/gsgo.git` 
* Enter Destination Path, or click the browser button (looks like ...) and choose directory. Note that Sourcetree will not create a directory for you, so make the subdirectory if you need it.
* Enter Name: This is used in the Sourcetree Repo Browser

#### Add an account:

Source tree will say you don't have an account, so you will add one for gitlab.com. Add an account and fill in the user,password stuff...but wait! There are some **tricks** to this!

**Instead** of entering your gitlab.com credentials, you need to use a different set. They are not the same thing! In short, you are using `git@gitlab.com` as the username and a password that is a "personal access token" generated on the Gitlab.com website.

To generate the token: 

1. On GitLab.com and under SETTINGS choose "Personal Access Token".
2. Create the token, giving it a descriptive name like "My MacMini". You can specify how long it will be available before it expires.
3. Copy the token and paste it in into the PASSWORD field of account creation dialog.

You also need to specify a pair of **ssh keys**. You can click GENERATE KEY PAIR and it will use this. If you enter a passphrase for the keypair (optional), be sure to write it down somewhere. Log the token you generated and the computer you installed it on, as well as the name of the key pair files (located in `~/.ssh`)

After that's all done, it should work. The repo will appear in Sourcetree and you can proceed to CHECKOUT whatever branch you need from `origin`.


