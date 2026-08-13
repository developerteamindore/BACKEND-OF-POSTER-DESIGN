import { createCanvas } from '@napi-rs/canvas'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { pathToFileURL } from 'url'
import path from 'path'

// pdf.js needs a real filesystem worker/font path; it has no worker thread
// support on the main api build, and no CJS build, so both are wired up
// manually against the legacy (Node-targeted) build.
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
).href

// Metrics for the standard 14 fonts (e.g. Helvetica) when a PDF references
// them without embedding a font program. Must be a plain path ending in "/",
// not a file:// URL - pdf.js passes it straight to fs.readFile internally.
const standardFontDataUrl =
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts').replace(/\\/g, '/') + '/'

export async function pdfToBase64Image(pdfBuffer: Buffer): Promise<{ base64: string; mimeType: string }> {
  try {
    // Convert Buffer to Uint8Array for pdfjs-lib
    const uint8Array = new Uint8Array(pdfBuffer)

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array, standardFontDataUrl })
    const pdfDocument = await loadingTask.promise

    // Get the first page
    const page = await pdfDocument.getPage(1)

    // Calculate scale for high quality
    const scale = 2.0
    const viewport = page.getViewport({ scale })

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // Render PDF page to canvas
    await page.render({
  canvasContext: context as never,
  viewport: viewport,
  canvas: canvas as never
}).promise

    // Convert canvas to base64 (JPEG for smaller file size). @napi-rs/canvas
    // takes quality on a 0-100 scale, unlike the `canvas` package's 0-1.
    const imageBuffer = canvas.toBuffer('image/jpeg', 90)
    const base64 = imageBuffer.toString('base64')

    return {
      base64,
      mimeType: 'image/jpeg'
    }
  } catch (error) {
    throw new Error(`Failed to convert PDF to image: ${error instanceof Error ? error.message : String(error)}`)
  }
}
