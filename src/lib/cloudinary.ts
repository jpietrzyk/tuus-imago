export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset',
};

export const getCloudinaryUrl = (publicId: string, options?: Record<string, string | number>): string => {
  const transformationOptions = options || {};
  const queryString = Object.keys(transformationOptions)
    .map((key) => `${key}=${encodeURIComponent(String(transformationOptions[key]))}`)
    .join('&');

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${publicId}${
    queryString ? `?${queryString}` : ''
  }`;
};
