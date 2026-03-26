import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Cloudinary storage — files go to mmh-leave-docs folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    // Determine resource type
    const isImage = file.mimetype.startsWith('image/')
    const isPDF   = file.mimetype === 'application/pdf'

    return {
      folder: 'mmh-hospital/leave-documents',
      resource_type: isImage ? 'image' : 'raw',
      public_id: `leave-doc-${Date.now()}`,
      // For PDFs and docs — raw type
      // For images — image type (auto-optimized)
      format: isPDF ? 'pdf' : undefined,
      // Allow view in browser (not force download)
      type: 'upload',
    } as any;
  },
})

// File type validation
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument'
      + '.wordprocessingml.document',
  ]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(
      'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'
    ))
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// Export cloudinary instance for delete operations
export { cloudinary }
