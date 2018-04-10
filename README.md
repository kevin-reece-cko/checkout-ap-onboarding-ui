# checkout-ap-onboarding-ui

This is a generic onboarding client for AP services implementing the `onboard` link relation as outlined in the corresponding chapter of the [AP specification](https://github.com/CKOTech/checkout-ap/tree/feature/onboarding#onboarding).

It uses [react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form) to dynamically render the input forms of the necessary onboarding fields.

It uses curies to fetch the actual JSON Schema files through the `onboard` link relation. If `$APService` is the URL of the actual AP service the following request are made:

 - `GET $APService/` - Root discovery, checks for `onboard` link relation.
 - `GET $APService/relations/gw/onboard` - Reads the Swagger path object associated with the `onboard` link relation
 - `GET put.parameters[0].schema["$ref"]`- i.e. it assumes the actual schema is referenced in the path object through the `$ref` keyword and tries to get it.
- Once it got the schema, it passes it to `react-jsonschema-form` to render the actual form.


You'll note that this is still quiet a big hackery:

- It directly hits the internal API which is HTTP only. As such due to mixed-content policy this react app has to be served over HTTP as well.
- I didn't find a way to use curies without names. So currently, this app assumes the `onboard` link relation in the `gw` curie, even though it's not called `gw:onboard`.
- This implementation only covers the very-happy path so far. No error checks whatsoever
- My first ever React app. Yay!

## Deploy on GitHub pages

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