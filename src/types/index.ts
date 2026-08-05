export interface BrandingProfile {
  companyName: string
  website: string
  phone: string
  socials: string
  headingText?: string
  brandColors?: string
  logoBase64?: string
}

export interface EditRequest {
  posterBase64: string
  mimeType: string
  branding: BrandingProfile
}

export interface EditResponse {
  success: boolean
  editedImageBase64?: string
  error?: string
}
