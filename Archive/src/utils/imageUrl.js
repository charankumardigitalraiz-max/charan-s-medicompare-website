import { imgUrl } from "../Apiservice";


export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // Convert to string if it's not already
  const path = typeof imagePath === 'string' ? imagePath : imagePath?.url || imagePath?.toString() || "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Return local public assets directly without prepending API host
  if (path.startsWith("/assets/") || path.startsWith("/medicine.jpg")) {
    return path;
  }

  // If it starts with / or has an image extension, prepend img_url
  if (
    path.startsWith("/") ||
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(path)
  ) {
    return imgUrl + path;
  }

  // Default to path as is
  return path;
};