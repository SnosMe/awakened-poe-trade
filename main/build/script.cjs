const path = require('path')
const child_process = require('child_process')
const electron = require('electron')
const esbuild = require('esbuild')

const isDev = !process.argv.includes('--prod')

const electronRunner = (() => {
  let handle = null
  return {
    restart () {
      console.info('Restarting Electron process.')

      if (handle) handle.kill()
      handle = child_process.spawn(electron, ['.'], {
        stdio: 'inherit'
      })
    }
  }
})()

const preloadBuild = esbuild.build({
  entryPoints: ['../ipc/preload.ts'],
  bundle: true,
  platform: 'node',
  external: ['electron'],
  outfile: 'dist/preload.js',
  watch: isDev
})

const mainBuild = esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: !isDev,
  platform: 'node',
  external: ['electron', 'uiohook-napi', 'electron-overlay-window'],
  outfile: 'dist/main.js',
  define: {
    'process.env.STATIC': (isDev) ? '"../build/icons"' : '"."',
    'process.env.VITE_DEV_SERVER_URL': (isDev) ? '"http://localhost:5173"' : 'null'
  },
  watch: (isDev)
    ? { onRebuild (error) { if (!error) electronRunner.restart() } }
    : false
})

Promise.all([
  preloadBuild,
  mainBuild
])
.then(() => { if (isDev) electronRunner.restart() })
.catch(() => process.exit(1))
