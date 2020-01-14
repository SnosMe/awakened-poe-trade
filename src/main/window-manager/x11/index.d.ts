import { EventEmitter } from 'events'

export interface Display {
  client: XClient
  screen: Screen[]
}

export type Atom = number
export type Window = number

export class XClient extends EventEmitter {
  display: Display
  atoms: Readonly<StdAtoms>

  GetAtomName(atom: Atom, cb: (err: Error | null, name: string) => void): void

  InternAtom(onlyIfExists: boolean, name: string, cb: (err: Error | null, atom: Atom) => void): void

  GetProperty(
    remove: 0 | 1,
    window: Window,
    propertyAtom: Atom,
    typeAtom: Atom,
    offset: number,
    length: number,
    cb: (err: Error | null, prop: { data: Buffer, type: Atom }) => void): void

  GetGeometry(window: Window, cb: (err: Error | null, geom: WindowGeometry) => void): void

  TranslateCoordinates(srcWindow: Window, destWindow: Window, srcX: number, srcY: number, cb: (err: Error | null, trans: TranslatedCoordinates) => void): void
}

export interface TranslatedCoordinates {
  sameScreen: 0 | 1
  child: Window
  destX: number
  destY: number
}

export interface WindowGeometry {
  windowid: Window
  xPos: number
  yPos: number
  width: number
  height: number
  borderWidth: number
  depth: number
}

interface CreateClientOptions {
  display?: string
  disableBigRequests?: boolean
}

interface CreateClient {
  (options: CreateClientOptions, initCb?: (err: Error | null, display: Display) => void): XClient
  (initCb?: (err: Error | null, display: Display) => void): XClient
}

export const createClient: CreateClient

interface Screen { /* eslint-disable camelcase */
  root: Window
  default_colormap: number
  white_pixel: number
  black_pixel: number
  input_masks: number
  pixel_width: number
  pixel_height: number
  mm_width: number
  mm_height: number
  min_installed_maps: number
  max_installed_maps: number
  root_visual: number
  root_depth: number
  backing_stores: number
  depths: object
}

export const CopyFromParent: number
export const InputFocus: number
export const InputOnly: number
export const InputOutput: number
export const PointerWindow: number

export const eventMask: {
  Button1Motion: number
  Button2Motion: number
  Button3Motion: number
  Button4Motion: number
  Button5Motion: number
  ButtonMotion: number
  ButtonPress: number
  ButtonRelease: number
  ColormapChange: number
  EnterWindow: number
  Exposure: number
  FocusChange: number
  KeyPress: number
  KeyRelease: number
  KeymapState: number
  LeaveWindow: number
  OwnerGrabButton: number
  PointerMotion: number
  PointerMotionHint: number
  PropertyChange: number
  ResizeRedirect: number
  StructureNotify: number
  SubstructureNotify: number
  SubstructureRedirect: number
  VisibilityChange: number
}

interface StdAtoms {
  PRIMARY: number
  SECONDARY: number
  ARC: number
  ATOM: number
  BITMAP: number
  CARDINAL: number
  COLORMAP: number
  CURSOR: number
  CUT_BUFFER0: number
  CUT_BUFFER1: number
  CUT_BUFFER2: number
  CUT_BUFFER3: number
  CUT_BUFFER4: number
  CUT_BUFFER5: number
  CUT_BUFFER6: number
  CUT_BUFFER7: number
  DRAWABLE: number
  FONT: number
  INTEGER: number
  PIXMAP: number
  POINT: number
  RECTANGLE: number
  RESOURCE_MANAGER: number
  RGB_COLOR_MAP: number
  RGB_BEST_MAP: number
  RGB_BLUE_MAP: number
  RGB_DEFAULT_MAP: number
  RGB_GRAY_MAP: number
  RGB_GREEN_MAP: number
  RGB_RED_MAP: number
  STRING: number
  VISUALID: number
  WINDOW: number
  WM_COMMAND: number
  WM_HINTS: number
  WM_CLIENT_MACHINE: number
  WM_ICON_NAME: number
  WM_ICON_SIZE: number
  WM_NAME: number
  WM_NORMAL_HINTS: number
  WM_SIZE_HINTS: number
  WM_ZOOM_HINTS: number
  MIN_SPACE: number
  NORM_SPACE: number
  MAX_SPACE: number
  END_SPACE: number
  SUPERSCRIPT_X: number
  SUPERSCRIPT_Y: number
  SUBSCRIPT_X: number
  SUBSCRIPT_Y: number
  UNDERLINE_POSITION: number
  UNDERLINE_THICKNESS: number
  STRIKEOUT_ASCENT: number
  STRIKEOUT_DESCENT: number
  ITALIC_ANGLE: number
  X_HEIGHT: number
  QUAD_WIDTH: number
  WEIGHT: number
  POINT_SIZE: number
  RESOLUTION: number
  COPYRIGHT: number
  NOTICE: number
  FONT_NAME: number
  FAMILY_NAME: number
  FULL_NAME: number
  CAP_HEIGHT: number
  WM_CLASS: number
  WM_TRANSIENT_FOR: number
}
