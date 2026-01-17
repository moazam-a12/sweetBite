// backend/config/googleDrive.js
const { google } = require('googleapis');
const path = require('path');

// Path to your service account JSON file
const SERVICE_ACCOUNT_KEY_FILE = path.join(__dirname, '../services/service-account.json');

// Your Google Drive folder ID where images will be stored
// Get this from the Drive folder URL: https://drive.google.com/drive/folders/FOLDER_ID_HERE
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'your_drive_folder_id_here';

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Upload image to Google Drive
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} - Public image URL
 */
async function uploadImageToDrive(fileBuffer, fileName) {
  try {
    // Create file metadata
    const fileMetadata = {
      name: `product_${Date.now()}_${fileName}`,
      parents: [DRIVE_FOLDER_ID],
    };

    // Create media object
    const media = {
      mimeType: 'image/jpeg', // Adjust if needed
      body: require('stream').Readable.from(fileBuffer),
    };

    // Upload file
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = file.data.id;

    // Make file public (anyone with link can view)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return public URL
    return `https://drive.google.com/uc?id=${fileId}`;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete image from Google Drive
 * @param {string} imageUrl - Image URL to delete
 * @returns {Promise<void>}
 */
async function deleteImageFromDrive(imageUrl) {
  try {
    // Extract file ID from URL
    const fileId = imageUrl.split('id=')[1];
    if (!fileId) return;

    await drive.files.delete({
      fileId: fileId,
    });
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    // Don't throw error - deletion failure shouldn't block product operations
  }
}

module.exports = {
  uploadImageToDrive,
  deleteImageFromDrive,
  DRIVE_FOLDER_ID,
};