import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../firebase';

// Upload file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (files, pathPrefix) => {
  try {
    const uploadPromises = files.map((file, index) => {
      const filePath = `${pathPrefix}/${file.name}_${Date.now()}_${index}`;
      return uploadFile(file, filePath);
    });
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw error;
  }
};

// Get download URL for a file
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw error;
  }
};

// Delete file from Firebase Storage
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    throw error;
  }
};

// List all files in a directory
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const filePromises = result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        url
      };
    });
    return await Promise.all(filePromises);
  } catch (error) {
    throw error;
  }
};
