const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' }); // Temporary local storage before uploading to Cloudinary

const uploadFileToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'workspace_assets',
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    
    const secureUrl = await uploadFileToCloudinary(req.file);
    const prisma = require('../utils/prisma');

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl: secureUrl }
    });

    res.status(200).json({ url: secureUrl });
  } catch (error) {
    console.error('Avatar Upload Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const secureUrl = await uploadFileToCloudinary(req.file);
    res.status(200).json({ url: secureUrl });
  } catch (error) {
    console.error('Attachment Upload Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  upload,
  uploadAvatar,
  uploadAttachment
};
