## Remove history from git

The entire repo history is stored in the `.git` subdirectory, so removed it and then re-initialize the directory. This might be useful for making a zip archive of a particular point in time (though for that `git archive` is probably better). 

```
-- Remove the history from 
rm -rf .git

-- recreate the repos from the current content only
git init
git add .
git commit -m "Initial commit"

-- push to the github remote repos ensuring you overwrite history
git remote add origin git@github.com:<YOUR ACCOUNT>/<YOUR REPOS>.git
git push -u --force origin master
```

