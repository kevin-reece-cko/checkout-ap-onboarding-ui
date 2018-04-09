## Deploy

A nice way of deploying to gh-pages has been described [here](http://pressedpixels.com/articles/deploying-to-github-pages-with-git-worktree/).

In order to setup git worktree, run the following command:
```bash
git worktree add dist/ gh-pages
```

An issue is that `npm run build` actually deletes the `build/` folder, while `git worktree` needs the `.git` folder inside `build/` to work proberly. Workaround is to create a `dist` folder, copy the results of `build/` folder in there and run the following command.

```bash
cd dist
git add --all
git commit -m 'Deploy.'
git push
```