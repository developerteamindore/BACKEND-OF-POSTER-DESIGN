import * as pdfjsLib from 'pdfjs-dist'
import { createCanvas } from 'canvas'

// Set up PDF.js worker using local file
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.js')

export async function pdfToBase64Image(pdfBuffer: Buffer): Promise<{ base64: string; mimeType: string }> {
  try {
    // Convert Buffer to Uint8Array for pdfjs-lib
    const uint8Array = new Uint8Array(pdfBuffer)
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
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
  canvasContext: context,
  viewport: viewport,
  canvas: canvas
}).promise
    
    // Convert canvas to base64 (JPEG for smaller file size)
    const imageBuffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
    const base64 = imageBuffer.toString('base64')
    
    return {
      base64,
      mimeType: 'image/jpeg'
    }
  } catch (error) {
    throw new Error(`Failed to convert PDF to image: ${error instanceof Error ? error.message : String(error)}`)
  }
}
