const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false
  
  // Remove data URL prefix if present
  const base64 = str.includes(",") ? str.split(",")[1] : str
  
  // Check if the string is valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  if (!base64Regex.test(base64)) return false
  
  // Try to decode it to ensure it's valid
  try {
    const decoded = Buffer.from(base64, "base64")
    return decoded.length > 0
  } catch {
    return false
  }
}

export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`
}

export function validateImageFile(
  file: File,
  maxMb: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    }
  }

  const maxBytes = maxMb * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxMb} MB.`,
    }
  }

  return { valid: true }
}

export function getImageDimensions(
  buffer: Buffer
): { width: number; height: number } {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      const length = buffer.readUInt16BE(offset + 2)
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      offset += 2 + length
    }
  }

  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunk = buffer.toString("ascii", 12, 16)
    if (chunk === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      }
    }
    if (chunk === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21)
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      }
    }
  }

  return { width: 1024, height: 1024 }
}

export function computeOutputSize(
  width: number,
  height: number
): { width: number; height: number } {
  const maxDim = 1024
  const minDim = 256
  const maxAllowed = 1920

  let w = width
  let h = height

  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }

  w = Math.max(minDim, Math.min(maxAllowed, w))
  h = Math.max(minDim, Math.min(maxAllowed, h))
  w = Math.round(w / 8) * 8
  h = Math.round(h / 8) * 8

  return { width: Math.max(minDim, w), height: Math.max(minDim, h) }
}
