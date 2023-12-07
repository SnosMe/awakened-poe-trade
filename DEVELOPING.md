# How this works

There are 2 main parts of the app:

1. renderer: this is the HTML/Javascript-based UI rendered within the Electron container. This runs Vue.js, a React-like Javascript framework for rendering front-end.
2. main: includes the main app (written in Electron). Handles keyboard shortcuts, brings up the UI and overlays.

Note that these 2 both depend on each other, and one cannot run without the other.

# How to develop

The most up-to-date instructions can always be derived from CI:

[.github/workflows/main.yml](https://github.com/SnosMe/awakened-poe-trade/blob/master/.github/workflows/main.yml)

Here's what that looks like as of 2023-12-03.

```shell
cd renderer
yarn install
yarn make-index-files
yarn dev

# In a second shell
cd main
yarn install
yarn dev
```

# How to build

```shell
cd renderer
yarn install
yarn make-index-files
yarn build

cd ../main
yarn build
# We want to sign with a distribution certificate to ensure other users can
# install without errors
CSC_NAME="Certificate name in Keychain" yarn package
```
