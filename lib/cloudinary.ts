export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default",
};

export interface UploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  resource_type: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder?: string
): Promise<UploadResult | null> => {
  if (!cloudinaryConfig.cloudName) {
    console.warn("Cloudinary cloud name not configured");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

export const uploadThumbnailToCloudinary = async (
  file: File
): Promise<string | null> => {
  const result = await uploadToCloudinary(file, "thumbnails");
  return result?.secure_url || null;
};

export const uploadArticleImageToCloudinary = async (
  file: File
): Promise<string | null> => {
  const result = await uploadToCloudinary(file, "article-images");
  return result?.secure_url || null;
};

export const uploadArticleVideoToCloudinary = async (
  file: File
): Promise<string | null> => {
  const result = await uploadToCloudinary(file, "article-videos");
  if (result?.resource_type === "video") {
    return result.secure_url;
  }
  return null;
};

export const getCloudinaryUrl = (publicId: string, options?: {
  width?: number;
  height?: number;
  format?: string;
  quality?: string;
}): string => {
  const { cloudName } = cloudinaryConfig;
  const transforms = [];
  
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.format) transforms.push(`f_${options.format}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);
  
  const transformString = transforms.length > 0 ? transforms.join(",") + "/" : "";
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
};