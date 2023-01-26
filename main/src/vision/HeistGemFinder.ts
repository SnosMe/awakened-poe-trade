import fs from 'fs/promises'
import Bmp from '@wokwi/bmp-ts'
import * as Bindings from './wasm-bindings'
import { cv, tessApi } from './wasm-bindings'
import {
  findNonZeroWeights,
  groupWeightedPoints,
  findLines,
  hsvToU8,
  timeIt,
  ImageData
} from './utils'

const REFERENCE_HEIGHT = 600
const TEMPLATE_THRESHOLD = 0.75
const LINE_Y_DIST_TOLERANCE = 4
const TEXT_HSV_MIN = hsvToU8(173, 31, 31)
const TEXT_HSV_MAX = hsvToU8(180, 100, 100)

interface OcrResult {
  elapsed: number
  matches: number
  clusters: number
  linesMin: number
  linesMax: number
  recognized: Array<{ text: string, confidence: number }>
}

export class HeistGemFinder {
  private constructor (
    private readonly needleMat: any,
    private readonly hsvMin: any,
    private readonly hsvMax: any
  ) {}

  static async create (binDir: string): Promise<HeistGemFinder> {
    const needleImg = Bmp.decode(await fs.readFile(binDir + '/heist-lock.bmp'), { toRGBA: true })
    const needleMat = Bindings.cvMatFromImage(needleImg)
    cv.cvtColor(needleMat, needleMat, cv.COLOR_RGBA2GRAY)

    const hsvMin = new cv.Mat(3, 1, cv.CV_8U)
    hsvMin.data.set(TEXT_HSV_MIN)
    const hsvMax = new cv.Mat(3, 1, cv.CV_8U)
    hsvMax.data.set(TEXT_HSV_MAX)

    return new HeistGemFinder(needleMat, hsvMin, hsvMax)
  }

  ocrScreenshot (screenshot: ImageData): OcrResult {
    let elapsed = 0
    const colorMat = Bindings.cvMatFromImage(screenshot)

    const scale = screenshot.height / REFERENCE_HEIGHT
    const graySize = new cv.Size(Math.floor(screenshot.width / scale), REFERENCE_HEIGHT)
    const grayMat = new cv.Mat()
    elapsed += timeIt(() => {
      if (scale > 2.1) {
        cv.resize(colorMat, grayMat, new cv.Size(graySize.width * 2, graySize.height * 2), 0, 0, cv.INTER_LINEAR)
        cv.resize(grayMat, grayMat, new cv.Size(graySize.width, graySize.height), 0, 0, cv.INTER_LINEAR)
      } else {
        cv.resize(colorMat, grayMat, new cv.Size(graySize.width, graySize.height), 0, 0, cv.INTER_LINEAR)
      }
      cv.cvtColor(grayMat, grayMat, cv.COLOR_BGR2GRAY)
    })

    const { needleMat } = this
    const matchesMat = grayMat
    let matches: ReturnType<typeof findNonZeroWeights>
    elapsed += timeIt(() => {
      cv.matchTemplate(grayMat, needleMat, matchesMat, cv.TM_CCOEFF_NORMED)
      cv.threshold(matchesMat, matchesMat, TEMPLATE_THRESHOLD, 1, cv.THRESH_TOZERO)
      matches = findNonZeroWeights(matchesMat)
    })
    matchesMat.delete()
    const clusteredMatches = groupWeightedPoints(matches!, Math.hypot(needleMat.cols, needleMat.rows))
    const lines = findLines(clusteredMatches, LINE_Y_DIST_TOLERANCE)

    const recognizedLines: OcrResult['recognized'] = []
    for (const line of lines) {
      const topLeft = new cv.Point(
        (Math.min(line[0].x, line[1].x) + needleMat.cols) * scale,
        (Math.min(line[0].y, line[1].y) - 1) * scale)
      const bottomRight = new cv.Point(
        Math.max(line[0].x, line[1].x) * scale,
        (Math.max(line[0].y, line[1].y) + needleMat.rows) * scale)

      const roiSize = new cv.Size(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y)
      const roiRect = new cv.Rect(topLeft, roiSize)
      const roiColor = colorMat.roi(roiRect)
      const roiHsv = new cv.Mat()

      elapsed += timeIt(() => {
        cv.cvtColor(roiColor, roiHsv, cv.COLOR_BGR2HSV_FULL)
        cv.inRange(roiHsv, this.hsvMin, this.hsvMax, roiHsv)
        cv.bitwise_not(roiHsv, roiHsv)
      })
      roiColor.delete()

      Bindings.ocrSetImage(roiHsv.data, roiHsv.cols, roiHsv.rows, roiHsv.channels())
      roiHsv.delete()
      tessApi.SetVariable('tessedit_pageseg_mode', '7') // single line mode
      elapsed += timeIt(() => {
        tessApi.Recognize()
      })
      const text = tessApi.GetUTF8Text().trim()
      const confidence = tessApi.MeanTextConf()
      if (text.length > 0 && confidence > 30) {
        recognizedLines.push({ text, confidence })
      }
    }
    colorMat.delete()

    const linesWeight = lines.flatMap(([p0, p1]) => ([p0.weight, p1.weight]))
    const results = {
      elapsed,
      matches: matches!.length,
      clusters: clusteredMatches.length,
      linesMin: Math.min(...linesWeight),
      linesMax: Math.max(...linesWeight),
      recognized: recognizedLines
    }
    // console.log(results)
    return results
  }
}
