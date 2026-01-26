// Firebase storage functions for image uploads
import { storage } from "../config/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";

/**
 * Uploads an image file to Firebase Storage.
 * @param {File} file - The image file to upload.
 * @param {string} folder - The folder in storage to upload to (e.g., 'products').
 * @param {function} onProgress - Callback function to track upload progress (0-100).
 * @returns {Promise<{url: string, path: string}>} The download URL and storage path.
 */
export const uploadImageToFirebase = async (file, folder, onProgress) => {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, path: storageRef.fullPath });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Compresses an image file for web optimization.
 * @param {File} imageFile - The image file to compress.
 * @param {number} compressionLevel - Compression level (0.1 to 1.0, where 1.0 is no compression).
 * @param {number} maxWidth - Maximum width of the compressed image.
 * @param {number} maxHeight - Maximum height of the compressed image.
 * @returns {Promise<File>} The compressed image file.
 */
export const compressImage = async (imageFile, compressionLevel, maxWidth, maxHeight) => {
  const options = {
    maxSizeMB: compressionLevel, // Maximum file size in MB (after compression)
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
  };

  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.error("Image compression error:", error);
    throw error;
  }
};

/**
 * Deletes an image from Firebase Storage using its path.
 * @param {string} imagePath - The full path to the image in Firebase Storage.
 */
export const deleteImageFromFirebase = async (imagePath) => {
  const imageRef = ref(storage, imagePath);
  try {
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

/**
 * Extracts the Firebase storage path from a download URL.
 * @param {string} downloadURL - The download URL of the image.
 * @returns {string} The storage path.
 */
export const getFirebasePathFromURL = (downloadURL) => {
  // The path is contained between the bucket name and the token
  const bucketName = storage.app.options.storageBucket;
  const startIndex = downloadURL.indexOf(bucketName) + bucketName.length + 1;
  const endIndex = downloadURL.indexOf("?");
  return downloadURL.substring(startIndex, endIndex);
};
