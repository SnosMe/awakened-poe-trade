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

# How to build

```shell
cd renderer
npm install
npm run make-index-files
npm run build

cd ../main
npm run build
# We want to sign with a distribution certificate to ensure other users can
# install without errors
CSC_NAME="Certificate name in Keychain" yarn package
```
