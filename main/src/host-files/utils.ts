import fs from 'fs/promises'

export async function guessFileLocation (entries: Iterable<string>): Promise<string | null> {
  let found: string | null = null
  for (const path of entries) {
    try {
      await fs.access(path, fs.constants.R_OK)
      if (found != null) {
        // don't allow multiple matches (i.e. standalone + Steam)
        return null
      } else {
        found = path
      }
    } catch {}
  }
  return found
}
