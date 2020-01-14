import { WindowManager } from './WindowManager'

export let windowManager: WindowManager

export async function setupWindowManager () {
  windowManager = await WindowManager.createManager()
}
