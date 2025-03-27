# How this works

There are 2 main parts of the app:

1. renderer: this is the HTML/Javascript-based UI rendered within the Electron container. This runs Vue.js, a React-like Javascript framework for rendering front-end.
2. main: includes the main app (written in Electron). Handles keyboard shortcuts, brings up the UI and overlays.

Note that these 2 both depend on each other, and one cannot run without the other.

# How to develop

The most up-to-date instructions can always be derived from CI:

[.github/workflows/main.yml](https://github.com/Kvan7/exiled-exchange-2/blob/master/.github/workflows/main.yml)

Here's what that looks like as of 2023-12-03.

```shell
cd renderer
npm install
npm run make-index-files
npm run dev

# In a second shell
cd main
npm install
npm run dev
```

## Formatting

```shell
cd renderer
npm run format
```

# How to build

```shell
cd renderer
npm install
npm run make-index-files
npm run build

cd ../main
npm install
npm run build
# We want to sign with a distribution certificate to ensure other users can
# install without errors
CSC_NAME="Certificate name in Keychain" npm run package
```

# How to release a build

1. Commit all changes
2. Bump version in `main/package.json`
3. `npm i` in renderer & main (update `package-lock.json` with new version)
4. `npm run build` in renderer & main
5. Stage & commit bumped version
6. `git push`
7. `git tag vX.X.X`
8. `git push origin vX.X.X`
9. Open release page, create release with tag & title as text of tag & save as draft

# How to build yourself

```shell
sh testUpdate.sh
```

Read the contents of `testUpdate.sh` to understand what it does. Running random scripts from the internet is not recommended so you really should read the code before running it.
