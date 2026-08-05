// import { getOpenAI, OPENAI_IMAGE_MODEL } from "@/lib/openai"
// import { SYSTEM_PROMPT } from "@/lib/systemPrompt"
// import { isValidBase64 } from "@/lib/imageUtils"
// import type { EditRequest } from "@/types"

// export const maxDuration = 60

// export async function POST(request: Request) {
//   try {
//     const body = (await request.json()) as EditRequest
//     const { posterBase64, mimeType, branding } = body

//     if (!posterBase64 || !branding?.companyName || !branding?.website || !branding?.phone) {
//       return Response.json(
//         { success: false, error: "Missing required fields: poster, company name, website, or phone." },
//         { status: 400 }
//       )
//     }

//     if (!isValidBase64(posterBase64)) {
//       return Response.json(
//         { success: false, error: "Invalid image data. Please upload a valid image file." },
//         { status: 400 }
//       )
//     }

//     if (branding.logoBase64 && !isValidBase64(branding.logoBase64)) {
//       return Response.json(
//         { success: false, error: "Invalid logo image data. Please upload a valid logo file." },
//         { status: 400 }
//       )
//     }

//     const userTextBlock = `Please edit this poster with the following branding details:

// - Company Name: ${branding.companyName}
// - Website: ${branding.website}
// - Phone Number: ${branding.phone}
// ${branding.socials ? `• Social Handles: ${branding.socials}` : ""}
// ${branding.headingText ? `• Replace Image Header/Heading with: ${branding.headingText}` : ""}
// ${branding.brandColors ? `• Brand Colors: ${branding.brandColors}` : ""}
// ${
//   branding.logoBase64
//     ? "• A logo has been provided as the second image above. Place it in the footer area. Do NOT add separate company name text if the logo already contains the company name."
//     : "• No logo provided — use Company Name text only in the branding area."
// }

// Apply all rules from your instructions. Edit ONLY the footer/contact/branding section.
// Keep everything else exactly as it is in the original design.`

//     const response = await getOpenAI().responses.create({
//       model: OPENAI_IMAGE_MODEL,
//       instructions: SYSTEM_PROMPT,
//       input: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "input_image",
//               image_url: `data:${mimeType};base64,${posterBase64}`,
//             },
//             ...(branding.logoBase64
//               ? [
//                   {
//                     type: "input_image" as const,
//                     image_url: `data:image/png;base64,${branding.logoBase64}`,
//                   },
//                 ]
//               : []),
//             {
//               type: "input_text",
//               text: userTextBlock,
//             },
//           ],
//         },
//       ],
//       tools: [
//         {
//           type: "image_generation",
//           action: "edit",
//           quality: "high",
//         },
//       ],
//     } as unknown as Parameters<ReturnType<typeof getOpenAI>["responses"]["create"]>[0])

//     const result = response as { output?: Array<{ type: string; result?: string }> }
//     const imageBlock = result.output?.find(
//       (block) => block.type === "image_generation_call"
//     )
//     const editedImageBase64 = imageBlock?.result ?? null

//     if (!editedImageBase64) {
//       return Response.json(
//         { success: false, error: "No image returned from AI" },
//         { status: 500 }
//       )
//     }

//     return Response.json({ success: true, editedImageBase64 })
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Unknown error"
//     return Response.json({ success: false, error: message }, { status: 500 })
//   }
// }
