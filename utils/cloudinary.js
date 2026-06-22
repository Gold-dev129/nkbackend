const cloudinary = require('../config/cloudinary');

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} - Cloudinary upload result object
 */
const uploadSingleImage = (fileBuffer, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `nkyluxury/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of files from Multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<Array<string>>} - Array of secure URLs of uploaded images
 */
const uploadMultipleImages = async (files, folder = 'products') => {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = files.map(file => uploadSingleImage(file.buffer, folder));
  const results = await Promise.all(uploadPromises);
  return results.map(result => result.secure_url);
};

/**
 * Extract Cloudinary public ID from its secure URL
 * @param {string} url - Cloudinary image URL
 * @returns {string} - Public ID
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return '';
  // Extract public ID from: https://res.cloudinary.com/.../v123456789/nkyluxury/products/xyz.png
  const parts = url.split('/');
  const nkyluxuryIndex = parts.indexOf('nkyluxury');
  if (nkyluxuryIndex === -1) return '';
  
  const publicIdWithExtension = parts.slice(nkyluxuryIndex).join('/');
  // Remove file extension (e.g. .jpg, .png, .webp)
  return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
};

/**
 * Delete image from Cloudinary by its URL
 * @param {string} url - Cloudinary secure URL
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return null;
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

const uploadSingleVideo = (fileBuffer, folder = 'custom_inquiries') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `nkyluxury/${folder}`,
        resource_type: 'video'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleVideo,
  deleteImage,
  getPublicIdFromUrl
};
