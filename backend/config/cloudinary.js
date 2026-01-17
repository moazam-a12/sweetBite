const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

async function uploadImageToDrive(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

async function deleteImageFromDrive(imageUrl) {
  const publicId = imageUrl.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(`products/${publicId}`);
}

module.exports = {
  uploadImageToDrive,
  deleteImageFromDrive,
};
