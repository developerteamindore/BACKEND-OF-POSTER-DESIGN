import { Request, Response } from "express"
import { getOpenAI, OPENAI_IMAGE_MODEL } from "../lib/openai"
import { SYSTEM_PROMPT } from "../lib/systemPrompt"
import { isValidBase64 } from "../lib/imageUtils"
import { pdfToBase64Image } from "../lib/pdfToImage"
import type { EditRequest, EditResponse } from "../types"

export async function editPoster(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as EditRequest
    let { posterBase64, mimeType, branding } = body

    // Convert PDF to image if needed
    if (mimeType?.toLowerCase() === 'application/pdf') {
      console.log('Converting PDF to image...')
      console.log('Base64 length:', posterBase64?.length)
      
      try {
        const pdfBuffer = Buffer.from(posterBase64, 'base64')
        console.log('PDF buffer size:', pdfBuffer.length)
        
        const converted = await pdfToBase64Image(pdfBuffer)
        posterBase64 = converted.base64
        mimeType = converted.mimeType
        console.log('PDF converted successfully, new mimeType:', mimeType)
      } catch (pdfError) {
        console.error('PDF conversion failed:', pdfError)
        res.status(400).json({
          success: false,
          error: `PDF conversion failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`
        } as EditResponse)
        return
      }
    }

    // Validate that PDF was converted to image
    if (mimeType?.toLowerCase() === 'application/pdf') {
      res.status(400).json({
        success: false,
        error: 'PDF was not converted to image. Conversion may have failed silently.'
      } as EditResponse)
      return
    }

    if (!posterBase64 || !branding?.companyName || !branding?.website || !branding?.phone) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: poster, company name, website, or phone."
      } as EditResponse)
      return
    }

    if (!isValidBase64(posterBase64)) {
      res.status(400).json({
        success: false,
        error: "Invalid image data. Please upload a valid image file."
      } as EditResponse)
      return
    }

    if (branding.logoBase64 && !isValidBase64(branding.logoBase64)) {
      res.status(400).json({
        success: false,
        error: "Invalid logo image data. Please upload a valid logo file."
      } as EditResponse)
      return
    }

    const userTextBlock = `Please edit this poster with the following branding details:

- Company Name: ${branding.companyName}
- Website: ${branding.website}
- Phone Number: ${branding.phone}
${branding.socials ? `• Social Handles: ${branding.socials}` : ""}
${branding.headingText ? `• Replace Image Header/Heading with: ${branding.headingText}` : ""}
${branding.brandColors ? `• Brand Colors: ${branding.brandColors}` : ""}
${
  branding.logoBase64
    ? "• A logo has been provided as the second image above. Place it in the footer area. Do NOT add separate company name text if the logo already contains the company name."
    : "• No logo provided — use Company Name text only in the branding area."
}

Apply all rules from your instructions. Edit ONLY the footer/contact/branding section.
Keep everything else exactly as it is in the original design.`

    const response = await getOpenAI().responses.create({
      model: OPENAI_IMAGE_MODEL,
      instructions: SYSTEM_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${posterBase64}`,
            },
            ...(branding.logoBase64
              ? [
                  {
                    type: "input_image" as const,
                    image_url: `data:image/png;base64,${branding.logoBase64}`,
                  },
                ]
              : []),
            {
              type: "input_text",
              text: userTextBlock,
            },
          ],
        },
      ],
      tools: [
        {
          type: "image_generation",
          action: "edit",
          quality: "high",
        },
      ],
    } as unknown as Parameters<ReturnType<typeof getOpenAI>["responses"]["create"]>[0])

    const result = response as { output?: Array<{ type: string; result?: string }> }
    const imageBlock = result.output?.find(
      (block) => block.type === "image_generation_call"
    )
    const editedImageBase64 = imageBlock?.result ?? null

    if (!editedImageBase64) {
      res.status(500).json({
        success: false,
        error: "No image returned from AI"
      } as EditResponse)
      return
    }

    res.json({ success: true, editedImageBase64 } as EditResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({ success: false, error: message } as EditResponse)
  }
}
